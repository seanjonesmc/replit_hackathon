import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { familiesTable } from "./families";

export const memberRoleEnum = pgEnum("member_role", [
  "parent",
  "funder",
  "dependent",
]);

export type MemberRole = (typeof memberRoleEnum.enumValues)[number];

export const membersTable = pgTable(
  "members",
  {
    id: serial("id").primaryKey(),
    familyId: integer("family_id")
      .notNull()
      .references(() => familiesTable.id, { onDelete: "cascade" }),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    role: memberRoleEnum("role").notNull(),
    /** Free-form relationship, e.g. grandparent, co-parent, student. */
    relationship: varchar("relationship", { length: 40 }).notNull(),
    age: integer("age"),
    /** Optional link to a signed-in account. */
    userId: varchar("user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    onboardingComplete: boolean("onboarding_complete").notNull().default(false),
    /**
     * Fixed 32-byte id used for this member in the contracts (bytes32),
     * stored as 0x-prefixed lowercase hex. Stable across demo resets.
     */
    onchainId: varchar("onchain_id", { length: 66 }).notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("members_family_id_idx").on(table.familyId),
    check(
      "members_onchain_id_bytes32",
      sql`${table.onchainId} ~ '^0x[0-9a-f]{64}$'`,
    ),
    check("members_age_valid", sql`${table.age} IS NULL OR ${table.age} >= 0`),
  ],
);

export type Member = typeof membersTable.$inferSelect;
export type InsertMember = typeof membersTable.$inferInsert;
