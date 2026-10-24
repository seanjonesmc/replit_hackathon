import type { JsonValue } from "./json";

/** The connected network is not the chain the client was created for. */
export class ChainIdMismatchError extends Error {
  constructor(
    readonly expectedChainId: number,
    readonly actualChainId: bigint,
  ) {
    super(
      `Connected to chain ${actualChainId}, expected ${expectedChainId}; refusing to use it.`,
    );
    this.name = "ChainIdMismatchError";
  }
}

/**
 * A contract call reverted before anything was sent (gas estimation or a
 * read). `errorName`/`errorArgs` are the decoded custom error when known.
 */
export class ChainCallRevertedError extends Error {
  constructor(
    readonly method: string,
    readonly errorName: string | null,
    readonly errorArgs: JsonValue[],
    options?: { cause?: unknown },
  ) {
    super(
      errorName
        ? `${method} reverted: ${errorName}(${errorArgs.map((a) => JSON.stringify(a)).join(", ")})`
        : `${method} reverted without a known contract error.`,
      options,
    );
    this.name = "ChainCallRevertedError";
  }
}

/**
 * Broadcasting failed after retries, but an earlier attempt may still have
 * reached the node. Check `txHash` before treating the write as not sent.
 */
export class ChainBroadcastError extends Error {
  constructor(
    readonly method: string,
    readonly txHash: string,
    options?: { cause?: unknown },
  ) {
    super(`${method} transaction ${txHash} could not be confirmed as sent.`, options);
    this.name = "ChainBroadcastError";
  }
}

/** A sent transaction was mined but reverted (receipt status 0). */
export class ChainTxRevertedError extends Error {
  constructor(
    readonly method: string,
    readonly txHash: string,
    readonly blockNumber: number,
  ) {
    super(`${method} transaction ${txHash} reverted in block ${blockNumber}.`);
    this.name = "ChainTxRevertedError";
  }
}

/** No receipt arrived for a sent transaction within the timeout. */
export class ChainConfirmationTimeoutError extends Error {
  constructor(
    readonly method: string,
    readonly txHash: string,
    readonly timeoutMs: number,
  ) {
    super(
      `${method} transaction ${txHash} was not confirmed within ${timeoutMs}ms.`,
    );
    this.name = "ChainConfirmationTimeoutError";
  }
}
