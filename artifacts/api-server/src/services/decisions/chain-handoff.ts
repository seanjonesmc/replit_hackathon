import { eq } from "drizzle-orm";
import type { AuthorizeConfirmation, EngineDecision, WriteConfirmation } from "@workspace/chain";
import {
  authorizationsTable,
  bucketsTable,
  cardsTable,
  db,
  membersTable,
  merchantsTable,
  type Authorization,
  type AuthorizationDecision,
} from "@workspace/db";
import { logger } from "../../lib/logger";
import { findChainBucketId, findChainCardId } from "../blockchain";
import {
  markChainFailed,
  submitInBackground,
  type BackgroundSubmitDeps,
  type SubmissionOutcome,
} from "../events";

/**
 * The hand-off from the decision engine to Monad: `authorize` after a swipe
 * is stored, `capture` when a settlement run settles a held purchase. Both go
 * through the background-submission helper, so a swipe or a settlement never
 * waits on the chain, and a chain failure only marks the row's chain columns
 * `failed`: it never changes a decision or a balance.
 *
 * Capture pays the merchant's on-chain payout address, which the deploy seed
 * sets to the card issuer's wallet (`cardIssuerAddress`): the vault repays
 * the issuer, and the card network pays the merchant in dollars.
 */

const ENGINE_DECISION: Record<AuthorizationDecision, EngineDecision> = {
  APPROVED: "approve",
  REJECTED: "reject",
  PENDING: "pending",
};

/** What a skipped hand-off leaves behind: the row stays `not_submitted`. */
export type HandOffOutcome<C extends WriteConfirmation<object> = WriteConfirmation<object>> =
  | SubmissionOutcome<C>
  | { status: "skipped"; why: string };

/**
 * Authorize runs still in flight, by authorization id, so a capture fired
 * while its authorize is still being mined waits for it instead of failing.
 */
const authorizeRuns = new Map<number, Promise<unknown>>();

/** Everything `authorize` needs that the authorization row doesn't carry. */
async function loadChainInputs(authorization: Authorization, executor: BackgroundSubmitDeps["executor"]) {
  if (authorization.cardId === null || authorization.merchantId === null) return null;
  const [row] = await executor
    .select({
      merchantOnchainId: merchantsTable.onchainId,
      last4: cardsTable.last4,
      onchainCardId: cardsTable.onchainCardId,
      dependentOnchainId: membersTable.onchainId,
    })
    .from(cardsTable)
    .innerJoin(membersTable, eq(membersTable.id, cardsTable.dependentMemberId))
    .innerJoin(merchantsTable, eq(merchantsTable.id, authorization.merchantId))
    .where(eq(cardsTable.id, authorization.cardId));
  if (!row) return null;
  const [bucket] =
    authorization.bucketId === null
      ? []
      : await executor
          .select({ name: bucketsTable.name })
          .from(bucketsTable)
          .where(eq(bucketsTable.id, authorization.bucketId));
  return { ...row, bucketName: bucket?.name ?? null };
}

function defaultExecutor(deps?: BackgroundSubmitDeps) {
  return deps?.executor ?? db;
}

/**
 * Resolves once this swipe's `authorize` hand-off (if one is in flight in
 * this process) has finished, so callers can re-read its on-chain id.
 * Never rejects.
 */
export async function waitForAuthorize(authorizationId: number): Promise<void> {
  await authorizeRuns.get(authorizationId)?.catch(() => undefined);
}

/**
 * Mirrors one stored swipe with `authorize`. Swipes the chain can't record
 * (a custom merchant, or a card that doesn't exist) are skipped and stay
 * `not_submitted`. Once mined, the contract's authorization id is written
 * back for the later capture. Never rejects.
 */
export function handOffToChain(
  authorization: Authorization,
  deps?: BackgroundSubmitDeps,
): Promise<HandOffOutcome<AuthorizeConfirmation>> {
  const run = authorizeOnChain(authorization, deps).finally(() => {
    authorizeRuns.delete(authorization.id);
  });
  authorizeRuns.set(authorization.id, run);
  return run;
}

