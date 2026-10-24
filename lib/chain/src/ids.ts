import { sha256, toUtf8Bytes } from "ethers";

/**
 * The contracts' `bytes32` ID for a stable key: the SHA-256 of its UTF-8
 * bytes, as 0x-prefixed lowercase hex. The backend and the deploy seed both
 * derive IDs here, so they always agree.
 */
export function chainId(key: string): string {
  if (key.length === 0) throw new Error("A chain ID key cannot be empty.");
  return sha256(toUtf8Bytes(key));
}

/**
 * ID of a demo-family member, from their role key (e.g. `parent`,
 * `grandparent`, `coParent`, `dependent`). Matches the `onchain_id` the API
 * stores for seeded members.
 */
export function memberChainId(roleKey: string): string {
  return chainId(`demo-family:member:${roleKey}`);
}

/** ID of a merchant, from its slug (e.g. `trader-joes`). */
export function merchantChainId(slug: string): string {
  return chainId(`demo-family:merchant:${slug}`);
}
