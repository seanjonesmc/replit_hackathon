import { createHash } from "node:crypto";
import { BRAND } from "@brand/brand.config";
import { and, eq, sql } from "drizzle-orm";
import {
  authorizationsTable,
  cardsTable,
  db,
  membersTable,
  merchantsTable,
  policiesTable,
  temporaryPassesTable,
  type DbExecutor,
  type ReasonCode,
} from "@workspace/db";
import { getDemoFamily } from "../family";
import { toLocalIso, zonedParts, zonedTimeToInstant } from "./clock";
import {
  decideSwipe,
  loadSwipeContext,
  recordDecision,
  type SwipeInput,
} from "./swipes";

/**
 * Seeds what the decision engine needs on top of the demo family: the
 * merchants, the family's policy, the dependent's active card and a short
 * purchase history. Each part is added only when missing, so it also fills in
 * a database that only has the family. Runs after `seedDemoFamily`.
 */

/** Arbitrary constant for the advisory lock that serializes this seed. */
const SPENDING_SEED_LOCK_KEY = 72_002;

/** The family clock for time windows. */
export const DEMO_TIME_ZONE = "America/Los_Angeles";

/** The spec's merchants with their real MCCs. Slugs are stable seed keys. */
export const SEED_MERCHANTS = [
  { slug: "trader-joes", name: "Trader Joe's", mcc: "5411", category: "grocery" },
  { slug: "campus-bookstore", name: "Campus Bookstore", mcc: "5942", category: "bookstore" },
  { slug: "tipsy-tavern", name: "The Tipsy Tavern", mcc: "5813", category: "bar" },
  { slug: "liquor-barn", name: "Liquor Barn", mcc: "5921", category: "liquor" },
  { slug: "lucky-star-casino", name: "Lucky Star Casino", mcc: "7995", category: "gambling" },
  { slug: "steam", name: "Steam", mcc: "5816", category: "gaming" },
  { slug: "uber", name: "Uber", mcc: "4121", category: "rideshare" },
  { slug: "apple-store", name: "Apple Store", mcc: "5732", category: "electronics" },
  { slug: "amc", name: "AMC", mcc: "7832", category: "movies" },
] as const;

type MerchantSlug = (typeof SEED_MERCHANTS)[number]["slug"];

/**
 * The spec's Balanced preset plus a late-night window (11pm–6am), so the
 * 2:10am Uber swipe waits for a parent before any AI call. See the
 * differences table in docs/stack-decisions.md.
 */
const SEED_POLICY = {
  presetName: "Balanced",
  timeZone: DEMO_TIME_ZONE,
  blockedCategories: ["bar", "liquor", "gambling", "nightclub", "gaming"],
  blockedMerchants: [] as string[],
  allowedMerchants: [] as string[],
  timeWindows: [{ start: "23:00", end: "06:00" }],
  approvalThresholdCents: null,
};

interface HistoryEntry {
  daysAgo: number;
  /** Family-clock time, HH:MM. */
  time: string;
  merchant: MerchantSlug;
  amountCents: number;
  items: string[];
  location: string;
  /** What the rules must decide; the seed fails loudly if they don't. */
  expect: ReasonCode;
  /** A parent approves this pending swipe and it is retried with a pass. */
  parentApproves?: true;
}

/**
 * About eight daytime purchases from the past few days. Each one goes
 * through the real rule engine, so balances and reasons match the rules.
 * Food keeps $118.75 and School all $200, enough to run the presets several
 * times.
 */
const SEED_HISTORY: readonly HistoryEntry[] = [
  { daysAgo: 4, time: "12:15", merchant: "trader-joes", amountCents: 18_40, items: ["bananas", "oat milk", "pasta"], location: "Westwood, Los Angeles", expect: "approved" },
  { daysAgo: 4, time: "17:30", merchant: "tipsy-tavern", amountCents: 27_50, items: ["burger", "fries"], location: "Westwood, Los Angeles", expect: "blocked_category" },
  { daysAgo: 3, time: "10:40", merchant: "campus-bookstore", amountCents: 165_00, items: ["chemistry textbook", "lab manual"], location: "On campus", expect: "over_limit" },
  { daysAgo: 3, time: "18:20", merchant: "trader-joes", amountCents: 12_85, items: ["rice", "eggs", "spinach"], location: "Westwood, Los Angeles", expect: "approved" },
  { daysAgo: 2, time: "15:45", merchant: "steam", amountCents: 9_99, items: ["indie game"], location: "Online", expect: "blocked_category" },
  { daysAgo: 2, time: "19:00", merchant: "amc", amountCents: 35_00, items: ["movie ticket", "popcorn"], location: "Century City, Los Angeles", expect: "needs_approval", parentApproves: true },
  { daysAgo: 1, time: "13:10", merchant: "trader-joes", amountCents: 72_00, items: ["groceries for a study group"], location: "Westwood, Los Angeles", expect: "over_limit" },
];

/** Minutes after a pending swipe that the parent approves, then the retry. */
const PARENT_APPROVES_AFTER_MIN = 2;
const RETRY_AFTER_MIN = 3;
/** The spec's temporary pass: that merchant, that amount, 10 minutes. */
const PASS_MINUTES = 10;

