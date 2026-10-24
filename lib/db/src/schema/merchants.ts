import { sql } from "drizzle-orm";
import { check, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { chainColumns } from "./chain";

/**
 * Simulated card-network merchants (stand-ins for real merchant data). The
 * decision engine uses the stored category and MCC for these, never the
 * values a client sends.
 */
export const merchantsTable = pgTable(
  "merchants",
  {
    id: serial("id").primaryKey(),
    /** Stable key the seed and contract ids derive from, e.g. "trader-joes". */
    slug: varchar("slug", { length: 60 }).notNull().unique(),
    name: varchar("name", { length: 120 }).notNull(),
    mcc: varchar("mcc", { length: 4 }).notNull(),
    /** Plain lowercase category, e.g. "grocery" or "bar". */
    category: varchar("category", { length: 60 }).notNull(),
    /** Fixed 32-byte contract id (bytes32), 0x-prefixed lowercase hex. */
    onchainId: varchar("onchain_id", { length: 66 }).notNull().unique(),
    ...chainColumns(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("merchants_mcc_digits", sql`${table.mcc} ~ '^[0-9]{4}$'`),
    check(
      "merchants_onchain_id_bytes32",
      sql`${table.onchainId} ~ '^0x[0-9a-f]{64}$'`,
    ),
  ],
);

export type Merchant = typeof merchantsTable.$inferSelect;
export type InsertMerchant = typeof merchantsTable.$inferInsert;
