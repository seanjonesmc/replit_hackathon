import type { ChainClient } from "@workspace/chain";

/**
 * On-chain card IDs are the contract's own counter (the first is 1). A card
 * row that doesn't store its ID yet is matched to the chain by its holder's
 * member ID and last four, which the deploy seed issues with. Found IDs are
 * cached per client, since a card's ID never changes on a deployed contract.
 */
const cache = new WeakMap<ChainClient, Map<string, bigint>>();

export class ChainCardNotFoundError extends Error {
  constructor(readonly dependentOnchainId: string, readonly last4: string) {
    super(`No card ending ${last4} for member ${dependentOnchainId} exists on chain.`);
    this.name = "ChainCardNotFoundError";
  }
}

/** The lowest on-chain card ID for this holder and last four; throws if there is none. */
export async function findChainCardId(
  client: ChainClient,
  card: { dependentOnchainId: string; last4: string },
): Promise<bigint> {
  const key = `${card.dependentOnchainId.toLowerCase()}:${card.last4}`;
  let known = cache.get(client);
  if (!known) {
    known = new Map();
    cache.set(client, known);
  }
  const cached = known.get(key);
  if (cached !== undefined) return cached;

  const { cards } = await client.getCounts();
  for (let id = 1n; id <= cards; id++) {
    const onChain = await client.getCard(id);
    const found = `${onChain.dependentId.toLowerCase()}:${onChain.last4}`;
    if (!known.has(found)) known.set(found, id);
    if (found === key) return id;
  }
  throw new ChainCardNotFoundError(card.dependentOnchainId, card.last4);
}
