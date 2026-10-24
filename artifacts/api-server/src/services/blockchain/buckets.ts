import type { ChainClient } from "@workspace/chain";

/**
 * On-chain bucket IDs are the contract's own counter (the first is 1), so
 * Postgres buckets are matched to them by name: the deploy seed creates the
 * same buckets with the same names. Found IDs are cached per client, since
 * a bucket's ID never changes on a deployed contract.
 */
const cache = new WeakMap<ChainClient, Map<string, bigint>>();

export class ChainBucketNotFoundError extends Error {
  constructor(readonly bucketName: string) {
    super(`No bucket named "${bucketName}" exists on chain.`);
    this.name = "ChainBucketNotFoundError";
  }
}

/** The lowest on-chain bucket ID with this name; throws if there is none. */
export async function findChainBucketId(
  client: ChainClient,
  bucketName: string,
): Promise<bigint> {
  let known = cache.get(client);
  if (!known) {
    known = new Map();
    cache.set(client, known);
  }
  const cached = known.get(bucketName);
  if (cached !== undefined) return cached;

  const { buckets } = await client.getCounts();
  for (let id = 1n; id <= buckets; id++) {
    const bucket = await client.getBucket(id);
    if (!known.has(bucket.name)) known.set(bucket.name, id);
    if (bucket.name === bucketName) return id;
  }
  throw new ChainBucketNotFoundError(bucketName);
}
