import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { familiesTable } from "./families";

/**
 * One settlement run: the presenter's "Run settlement" demo control settles
 * every held purchase at once. For each purchase the card network pays the
 * merchant in dollars from the issuer's account (simulated), the vault
 * repays the card issuer on chain (capture), and the issuer redeems the
 * tokens with the partner bank for dollars (simulated). The purchases point
 * back here through `authorizations.settlement_id`.
 */
export const settlementsTable = pgTable(
  "settlements",
  {
    id: serial("id").primaryKey(),
    familyId: integer("family_id")
      .notNull()
      .references(() => familiesTable.id, { onDelete: "cascade" }),
    /** How many purchases this run settled. */
    purchaseCount: integer("purchase_count").notNull(),
    /** What the vault repaid the card issuer in total, in cents. */
    totalCents: integer("total_cents").notNull(),
    settledAt: timestamp("settled_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("settlements_family_settled_idx").on(table.familyId, table.settledAt),
    check("settlements_purchase_count_positive", sql`${table.purchaseCount} > 0`),
    check("settlements_total_positive", sql`${table.totalCents} > 0`),
  ],
);

export type Settlement = typeof settlementsTable.$inferSelect;
export type InsertSettlement = typeof settlementsTable.$inferInsert;
