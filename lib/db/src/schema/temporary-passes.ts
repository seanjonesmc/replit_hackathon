import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";
import { cardsTable } from "./cards";
import { chainColumns } from "./chain";
import { merchantsTable } from "./merchants";

/**
 * A parent's one-time OK for one card at one merchant, up to a maximum amount,
 * until it expires. Single use: `used_at` is set when a purchase uses it.
 */
export const temporaryPassesTable = pgTable(
  "temporary_passes",
  {
    id: serial("id").primaryKey(),
    cardId: integer("card_id")
      .notNull()
      .references(() => cardsTable.id, { onDelete: "cascade" }),
    merchantId: integer("merchant_id")
      .notNull()
      .references(() => merchantsTable.id, { onDelete: "cascade" }),
    maxAmountCents: integer("max_amount_cents").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    ...chainColumns(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("temporary_passes_card_merchant_idx").on(
      table.cardId,
      table.merchantId,
    ),
    check(
      "temporary_passes_max_amount_positive",
      sql`${table.maxAmountCents} > 0`,
    ),
  ],
);

export type TemporaryPass = typeof temporaryPassesTable.$inferSelect;
export type InsertTemporaryPass = typeof temporaryPassesTable.$inferInsert;
