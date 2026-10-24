import type { ChainClient, WriteConfirmation } from "@workspace/chain";
import { db, type DbExecutor } from "@workspace/db";
import { logger } from "../../lib/logger";
import { getChainClient, isChainConfigured } from "../blockchain";
import {
  recordReceiptEvents,
  updateOwnerChainStatus,
  type ChainOwnerTable,
} from "./record-receipt";

/** One write to mirror on chain after its Postgres row is committed. */
export interface BackgroundSubmission<
  C extends WriteConfirmation<object> = WriteConfirmation<object>,
> {
  /** What is being sent, for logs, e.g. "fundBucket". */
  label: string;
  /** The row the transaction mirrors; its chain columns track the write. */
  owner: { table: ChainOwnerTable; id: number };
  /**
   * Starts the write through the shared client's single queue. Called once;
   * it may do reads first (e.g. look up an on-chain ID).
   */
  send: (
    client: ChainClient,
  ) => Promise<{ txHash: string; confirmation: Promise<C> }>;
}

export type SubmissionOutcome<
  C extends WriteConfirmation<object> = WriteConfirmation<object>,
> =
  /** No chain Secrets: nothing was sent and the row stays `not_submitted`. */
  | { status: "not_configured" }
  | { status: "confirmed"; confirmation: C }
  /** The row is `failed` (keeping the hash if a transaction was broadcast). */
  | { status: "failed"; txHash: string | null; error: unknown };

/** What the helper talks to; tests pass their own. */
export interface BackgroundSubmitDeps {
  isConfigured(): boolean;
  getClient(): ChainClient;
  executor: DbExecutor;
  log: {
    info(obj: object, msg: string): void;
    warn(obj: object, msg: string): void;
    error(obj: object, msg: string): void;
  };
}

function defaultDeps(): BackgroundSubmitDeps {
  return {
    isConfigured: isChainConfigured,
    getClient: getChainClient,
    executor: db,
    log: logger,
  };
}

function describe(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

/**
 * Sends one write to the chain without making the caller wait, and keeps
 * the owning row's chain columns honest: `submitted` with the hash once
 * broadcast, `confirmed` (with its events in `chain_events`) only from a
 * mined receipt, `failed` otherwise. A row that is already confirmed is
 * never downgraded.
 *
 * Never rejects; callers fire it with `void` after their database commit.
 * The returned outcome is for chaining dependent writes and for tests.
 */
export async function submitInBackground<C extends WriteConfirmation<object>>(
  submission: BackgroundSubmission<C>,
  deps: BackgroundSubmitDeps = defaultDeps(),
): Promise<SubmissionOutcome<C>> {
  const { label, owner } = submission;
  const context = { label, owner: `${owner.table}#${owner.id}` };
  if (!deps.isConfigured()) {
    deps.log.info(context, "Chain not configured; left off chain");
    return { status: "not_configured" };
  }

  let txHash: string | null = null;
  try {
    const pending = await submission.send(deps.getClient());
    txHash = pending.txHash;
    await updateOwnerChainStatus(
      deps.executor,
      owner,
      { chainStatus: "submitted", chainTxHash: txHash, chainConfirmedAt: null },
      { keepConfirmed: true },
    );

    const confirmation = await pending.confirmation;
    await recordReceiptEvents(
      {
        txHash: confirmation.txHash,
        blockNumber: confirmation.blockNumber,
        confirmedAt: confirmation.confirmedAt,
        owner,
        events: confirmation.events.map((event) => ({
          eventName: event.eventName,
          contractAddress: event.contractAddress,
          logIndex: event.logIndex,
          args: event.args,
          owner,
        })),
      },
      deps.executor,
    );
    deps.log.info(
      { ...context, txHash, confirmationMs: confirmation.confirmationMs },
      "Confirmed on chain",
    );
    return { status: "confirmed", confirmation };
  } catch (error) {
    deps.log.warn({ ...context, txHash, error: describe(error) }, "Chain write failed");
    await markChainFailed(owner, txHash, deps);
    return { status: "failed", txHash, error };
  }
}

/**
 * Marks a row `failed` without sending anything, e.g. when the write it
 * depends on failed. Never rejects and never downgrades a confirmed row.
 */
export async function markChainFailed(
  owner: { table: ChainOwnerTable; id: number },
  txHash: string | null,
  deps: BackgroundSubmitDeps = defaultDeps(),
): Promise<void> {
  try {
    await updateOwnerChainStatus(
      deps.executor,
      owner,
      { chainStatus: "failed", chainTxHash: txHash, chainConfirmedAt: null },
      { keepConfirmed: true },
    );
  } catch (error) {
    deps.log.error(
      { owner: `${owner.table}#${owner.id}`, error: describe(error) },
      "Could not record a failed chain write",
    );
  }
}
