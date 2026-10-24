import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { chainColumns } from "./chain";
import { membersTable } from "./members";

/** Mirrors the contract's card lifecycle: Issued → Active ⇄ Frozen. */
export const cardStatusEnum = pgEnum("card_status", [
  "issued",
  "active",
  "frozen",
]);

export type CardStatus = (typeof cardStatusEnum.enumValues)[number];

/**
 * The dependent's simulated card (one per dependent). The last four digits
 * come from BRAND.demo.cardLast4 at seed time.
 */
export const cardsTable = pgTable(
  "cards",
  {
    id: serial("id").primaryKey(),
    dependentMemberId: integer("dependent_member_id")
      .notNull()
      .references(() => membersTable.id, { onDelete: "cascade" }),
    last4: varchar("last4", { length: 4 }).notNull(),
    expiryMonth: integer("expiry_month").notNull(),
    expiryYear: integer("expiry_year").notNull(),
    status: cardStatusEnum("status").notNull().default("issued"),
    /** The contract's card id (starts at 1), set once the card is issued on chain. */
    onchainCardId: integer("onchain_card_id"),
    ...chainColumns(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("cards_dependent_unique").on(table.dependentMemberId),
    check("cards_last4_digits", sql`${table.last4} ~ '^[0-9]{4}$'`),
    check(
      "cards_expiry_valid",
      sql`${table.expiryMonth} BETWEEN 1 AND 12 AND ${table.expiryYear} >= 2000`,
    ),
  ],
);

export type Card = typeof cardsTable.$inferSelect;
export type InsertCard = typeof cardsTable.$inferInsert;
