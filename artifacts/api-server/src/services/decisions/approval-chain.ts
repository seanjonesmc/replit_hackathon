import { eq } from "drizzle-orm";
import {
  cardsTable,
  db,
  merchantsTable,
  type Authorization,
  type Member,
  type TemporaryPass,
} from "@workspace/db";
import { logger } from "../../lib/logger";
import {
  submitInBackground,
  type BackgroundSubmitDeps,
  type SubmissionOutcome,
} from "../events";
import { handOffToChain } from "./chain-handoff";

/**
 * Mirrors a parent's answer on Monad after its Postgres commit, in the
 * contract's order: resolvePending(), then grantTemporaryPass(), then the
 * retry's own hand-off (authorize). The shared client sends one write at a
 * time, so the pass is mined before the retry reaches the chain.
 *
 * Never rejects and never changes a decision: routes call it with `void`.
 * Each row's chain columns say only what really happened on chain.
 */

export interface ParentDecisionOnChain {
  original: Authorization;
  parent: Member;
  pass: TemporaryPass | null;
  retry: Authorization | null;
}

export interface ParentDecisionChainOutcome {
  /** Null when the original swipe was never authorized on chain. */
  resolve: SubmissionOutcome | null;
  pass: SubmissionOutcome | null;
}

/** `resolvePending`, tracked in the original row's `resolve_chain_*` columns. */
export function mirrorResolveOnChain(
  input: { original: Authorization; parent: Member },
  deps?: BackgroundSubmitDeps,
): Promise<SubmissionOutcome> {
  const { original, parent } = input;
  return submitInBackground(
    {
      label: "resolvePending",
      owner: { table: "authorization_resolutions", id: original.id },
      send: (client) =>
        client.resolvePending({
          authorizationId: original.onchainAuthorizationId!,
          approved: original.status === "parent_approved",
          parentId: parent.onchainId,
        }),
    },
    deps,
  );
}

/** `grantTemporaryPass` for the card and merchant's on-chain ids. */
export function mirrorPassOnChain(
  pass: TemporaryPass,
  deps?: BackgroundSubmitDeps,
): Promise<SubmissionOutcome> {
  const executor = deps?.executor ?? db;
  return submitInBackground(
    {
      label: "grantTemporaryPass",
      owner: { table: "temporary_passes", id: pass.id },
      send: async (client) => {
        const [card] = await executor
          .select({ onchainCardId: cardsTable.onchainCardId })
          .from(cardsTable)
          .where(eq(cardsTable.id, pass.cardId));
        const [merchant] = await executor
          .select({ onchainId: merchantsTable.onchainId })
          .from(merchantsTable)
          .where(eq(merchantsTable.id, pass.merchantId));
        if (card?.onchainCardId == null) {
          throw new Error(`Card #${pass.cardId} has no on-chain card id.`);
        }
        if (!merchant) throw new Error(`Merchant #${pass.merchantId} is missing.`);
        return client.grantTemporaryPass({
          cardId: card.onchainCardId,
          merchantId: merchant.onchainId,
          maxAmount: pass.maxAmountCents,
          expiresAt: Math.floor(pass.expiresAt.getTime() / 1000),
        });
      },
    },
    deps,
  );
}

export async function mirrorParentDecisionOnChain(
  input: ParentDecisionOnChain,
  deps?: BackgroundSubmitDeps,
): Promise<ParentDecisionChainOutcome> {
  const log = deps?.log ?? logger;
  // The contract can only resolve an authorization it holds.
  const resolve =
    input.original.onchainAuthorizationId === null
      ? null
      : await mirrorResolveOnChain(input, deps);
  if (resolve === null) {
    log.info(
      { authorizationId: input.original.id },
      "Original swipe isn't on chain; the parent's decision stays off chain",
    );
  }
  const pass = input.pass ? await mirrorPassOnChain(input.pass, deps) : null;
  if (input.retry) {
    const retry = input.retry;
    await handOffToChain(retry).catch((err: unknown) => {
      log.error({ err, authorizationId: retry.id }, "Chain hand-off failed");
    });
  }
  return { resolve, pass };
}
