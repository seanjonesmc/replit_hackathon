import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";
import { bankAccountsTable } from "./bank-accounts";
import { bucketsTable } from "./buckets";
import { chainColumns } from "./chain";
import { membersTable } from "./members";

/**
 * Money a funder (or the parent) moved from one of their banks into a bucket.
 * The basis for "where my money went".
 */
export const contributionsTable = pgTable(
  "contributions",
  {
    id: serial("id").primaryKey(),
    funderMemberId: integer("funder_member_id")
      .notNull()
      .references(() => membersTable.id, { onDelete: "cascade" }),
    bankAccountId: integer("bank_account_id")
      .notNull()
      .references(() => bankAccountsTable.id, { onDelete: "cascade" }),
    bucketId: integer("bucket_id")
      .notNull()
      .references(() => bucketsTable.id, { onDelete: "cascade" }),
    amountCents: integer("amount_cents").notNull(),
    ...chainColumns(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("contributions_funder_member_id_idx").on(table.funderMemberId),
    index("contributions_bucket_id_idx").on(table.bucketId),
    check("contributions_amount_positive", sql`${table.amountCents} > 0`),
  ],
);

export type Contribution = typeof contributionsTable.$inferSelect;
export type InsertContribution = typeof contributionsTable.$inferInsert;
