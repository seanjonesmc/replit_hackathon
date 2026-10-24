/**
 * Shared frontend domain types used by branded components.
 * Kept separate from preview samples so screens never import preview data.
 */

/** A spending decision outcome. `rejected` is shown to people as "Declined". */
export type Decision = 'approved' | 'rejected' | 'pending';

/** What decided a purchase: a hard rule, or the AI guard within the rules. */
export type DecidedBy = 'rule' | 'ai_guard';

/** Icon key for a spending bucket. */
export type BucketIcon = 'food' | 'school' | 'social' | 'transit';

/**
 * On-chain status of a record.
 * - preview: illustrative sample, nothing was sent.
 * - offchain: a real record not written on chain yet (or the write failed).
 * - confirming: a testnet call is in flight.
 * - sent: confirmed on chain, but no explorer link to show yet.
 * - verified: confirmed; only valid with a real explorer link.
 */
export type ChainStatus =
  | { state: 'preview' }
  | { state: 'offchain' }
  | { state: 'confirming' }
  | { state: 'sent' }
  | { state: 'verified'; href: string };