/** Fixed 32-byte contract id for a seeded merchant, stable across resets. */
export function merchantOnchainId(slug: string): string {
  return `0x${createHash("sha256").update(`demo-family:merchant:${slug}`).digest("hex")}`;
}

export interface SpendingSeedResult {
  merchantsAdded: number;
  policyAdded: boolean;
  cardAdded: boolean;
  historyAdded: number;
}

export async function seedSpendingDemo(
  executor: DbExecutor = db,
): Promise<SpendingSeedResult> {
  return executor.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${SPENDING_SEED_LOCK_KEY})`);
    const family = await getDemoFamily(tx);

    const merchants = await tx
      .insert(merchantsTable)
      .values(
        SEED_MERCHANTS.map((m) => ({ ...m, onchainId: merchantOnchainId(m.slug) })),
      )
      .onConflictDoNothing({ target: merchantsTable.slug })
      .returning({ id: merchantsTable.id });

    const policies = await tx
      .insert(policiesTable)
      .values({ familyId: family.id, ...SEED_POLICY })
      .onConflictDoNothing({ target: policiesTable.familyId })
      .returning({ id: policiesTable.id });

    const members = await tx
      .select()
      .from(membersTable)
      .where(eq(membersTable.familyId, family.id));
    const dependent = members.find((m) => m.role === "dependent");
    const parent = members.find((m) => m.role === "parent");
    if (!dependent || !parent) {
      throw new Error("The demo family needs a parent and a dependent before its card can be seeded.");
    }

    const [existingCard] = await tx
      .select({ id: cardsTable.id })
      .from(cardsTable)
      .where(eq(cardsTable.dependentMemberId, dependent.id));
    const result: SpendingSeedResult = {
      merchantsAdded: merchants.length,
      policyAdded: policies.length > 0,
      cardAdded: false,
      historyAdded: 0,
    };
    // The card and its history are created together, exactly once.
    if (existingCard) return result;

    const now = new Date();
    const [card] = await tx
      .insert(cardsTable)
      .values({
        dependentMemberId: dependent.id,
        last4: BRAND.demo.cardLast4,
        expiryMonth: now.getUTCMonth() + 1,
        expiryYear: now.getUTCFullYear() + 4,
        status: "active",
      })
      .returning();
    result.cardAdded = true;

    const merchantRows = await tx.select().from(merchantsTable);
    const bySlug = new Map(merchantRows.map((m) => [m.slug, m]));
    const today = zonedParts(now, DEMO_TIME_ZONE);
    const minutes = (n: number) => n * 60_000;

    for (const entry of SEED_HISTORY) {
      const merchant = bySlug.get(entry.merchant)!;
      const [hour, minute] = entry.time.split(":").map(Number) as [number, number];
      const day = new Date(Date.UTC(today.year, today.month - 1, today.day - entry.daysAgo));
      const at = zonedTimeToInstant(
        {
          year: day.getUTCFullYear(),
          month: day.getUTCMonth() + 1,
          day: day.getUTCDate(),
          hour,
          minute,
          second: 0,
        },
        DEMO_TIME_ZONE,
      );
      const swipe = (when: Date): SwipeInput => ({
        cardId: card!.id,
        dependentId: dependent.id,
        merchantId: merchant.id,
        merchantName: merchant.name,
        mcc: merchant.mcc,
        merchantCategory: merchant.category,
        items: entry.items,
        amount: entry.amountCents,
        location: entry.location,
        timestamp: toLocalIso(when, DEMO_TIME_ZONE),
      });
      const runSwipe = async (when: Date, previousAuthorizationId?: number) => {
        const ctx = await loadSwipeContext(swipe(when), tx, when);
        const decided = await decideSwipe(ctx, null);
        return recordDecision(ctx, decided, { at: when, previousAuthorizationId }, tx);
      };

      const first = await runSwipe(at);
      result.historyAdded += 1;
      if (first.reasonCode !== entry.expect) {
        throw new Error(
          `Seed history: ${merchant.name} ${entry.amountCents}¢ was decided ${first.reasonCode}, expected ${entry.expect}.`,
        );
      }
      if (!entry.parentApproves) continue;

      // Pending → parent approved → temporary pass → retry approved → settled.
      const resolvedAt = new Date(at.getTime() + minutes(PARENT_APPROVES_AFTER_MIN));
      await tx
        .update(authorizationsTable)
        .set({ status: "parent_approved", resolvedAt, resolvedByMemberId: parent.id })
        .where(and(eq(authorizationsTable.id, first.id), eq(authorizationsTable.status, "pending")));
      await tx.insert(temporaryPassesTable).values({
        cardId: card!.id,
        merchantId: merchant.id,
        maxAmountCents: entry.amountCents,
        expiresAt: new Date(resolvedAt.getTime() + minutes(PASS_MINUTES)),
        createdAt: resolvedAt,
      });
      const retry = await runSwipe(new Date(at.getTime() + minutes(RETRY_AFTER_MIN)), first.id);
      result.historyAdded += 1;
      if (retry.decision !== "APPROVED") {
        throw new Error(
          `Seed history: the ${merchant.name} retry was decided ${retry.reasonCode}, expected approved.`,
        );
      }
    }

    return result;
  });
}
