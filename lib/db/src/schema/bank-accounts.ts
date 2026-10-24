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
import { membersTable } from "./members";

/** A simulated linked bank. Bank names come from BRAND.demo.banks. */
export const bankAccountsTable = pgTable(
  "bank_accounts",
  {
    id: serial("id").primaryKey(),
    memberId: integer("member_id")
      .notNull()
      .references(() => membersTable.id, { onDelete: "cascade" }),
    bankName: varchar("bank_name", { length: 120 }).notNull(),
    last4: varchar("last4", { length: 4 }).notNull(),
    balanceCents: integer("balance_cents").notNull().default(0),
    ...chainColumns(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("bank_accounts_member_bank_unique").on(
      table.memberId,
      table.bankName,
    ),
    check(
      "bank_accounts_balance_non_negative",
      sql`${table.balanceCents} >= 0`,
    ),
    check("bank_accounts_last4_digits", sql`${table.last4} ~ '^[0-9]{4}$'`),
  ],
);

export type BankAccount = typeof bankAccountsTable.$inferSelect;
export type InsertBankAccount = typeof bankAccountsTable.$inferInsert;
