import { sql } from "drizzle-orm";
import {
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  serial,
  timestamp,
  varchar,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { bucketsTable } from "./buckets";
import { cardsTable } from "./cards";
import { chainColumns, chainStatusEnum } from "./chain";
import { familiesTable } from "./families";
import { membersTable } from "./members";
import { merchantsTable } from "./merchants";
import { settlementsTable } from "./settlements";

/** The decision engine's result for a swipe. Never changes after it is stored. */
export const authorizationDecisionEnum = pgEnum("authorization_decision", [
  "APPROVED",
  "REJECTED",
  "PENDING",
]);

/**
 * Where the authorization stands now. A pending swipe stays `pending` until a
 * parent resolves it; the parent-approved retry is a new, linked row.
 */
export const authorizationStatusEnum = pgEnum("authorization_status", [
  "approved",
  "rejected",
  "pending",
  "parent_approved",
  "parent_declined",
]);

/** Matches the contract's reason codes. */
export const reasonCodeEnum = pgEnum("reason_code", [
  "approved",
  "blocked_category",
  "insufficient_funds",
  "over_limit",
  "card_inactive",
  "needs_approval",
  "outside_hours",
]);

export const decidedByEnum = pgEnum("decided_by", ["rule", "ai_guard"]);

export type AuthorizationDecision =
  (typeof authorizationDecisionEnum.enumValues)[number];
export type AuthorizationStatus =
  (typeof authorizationStatusEnum.enumValues)[number];
export type ReasonCode = (typeof reasonCodeEnum.enumValues)[number];
export type DecidedBy = (typeof decidedByEnum.enumValues)[number];

/**
 * One row per card swipe: a snapshot of the swipe, the engine's decision and
 * the on-chain authorize and capture transactions.
 */
export const authorizationsTable = pgTable(
  "authorizations",
  {
    id: serial("id").primaryKey(),
    familyId: integer("family_id")
      .notNull()
      .references(() => familiesTable.id, { onDelete: "cascade" }),
    /** Null when the swipe named a card that doesn't exist (card_inactive). */
    cardId: integer("card_id").references(() => cardsTable.id, {
      onDelete: "cascade",
    }),
    dependentMemberId: integer("dependent_member_id")
      .notNull()
      .references(() => membersTable.id, { onDelete: "cascade" }),

    // Swipe snapshot. For seeded merchants these are the stored values.
    /** Null for custom swipes at a merchant that isn't seeded. */
    merchantId: integer("merchant_id").references(() => merchantsTable.id, {
      onDelete: "set null",
    }),
    merchantName: varchar("merchant_name", { length: 120 }).notNull(),
    mcc: varchar("mcc", { length: 4 }).notNull(),
    merchantCategory: varchar("merchant_category", { length: 60 }).notNull(),
    items: jsonb("items").$type<string[]>().notNull(),
    amountCents: integer("amount_cents").notNull(),
    location: varchar("location", { length: 200 }).notNull(),
    swipedAt: timestamp("swiped_at", { withTimezone: true }).notNull(),

    // Decision.
    /** The bucket the money comes from; null when no bucket was resolved. */
    bucketId: integer("bucket_id").references(() => bucketsTable.id, {
      onDelete: "set null",
    }),
    decision: authorizationDecisionEnum("decision").notNull(),
    status: authorizationStatusEnum("status").notNull(),
    reasonCode: reasonCodeEnum("reason_code").notNull(),
    /** One short sentence a teenager would understand. */
    reason: varchar("reason", { length: 300 }).notNull(),
    decidedBy: decidedByEnum("decided_by").notNull(),
    /** The AI guard's confidence (0–1), when it decided. */
    aiConfidence: real("ai_confidence"),
    /** Measured rule evaluation (plus AI guard) time. */
    decisionMs: doublePrecision("decision_ms").notNull(),

    // Approval chain.
    /** The earlier authorization this one retries (pending → parent approved → retry). */
    previousAuthorizationId: integer("previous_authorization_id").references(
      (): AnyPgColumn => authorizationsTable.id,
      { onDelete: "set null" },
    ),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedByMemberId: integer("resolved_by_member_id").references(
      () => membersTable.id,
      { onDelete: "set null" },
    ),
    // Hold, then settle. An approved swipe only holds its amount (available →
    // held); a settlement run later moves it held → spent.
    /**
     * When the held amount settled (held → spent) and the card issuer was
     * repaid. Null while an approved purchase is still held, and for swipes
     * that moved no money.
     */
    settledAt: timestamp("settled_at", { withTimezone: true }),
    /** The settlement run that settled this purchase. */
    settlementId: integer("settlement_id").references(() => settlementsTable.id, {
      onDelete: "set null",
    }),
    /**
     * When the card issuer redeemed the repaid tokens with the partner bank
     * for dollars. Simulated: recorded at settlement, nothing real moves.
     */
    issuerRedeemedAt: timestamp("issuer_redeemed_at", { withTimezone: true }),

    // On chain: the authorize transaction, then the capture transaction.
    /** The contract's authorization id, once authorize() is confirmed. */
    onchainAuthorizationId: integer("onchain_authorization_id"),
    ...chainColumns(),
    captureChainStatus: chainStatusEnum("capture_chain_status")
      .notNull()
      .default("not_submitted"),
    captureChainTxHash: varchar("capture_chain_tx_hash", { length: 66 }),
    captureChainConfirmedAt: timestamp("capture_chain_confirmed_at", {
      withTimezone: true,
    }),
    /** The parent's decision on a pending swipe: resolvePending() on chain. */
    resolveChainStatus: chainStatusEnum("resolve_chain_status")
      .notNull()
      .default("not_submitted"),
    resolveChainTxHash: varchar("resolve_chain_tx_hash", { length: 66 }),
    resolveChainConfirmedAt: timestamp("resolve_chain_confirmed_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("authorizations_card_created_idx").on(table.cardId, table.createdAt),
    index("authorizations_family_status_idx").on(table.familyId, table.status),
    index("authorizations_family_created_idx").on(
      table.familyId,
      table.createdAt,
    ),
    index("authorizations_previous_idx").on(table.previousAuthorizationId),
    index("authorizations_settlement_idx").on(table.settlementId),
    check("authorizations_amount_positive", sql`${table.amountCents} > 0`),
    check("authorizations_decision_ms_non_negative", sql`${table.decisionMs} >= 0`),
    check(
      "authorizations_ai_confidence_range",
      sql`${table.aiConfidence} IS NULL OR (${table.aiConfidence} >= 0 AND ${table.aiConfidence} <= 1)`,
    ),
  ],
);

export type Authorization = typeof authorizationsTable.$inferSelect;
export type InsertAuthorization = typeof authorizationsTable.$inferInsert;
