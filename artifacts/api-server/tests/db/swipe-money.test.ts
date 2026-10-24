import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  bucketsTable,
  cardsTable,
  db,
  membersTable,
  merchantsTable,
  pool,
  temporaryPassesTable,
  type Authorization,
} from "@workspace/db";
import { processSwipe, seedSpendingDemo, type SwipeInput } from "../../src/services/decisions";
import { insufficientFundsReason } from "../../src/services/decisions/rules";
import {
  decideSwipe,
  loadSwipeContext,
  recordDecision,
} from "../../src/services/decisions/swipes";
import { seedDemoFamily } from "../../src/services/family";
import { resetTestDatabase } from "./test-database";

/**
 * The money side of the decision engine, against the test database: an
 * approval moves the amount available → held → spent before the swipe
 * returns, rejected and pending swipes move nothing, swipes racing for one
 * bucket or one temporary pass never overspend it, and the spending seed
 * leaves the balances the demo script relies on. The AI guard is off
 * throughout, so the rules alone decide.
 */

// These tests check the database only; never send anything to the chain.
vi.mock("../../src/services/decisions/chain-handoff", () => ({
  handOffToChain: vi.fn(async () => {}),
}));

const NO_GUARD = { aiGuard: null } as const;

type Balances = Record<string, { available: number; held: number; spent: number }>;

/** What the spending seed leaves in each bucket, in cents. The racing tests rely on it. */
const SEEDED: Balances = {
  Food: { available: 118_75, held: 0, spent: 31_25 },
  School: { available: 200_00, held: 0, spent: 0 },
  Social: { available: 25_00, held: 0, spent: 35_00 },
};

let swipe: (merchant: string, amount: number, time?: string) => SwipeInput;
/** Every bucket's balances right after seeding. */
let seeded: Balances;

/** Every test starts from a freshly seeded family, the way the server seeds it. */
beforeEach(async () => {
  await resetTestDatabase();
  await seedDemoFamily();
  await seedSpendingDemo();

  const [dependent] = await db.select().from(membersTable).where(eq(membersTable.role, "dependent"));
  const [card] = await db.select().from(cardsTable).where(eq(cardsTable.dependentMemberId, dependent!.id));
  const merchants = new Map((await db.select().from(merchantsTable)).map((m) => [m.slug, m]));

  /** A seeded merchant's swipe on the demo card at a family-clock time. */
  swipe = (slug, amount, time = "14:30") => {
    const merchant = merchants.get(slug);
    if (!merchant) throw new Error(`No seeded merchant "${slug}"`);
    return {
      cardId: card!.id,
      dependentId: dependent!.id,
      merchantId: merchant.id,
      merchantName: merchant.name,
      mcc: merchant.mcc,
      merchantCategory: merchant.category,
      items: ["test purchase"],
      amount,
      location: "Test location",
      timestamp: `2026-10-23T${time}:00`,
    };
  };
  seeded = await balances();
});

afterAll(() => pool.end());

async function balances(): Promise<Balances> {
  const rows = await db.select().from(bucketsTable).orderBy(bucketsTable.id);
  return Object.fromEntries(
    rows.map((b) => [b.name, { available: b.availableCents, held: b.heldCents, spent: b.spentCents }]),
  );
}

/** The seeded balances with `cents` moved from available to spent in one bucket. */
function seededAfterSpending(bucket: string, cents: number): Balances {
  const b = seeded[bucket]!;
  return { ...seeded, [bucket]: { available: b.available - cents, held: b.held, spent: b.spent + cents } };
}

async function bucketId(name: string) {
  const [bucket] = await db.select({ id: bucketsTable.id }).from(bucketsTable).where(eq(bucketsTable.name, name));
  return bucket!.id;
}

/** A parent's one-time OK for this merchant, up to `maxAmountCents`, for 10 minutes. */
async function grantPass(input: SwipeInput, maxAmountCents: number) {
  const [pass] = await db
    .insert(temporaryPassesTable)
    .values({
      cardId: input.cardId,
      merchantId: input.merchantId!,
      maxAmountCents,
      expiresAt: new Date(Date.now() + 10 * 60_000),
    })
    .returning();
  return pass!;
}

const decisions = (rows: Authorization[]) => rows.map((a) => a.decision).sort();

describe("the spending seed", () => {
  it("leaves Food $118.75, School $200 and Social $25, with nothing held", async () => {
    expect(seeded).toMatchObject(SEEDED);
    expect(Object.values(seeded).every((b) => b.held === 0)).toBe(true);
  });
});

