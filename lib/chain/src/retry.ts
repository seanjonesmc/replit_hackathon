/**
 * Classifies RPC failures. ethers wraps node errors in several layers
 * (`error`, `info.error`, `cause`), so these look at every layer's code and
 * message.
 */

const TRANSIENT_ETHERS_CODES = new Set(["NETWORK_ERROR", "TIMEOUT", "SERVER_ERROR"]);
const TRANSIENT_SYSTEM_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "EPIPE",
  "UND_ERR_SOCKET",
  "UND_ERR_CONNECT_TIMEOUT",
]);
/** JSON-RPC "limit exceeded" and HTTP "too many requests". */
const TRANSIENT_RPC_CODES = new Set([-32005, 429]);
const TRANSIENT_MESSAGE =
  /timeout|timed out|rate limit|too many requests|temporarily unavailable|service unavailable|bad gateway|gateway timeout|socket hang up|connection reset|network error|fetch failed/i;

// Monad says "An existing transaction had higher priority" when another
// sender with the same key already holds this nonce in the mempool.
const NONCE_MESSAGE =
  /nonce too (low|high)|invalid nonce|nonce has already been used|incorrect nonce|existing transaction had higher priority/i;
const ALREADY_KNOWN_MESSAGE = /already known|known transaction|already imported|already in (the )?mempool/i;

interface ErrorLayer {
  code?: unknown;
  message?: unknown;
  shortMessage?: unknown;
  data?: unknown;
}

function layers(error: unknown): ErrorLayer[] {
  const found: ErrorLayer[] = [];
  const queue: unknown[] = [error];
  while (queue.length > 0 && found.length < 12) {
    const item = queue.shift();
    if (item === null || typeof item !== "object" || found.includes(item)) {
      continue;
    }
    const layer = item as ErrorLayer & {
      error?: unknown;
      info?: { error?: unknown };
      cause?: unknown;
    };
    found.push(layer);
    queue.push(layer.error, layer.info?.error, layer.cause);
  }
  return found;
}

function messages(error: unknown): string {
  return layers(error)
    .flatMap((layer) => [layer.message, layer.shortMessage])
    .filter((text): text is string => typeof text === "string")
    .join(" | ");
}

function hasRevertData(layer: ErrorLayer): boolean {
  return typeof layer.data === "string" && layer.data.length > 2;
}

/** A failure worth retrying: the node or the connection, not the call. */
export function isTransientRpcError(error: unknown): boolean {
  const all = layers(error);
  // A contract revert carries revert data; retrying it changes nothing.
  if (all.some(hasRevertData)) return false;
  if (isNonceError(error) || isAlreadyKnownError(error)) return false;
  for (const layer of all) {
    if (typeof layer.code === "string") {
      if (TRANSIENT_ETHERS_CODES.has(layer.code)) return true;
      if (TRANSIENT_SYSTEM_CODES.has(layer.code)) return true;
    }
    if (typeof layer.code === "number" && TRANSIENT_RPC_CODES.has(layer.code)) {
      return true;
    }
  }
  return TRANSIENT_MESSAGE.test(messages(error));
}

/** The node rejected the transaction's nonce (too low, too high or reused). */
export function isNonceError(error: unknown): boolean {
  if (layers(error).some((layer) => layer.code === "NONCE_EXPIRED")) return true;
  return NONCE_MESSAGE.test(messages(error));
}

/** The node already has this exact signed transaction. */
export function isAlreadyKnownError(error: unknown): boolean {
  return ALREADY_KNOWN_MESSAGE.test(messages(error));
}

export interface RetryOptions {
  /** Total attempts, including the first. */
  attempts: number;
  /** Delay before the first retry; doubles on each further retry. */
  baseDelayMs: number;
}

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Runs `fn`, retrying transient RPC failures with exponential backoff. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= options.attempts || !isTransientRpcError(error)) {
        throw error;
      }
      await sleep(options.baseDelayMs * 2 ** (attempt - 1));
    }
  }
}
