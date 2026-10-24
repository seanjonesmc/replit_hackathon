import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { bankAccountsTable } from "./bank-accounts";
import { bucketsTable } from "./buckets";
import { chainColumns } from "./chain";
import { membersTable } from "./members";

/** Longest note a contribution can carry. */
export const CONTRIBUTION_NOTE_MAX = 140;

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
    /**
     * Shown with the contribution, e.g. "Food, from <funder name>". New rows
     * always store one (the funder's, or that default); rows from before the
     * column existed are null and get the default when read.
     */
    note: varchar("note", { length: CONTRIBUTION_NOTE_MAX }),
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