describe("a swipe's money movement", () => {
  it("moves an approval's amount from available to spent before the swipe returns", async () => {
    const { authorization, bucketName } = await processSwipe(swipe("trader-joes", 20_00), NO_GUARD);

    expect(authorization).toMatchObject({
      decision: "APPROVED",
      status: "approved",
      reasonCode: "approved",
      bucketId: await bucketId("Food"),
    });
    expect(bucketName).toBe("Food");
    expect(authorization.settledAt).not.toBeNull();
    expect(await balances()).toEqual(seededAfterSpending("Food", 20_00));
  });

  it.each([
    { what: "a blocked category", merchant: "liquor-barn", amount: 15_00, time: "14:30", decision: "REJECTED", reasonCode: "blocked_category" },
    { what: "an over-limit purchase", merchant: "trader-joes", amount: 72_00, time: "14:30", decision: "REJECTED", reasonCode: "over_limit" },
    { what: "a purchase over the approval threshold", merchant: "campus-bookstore", amount: 120_00, time: "14:30", decision: "PENDING", reasonCode: "needs_approval" },
    { what: "a late-night purchase", merchant: "trader-joes", amount: 10_00, time: "23:30", decision: "PENDING", reasonCode: "outside_hours" },
  ])("moves no money for $what ($decision)", async ({ merchant, amount, time, decision, reasonCode }) => {
    const { authorization } = await processSwipe(swipe(merchant, amount, time), NO_GUARD);

    expect(authorization).toMatchObject({
      decision,
      reasonCode,
      status: decision === "REJECTED" ? "rejected" : "pending",
      settledAt: null,
    });
    expect(await balances()).toEqual(seeded);
  });

  it("moves no money for a custom swipe whose category has no bucket (PENDING)", async () => {
    const custom = { ...swipe("trader-joes", 18_00), merchantId: null, merchantName: "Corner Pet Shop", mcc: "5995", merchantCategory: "pet supplies" };
    const { authorization } = await processSwipe(custom, NO_GUARD);

    expect(authorization).toMatchObject({
      decision: "PENDING",
      reasonCode: "needs_approval",
      bucketId: null,
      settledAt: null,
    });
    expect(await balances()).toEqual(seeded);
  });
});

describe("swipes racing for one bucket", () => {
  it("approves only what the bucket holds when five $50 swipes arrive at once", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => processSwipe(swipe("trader-joes", 50_00), NO_GUARD)),
    );
    const stored = results.map((r) => r.authorization);

    // $118.75 covers two $50 purchases, never a third.
    expect(decisions(stored)).toEqual(["APPROVED", "APPROVED", "REJECTED", "REJECTED", "REJECTED"]);
    expect(stored.filter((a) => a.decision === "REJECTED").every((a) => a.reasonCode === "insufficient_funds")).toBe(true);
    expect(await balances()).toEqual(seededAfterSpending("Food", 100_00));
  });

  it("re-checks the locked bucket when swipes the rules all approved are stored together", async () => {
    // All three see Social's $25 before any is stored, so the rules approve each.
    const contexts = await Promise.all([1, 2, 3].map(() => loadSwipeContext(swipe("amc", 20_00))));
    const decided = await Promise.all(contexts.map((ctx) => decideSwipe(ctx, null)));
    expect(decided.map((d) => d.decision)).toEqual(["APPROVED", "APPROVED", "APPROVED"]);

    const stored = await Promise.all(contexts.map((ctx, i) => recordDecision(ctx, decided[i]!)));

    expect(decisions(stored)).toEqual(["APPROVED", "REJECTED", "REJECTED"]);
    for (const a of stored.filter((s) => s.decision === "REJECTED")) {
      expect(a).toMatchObject({
        reasonCode: "insufficient_funds",
        reason: insufficientFundsReason("Social", 5_00),
        settledAt: null,
      });
    }
    expect(await balances()).toEqual(seededAfterSpending("Social", 20_00));
  });
});

describe("a temporary pass", () => {
  it("approves one purchase, then stops working", async () => {
    // Late at night the swipe would wait for a parent; the pass skips that once.
    const lateNight = swipe("trader-joes", 10_00, "23:30");
    const pass = await grantPass(lateNight, 10_00);

    const first = await processSwipe(lateNight, NO_GUARD);
    expect(first.authorization).toMatchObject({ decision: "APPROVED", reasonCode: "approved" });
    const [used] = await db.select().from(temporaryPassesTable).where(eq(temporaryPassesTable.id, pass.id));
    expect(used!.usedAt).not.toBeNull();
    expect(await balances()).toEqual(seededAfterSpending("Food", 10_00));

    const second = await processSwipe(lateNight, NO_GUARD);
    expect(second.authorization).toMatchObject({ decision: "PENDING", reasonCode: "outside_hours" });
    expect(await balances()).toEqual(seededAfterSpending("Food", 10_00));
  });

  it("pays for only one of two swipes that both counted on it", async () => {
    const lateNight = swipe("trader-joes", 10_00, "23:30");
    await grantPass(lateNight, 10_00);

    const contexts = await Promise.all([1, 2].map(() => loadSwipeContext(lateNight)));
    const decided = await Promise.all(contexts.map((ctx) => decideSwipe(ctx, null)));
    expect(decided.every((d) => d.decision === "APPROVED" && d.passId !== null)).toBe(true);

    const stored = await Promise.all(contexts.map((ctx, i) => recordDecision(ctx, decided[i]!)));

    expect(decisions(stored)).toEqual(["APPROVED", "PENDING"]);
    expect(stored.find((a) => a.decision === "PENDING")).toMatchObject({
      reasonCode: "needs_approval",
      settledAt: null,
    });
    expect(await balances()).toEqual(seededAfterSpending("Food", 10_00));
  });
});
