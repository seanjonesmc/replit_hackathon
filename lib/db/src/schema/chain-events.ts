import {
  bigint,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * One row per contract event, indexed from the API's own transaction
 * receipts (there is no separate indexer). `(tx_hash, log_index)` is unique,
 * so re-indexing a receipt never creates duplicates.
 *
 * `owner_table`/`owner_id` point at the Postgres row the event mirrors. The
 * table name is plain text (not an enum) so later slices can mirror new
 * tables without a schema change.
 */
export const chainEventsTable = pgTable(
  "chain_events",
  {
    id: serial("id").primaryKey(),
    eventName: varchar("event_name", { length: 80 }).notNull(),
    contractAddress: varchar("contract_address", { length: 42 }).notNull(),
    txHash: varchar("tx_hash", { length: 66 }).notNull(),
    blockNumber: bigint("block_number", { mode: "number" }).notNull(),
    logIndex: integer("log_index").notNull(),
    /** Decoded event arguments; big integers are stored as decimal strings. */
    args: jsonb("args").$type<Record<string, unknown>>().notNull(),
    ownerTable: varchar("owner_table", { length: 63 }),
    ownerId: integer("owner_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("chain_events_tx_log_unique").on(table.txHash, table.logIndex),
    index("chain_events_tx_hash_idx").on(table.txHash),
    index("chain_events_event_name_idx").on(table.eventName),
    index("chain_events_owner_idx").on(table.ownerTable, table.ownerId),
  ],
);

export type ChainEvent = typeof chainEventsTable.$inferSelect;
export type InsertChainEvent = typeof chainEventsTable.$inferInsert;
