/**
 * Shared frontend domain types used by branded components.
 * Kept separate from preview samples so screens never import preview data.
 */

/** A spending decision outcome. `rejected` is shown to people as "Declined". */
export type Decision = 'approved' | 'rejected' | 'pending';

/** Icon key for a spending bucket. */
export type BucketIcon = 'food' | 'school' | 'social' | 'transit';

/**
 * On-chain status of a record.
 * - preview: illustrative sample, nothing was sent.
 * - confirming: a testnet call is in flight.
 * - verified: confirmed; only valid with a real explorer link.
 */
export type ChainStatus =
  | { state: 'preview' }
  | { state: 'confirming' }
  | { state: 'verified'; href: string };
