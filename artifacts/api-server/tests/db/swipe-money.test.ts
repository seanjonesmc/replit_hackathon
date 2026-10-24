import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  bucketsTable,
  cardsTable,
  db,
  membersTable,
  merchantsTable,
  authorizationsTable,
  pool,
  settlementsTable,
  temporaryPassesTable,
  type Authorization,
} from "@workspace/db";
import {
  getSettlement,
  processSwipe,
  runSettlement,
  seedSpendingDemo,
  type SwipeInput,
} from "../../src/services/decisions";
import { insufficientFundsReason } from "../../src/services/decisions/rules";
import {
  decideSwipe,
  loadSwipeContext,
  recordDecision,
} from "../../src/services/decisions/swipes";
import {
  FamilyServiceError,
  getActivity,
  getDemoFamily,
  getParentOverview,
  seedDemoFamily,
} from "../../src/services/family";
import { resetTestDatabase } from "./test-database";

/**
 * The money side of the decision engine, against the test database: an
 * approval only holds its amount (available → held) and a settlement run
 * later moves it held → spent; rejected and pending swipes move nothing;
 * swipes racing for one bucket or one temporary pass never overspend it, two
 * settlement runs never settle a purchase twice, and the spending seed
 * leaves the balances the demo script relies on. The AI guard is off
 * throughout, so the rules alone decide.
 */

// These tests check the database only; never send anything to the chain.
vi.mock("../../src/services/decisions/chain-handoff", () => ({
  handOffToChain: vi.fn(async () => ({ status: "skipped", why: "test" })),
  captureOnChain: vi.fn(async () => ({ status: "skipped", why: "test" })),
  waitForAuthorize: vi.fn(async () => {}),
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

/** The seeded balances with `cents` moved from available to held in one bucket. */
function seededAfterHolding(bucket: string, cents: number): Balances {
  const b = seeded[bucket]!;
  return { ...seeded, [bucket]: { available: b.available - cents, held: b.held + cents, spent: b.spent } };
}

/** The seeded balances with `cents` moved from available to spent (settled) in one bucket. */
function seededAfterSpending(bucket: string, cents: number, from: Balances = seeded): Balances {
  const b = from[bucket]!;
  return { ...from, [bucket]: { available: b.available - cents, held: b.held, spent: b.spent + cents } };
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
  it("holds an approval's amount (available → held) and pays nothing yet", async () => {
    const { authorization, bucketName } = await processSwipe(swipe("trader-joes", 20_00), NO_GUARD);

    expect(authorization).toMatchObject({
      decision: "APPROVED",
      status: "approved",
      reasonCode: "approved",
      bucketId: await bucketId("Food"),
    });
    expect(bucketName).toBe("Food");
    expect(authorization.settledAt).toBeNull();
    expect(authorization.settlementId).toBeNull();
    expect(await balances()).toEqual(seededAfterHolding("Food", 20_00));
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
    expect(await balances()).toEqual(seededAfterHolding("Food", 100_00));
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
    expect(await balances()).toEqual(seededAfterHolding("Social", 20_00));
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
    expect(await balances()).toEqual(seededAfterHolding("Food", 10_00));

    const second = await processSwipe(lateNight, NO_GUARD);
    expect(second.authorization).toMatchObject({ decision: "PENDING", reasonCode: "outside_hours" });
    expect(await balances()).toEqual(seededAfterHolding("Food", 10_00));
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
    expect(await balances()).toEqual(seededAfterHolding("Food", 10_00));
  });
});

describe("settlement", () => {
  /** Approves $18.40 at Trader Joe's and $20 at AMC, and sends one swipe to a parent. */
  async function holdTwoAndAskOnce() {
    const groceries = (await processSwipe(swipe("trader-joes", 18_40), NO_GUARD)).authorization;
    const movie = (await processSwipe(swipe("amc", 20_00), NO_GUARD)).authorization;
    const pending = (await processSwipe(swipe("campus-bookstore", 120_00), NO_GUARD)).authorization;
    expect([groceries.decision, movie.decision, pending.decision]).toEqual(["APPROVED", "APPROVED", "PENDING"]);
    return { groceries, movie, pending };
  }

  it("moves every held purchase to spent, records the run and sends each capture", async () => {
    const { groceries, movie, pending } = await holdTwoAndAskOnce();
    const at = new Date("2026-10-24T19:00:00Z");
    const capture = vi.fn();

    const detail = await runSettlement({ now: at, capture });

    expect(detail.settlement).toMatchObject({ purchaseCount: 2, totalCents: 38_40 });
    expect(detail.settlement.settledAt).toEqual(at);
    expect(detail.purchases.map((p) => [p.authorization.id, p.bucketName])).toEqual([
      [groceries.id, "Food"],
      [movie.id, "Social"],
    ]);
    for (const { authorization } of detail.purchases) {
      expect(authorization).toMatchObject({ settlementId: detail.settlement.id, settledAt: at, issuerRedeemedAt: at });
    }
    expect(detail.issuerAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(capture.mock.calls.map(([id]) => id)).toEqual([groceries.id, movie.id]);

    expect(await balances()).toEqual(seededAfterSpending("Social", 20_00, seededAfterSpending("Food", 18_40)));
    const [stillPending] = await db.select().from(authorizationsTable).where(eq(authorizationsTable.id, pending.id));
    expect(stillPending).toMatchObject({ status: "pending", settledAt: null, settlementId: null });

    // Reading the run back gives the same purchases.
    const again = await getSettlement(detail.settlement.id);
    expect(again.purchases.map((p) => p.authorization.id)).toEqual([groceries.id, movie.id]);
  });

  it("shows a purchase as held, then settled, on the parent's screens", async () => {
    const { groceries } = await holdTwoAndAskOnce();
    const family = await getDemoFamily();
    const row = async () => (await getActivity(family.id)).find((a) => a.id === `purchase-${groceries.id}`)!;

    expect((await row()).settlement).toBe("held");
    expect((await row()).summary).toContain("held in Food");
    const before = await getParentOverview(family.id);
    expect(before).toMatchObject({ heldPurchasesCount: 2, heldTotalCents: 38_40, latestSettlementId: null });
    expect(before.buckets.find((b) => b.name === "Food")?.heldCents).toBe(18_40);

    const { settlement } = await runSettlement({ capture: () => undefined });

    expect((await row()).settlement).toBe("settled");
    expect((await row()).summary).toContain("paid from Food");
    const after = await getParentOverview(family.id);
    expect(after).toMatchObject({ heldPurchasesCount: 0, heldTotalCents: 0, latestSettlementId: settlement.id });
    expect(after.buckets.every((b) => b.heldCents === 0)).toBe(true);
  });

  it("refuses to run when nothing is held, and records nothing", async () => {
    await processSwipe(swipe("liquor-barn", 15_00), NO_GUARD);
    await expect(runSettlement({ capture: () => undefined })).rejects.toBeInstanceOf(FamilyServiceError);
    expect(await db.select().from(settlementsTable)).toHaveLength(0);
    expect(await balances()).toEqual(seeded);
  });

  it("settles each purchase once when two runs start together", async () => {
    await holdTwoAndAskOnce();
    const capture = vi.fn();

    const runs = await Promise.allSettled([runSettlement({ capture }), runSettlement({ capture })]);

    expect(runs.map((r) => r.status).sort()).toEqual(["fulfilled", "rejected"]);
    expect(capture).toHaveBeenCalledTimes(2);
    expect(await db.select().from(settlementsTable)).toHaveLength(1);
    expect(await balances()).toEqual(seededAfterSpending("Social", 20_00, seededAfterSpending("Food", 18_40)));
  });
});
