import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { chainColumns } from "./chain";
import { familiesTable } from "./families";

/**
 * A spending bucket in the family pot. `available` can be spent, `held` is
 * authorized but not yet settled, `spent` has settled to a merchant.
 */
export const bucketsTable = pgTable(
  "buckets",
  {
    id: serial("id").primaryKey(),
    familyId: integer("family_id")
      .notNull()
      .references(() => familiesTable.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 60 }).notNull(),
    perPurchaseLimitCents: integer("per_purchase_limit_cents").notNull(),
    approvalThresholdCents: integer("approval_threshold_cents").notNull(),
    availableCents: integer("available_cents").notNull().default(0),
    heldCents: integer("held_cents").notNull().default(0),
    spentCents: integer("spent_cents").notNull().default(0),
    ...chainColumns(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("buckets_family_name_unique").on(table.familyId, table.name),
    check(
      "buckets_amounts_non_negative",
      sql`${table.availableCents} >= 0 AND ${table.heldCents} >= 0 AND ${table.spentCents} >= 0`,
    ),
    check(
      "buckets_limits_non_negative",
      sql`${table.perPurchaseLimitCents} >= 0 AND ${table.approvalThresholdCents} >= 0`,
    ),
  ],
);

export type Bucket = typeof bucketsTable.$inferSelect;
export type InsertBucket = typeof bucketsTable.$inferInsert;
