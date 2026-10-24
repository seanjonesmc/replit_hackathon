import { sql } from "drizzle-orm";
import {
  check,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { familiesTable } from "./families";

/** "HH:MM" 24-hour clock times; an end before the start wraps past midnight. */
export interface PolicyTimeWindow {
  start: string;
  end: string;
}

/**
 * The family's spending policy (one per family), shaped to match the API's
 * `FamilyPolicy` schema (services/ai/schemas.ts), which validates it on read.
 * Per-bucket limits and approval thresholds stay on the buckets.
 */
export const policiesTable = pgTable(
  "policies",
  {
    id: serial("id").primaryKey(),
    familyId: integer("family_id")
      .notNull()
      .unique()
      .references(() => familiesTable.id, { onDelete: "cascade" }),
    /** The onboarding preset the policy started from, e.g. "Balanced". */
    presetName: varchar("preset_name", { length: 40 }).notNull(),
    /** IANA time zone that time windows are read in, e.g. "America/Los_Angeles". */
    timeZone: varchar("time_zone", { length: 64 }).notNull(),
    blockedCategories: text("blocked_categories")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    blockedMerchants: text("blocked_merchants")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    /** Allowed merchants are never sent to the AI guard. */
    allowedMerchants: text("allowed_merchants")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    /** Purchases inside any of these windows need a parent's approval. */
    timeWindows: jsonb("time_windows")
      .$type<PolicyTimeWindow[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    /** Optional family-wide "ask me before anything over $X". */
    approvalThresholdCents: integer("approval_threshold_cents"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check(
      "policies_threshold_non_negative",
      sql`${table.approvalThresholdCents} IS NULL OR ${table.approvalThresholdCents} >= 0`,
    ),
  ],
);

export type Policy = typeof policiesTable.$inferSelect;
export type InsertPolicy = typeof policiesTable.$inferInsert;
