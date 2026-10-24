import { pgEnum, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Where a record stands on Monad testnet. Every mirrored row starts as
 * `not_submitted`; only the Phase 3 chain adapter moves it forward, and only
 * `confirmed` (set from a real transaction receipt) may be shown as verified.
 */
export const chainStatusEnum = pgEnum("chain_status", [
  "not_submitted",
  "submitted",
  "confirmed",
  "failed",
]);

export type ChainStatus = (typeof chainStatusEnum.enumValues)[number];

/**
 * On-chain columns shared by every table that will be mirrored on Monad.
 * A function, so each table gets its own column builders.
 */
export function chainColumns() {
  return {
    chainStatus: chainStatusEnum("chain_status")
      .notNull()
      .default("not_submitted"),
    /** 0x-prefixed 32-byte transaction hash, set once a transaction exists. */
    chainTxHash: varchar("chain_tx_hash", { length: 66 }),
    chainConfirmedAt: timestamp("chain_confirmed_at", { withTimezone: true }),
  };
}
