import type { Authorization } from "@workspace/db";

/**
 * The one hand-off point to the chain (Phase 3): authorize() on Monad, then
 * capture() when approved, with tx hashes written back to the row.
 *
 * Called after the authorization is stored and never awaited by the request,
 * so a swipe's response never waits on the chain. It does nothing yet, so
 * every authorization stays `not_submitted`. It must never change a decision.
 */
export async function handOffToChain(
  _authorization: Authorization,
): Promise<void> {}