async function authorizeOnChain(
  authorization: Authorization,
  deps?: BackgroundSubmitDeps,
): Promise<HandOffOutcome<AuthorizeConfirmation>> {
  const executor = defaultExecutor(deps);
  let inputs: Awaited<ReturnType<typeof loadChainInputs>>;
  try {
    inputs = await loadChainInputs(authorization, executor);
  } catch (error) {
    logger.error({ err: error, authorizationId: authorization.id }, "Could not load chain inputs for a swipe");
    return { status: "skipped", why: "inputs could not be loaded" };
  }
  if (!inputs) {
    return { status: "skipped", why: "custom merchant or unknown card" };
  }
  const decision = ENGINE_DECISION[authorization.decision];
  if (decision === "approve" && inputs.bucketName === null) {
    // The contract reverts an approval without a bucket; never send one.
    await markChainFailed({ table: "authorizations", id: authorization.id }, null, deps);
    return { status: "failed", txHash: null, error: new Error("An approval needs a bucket on chain.") };
  }

  const outcome = await submitInBackground<AuthorizeConfirmation>(
    {
      label: "authorize",
      owner: { table: "authorizations", id: authorization.id },
      send: async (client) =>
        client.authorize({
          cardId:
            inputs.onchainCardId !== null
              ? BigInt(inputs.onchainCardId)
              : await findChainCardId(client, {
                  dependentOnchainId: inputs.dependentOnchainId,
                  last4: inputs.last4,
                }),
          merchantId: inputs.merchantOnchainId,
          bucketId:
            inputs.bucketName === null ? 0n : await findChainBucketId(client, inputs.bucketName),
          amount: authorization.amountCents,
          engineDecision: decision,
          reasonCode: authorization.reasonCode,
          reason: authorization.reason,
        }),
    },
    deps,
  );

  if (outcome.status === "confirmed") {
    const onchainId = Number(outcome.confirmation.ids.authorizationId);
    try {
      await executor
        .update(authorizationsTable)
        .set({ onchainAuthorizationId: onchainId })
        .where(eq(authorizationsTable.id, authorization.id));
    } catch (error) {
      logger.error({ err: error, authorizationId: authorization.id }, "Could not store the on-chain authorization id");
    }
    const recorded = outcome.confirmation.authorization;
    if (recorded.status !== ENGINE_STATUS[decision]) {
      // The chain's hard checks disagreed (e.g. no temporary pass on chain).
      // The app's decision stands; the capture will report it can't run.
      logger.warn(
        { authorizationId: authorization.id, chainStatus: recorded.status, chainReason: recorded.reasonCode },
        "The chain recorded a different outcome than the engine",
      );
    }
  }
  return outcome;
}

const ENGINE_STATUS: Record<EngineDecision, string> = {
  approve: "approved",
  reject: "declined",
  pending: "pending",
};

/**
 * Mirrors one settled purchase with `capture`, which moves the held tokens
 * on chain to spent and pays them to the card issuer. Waits for an authorize
 * still in flight. If the authorize was never sent, the capture isn't either;
 * if it failed (or the chain didn't approve it), the capture is marked
 * failed without sending anything. Never rejects.
 */
export async function captureOnChain(
  authorizationId: number,
  deps?: BackgroundSubmitDeps,
): Promise<HandOffOutcome> {
  const executor = defaultExecutor(deps);
  const owner = { table: "authorization_captures", id: authorizationId } as const;
  try {
    await authorizeRuns.get(authorizationId);
    const [row] = await executor
      .select({
        chainStatus: authorizationsTable.chainStatus,
        onchainAuthorizationId: authorizationsTable.onchainAuthorizationId,
      })
      .from(authorizationsTable)
      .where(eq(authorizationsTable.id, authorizationId));
    if (!row) return { status: "skipped", why: "no such authorization" };
    if (row.chainStatus === "not_submitted") {
      return { status: "skipped", why: "the authorize was never sent" };
    }
    if (row.onchainAuthorizationId === null) {
      await markChainFailed(owner, null, deps);
      return { status: "failed", txHash: null, error: new Error("The authorize never confirmed on chain.") };
    }
    const onchainId = BigInt(row.onchainAuthorizationId);
    return await submitInBackground(
      {
        label: "capture",
        owner,
        send: async (client) => {
          const onChain = await client.getAuthorization(onchainId);
          if (onChain.status !== "approved") {
            throw new Error(
              `On-chain authorization ${onchainId} is ${onChain.status}, so there is nothing held to release.`,
            );
          }
          return client.capture({ authorizationId: onchainId });
        },
      },
      deps,
    );
  } catch (error) {
    logger.error({ err: error, authorizationId }, "Capture hand-off failed");
    await markChainFailed(owner, null, deps);
    return { status: "failed", txHash: null, error };
  }
}
