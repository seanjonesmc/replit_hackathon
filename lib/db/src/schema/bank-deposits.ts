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
import { chainColumns } from "./chain";

/** A simulated deposit (stands in for ACH) into a linked bank. */
export const bankDepositsTable = pgTable(
  "bank_deposits",
  {
    id: serial("id").primaryKey(),
    bankAccountId: integer("bank_account_id")
      .notNull()
      .references(() => bankAccountsTable.id, { onDelete: "cascade" }),
    amountCents: integer("amount_cents").notNull(),
    ...chainColumns(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("bank_deposits_bank_account_id_idx").on(table.bankAccountId),
    check("bank_deposits_amount_positive", sql`${table.amountCents} > 0`),
  ],
);

export type BankDeposit = typeof bankDepositsTable.$inferSelect;
export type InsertBankDeposit = typeof bankDepositsTable.$inferInsert;
