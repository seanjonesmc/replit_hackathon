import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BRAND } from "@brand/brand.config";
import { bucketsTable, cardsTable, db, familiesTable, membersTable, merchantsTable, pool } from "@workspace/db";
import { getDependentCard, processSwipe, seedSpendingDemo, type SwipeInput } from "../../src/services/decisions";
import {
  FamilyServiceError,
  getActivity,
  getCardAndPolicy,
  getDependentWallet,
  getFundingInsights,
  getParentOverview,
  getSpendingInsights,
  listMemberContributions,
  memberOnchainId,
  seedDemoFamily,
} from "../../src/services/family";
import { resetTestDatabase } from "./test-database";

/**
 * Spending insights and the multi-dependent reads against the test database:
 * the seeded family plus a second child with their own card. The insights
 * must agree with the activity feed and the bucket balances, the feed must
 * name whoever swiped, and the single-dependent screens must keep showing
 * the demo dependent.
 */

vi.mock("../../src/services/decisions/chain-handoff", () => ({
  handOffToChain: vi.fn(async () => ({ status: "skipped", why: "test" })),
  captureOnChain: vi.fn(async () => ({ status: "skipped", why: "test" })),
}));

const NO_GUARD = { aiGuard: null } as const;
const SECOND = "Second Child";

let familyId: number;
let secondId: number;
let demoDependentId: number;

beforeEach(async () => {
  await resetTestDatabase();
  await seedDemoFamily();
  await seedSpendingDemo();

  const [family] = await db.select().from(familiesTable);
  familyId = family!.id;
  const [demo] = await db.select().from(membersTable).where(eq(membersTable.role, "dependent"));
  demoDependentId = demo!.id;

  const [second] = await db
    .insert(membersTable)
    .values({
      familyId,
      displayName: SECOND,
      role: "dependent",
      relationship: "child",
      age: 16,
      onboardingComplete: true,
      onchainId: memberOnchainId("test-second-child"),
    })
    .returning();
  secondId = second!.id;
  const [card] = await db
    .insert(cardsTable)
    .values({ dependentMemberId: secondId, last4: "0001", expiryMonth: 1, expiryYear: 2030, status: "active" })
    .returning();

  const merchants = new Map((await db.select().from(merchantsTable)).map((m) => [m.slug, m]));
  const swipe = (slug: string, amount: number): SwipeInput => {
    const m = merchants.get(slug)!;
    return {
      cardId: card!.id,
      dependentId: secondId,
      merchantId: m.id,
      merchantName: m.name,
      mcc: m.mcc,
      merchantCategory: m.category,
      items: ["test purchase"],
      amount,
      location: "Test location",
      timestamp: "2026-10-23T14:30:00",
    };
  };
  const approved = await processSwipe(swipe("trader-joes", 20_00), NO_GUARD);
  expect(approved.authorization.decision).toBe("APPROVED");
  const declined = await processSwipe(swipe("tipsy-tavern", 15_00), NO_GUARD);
  expect(declined.authorization.decision).toBe("REJECTED");
});

afterAll(() => pool.end());

describe("a family with two dependents", () => {
  it("names the dependent who made each purchase in the activity feed", async () => {
    const purchases = (await getActivity(familyId)).filter((a) => a.kind === "purchase");
    const second = purchases.filter((a) => a.actorName === SECOND);
    expect(second).toHaveLength(2);
    expect(second.every((a) => a.summary.startsWith(SECOND))).toBe(true);
    expect(purchases.filter((a) => a.actorName === BRAND.demo.dependent).length).toBeGreaterThan(0);
    expect(purchases.every((a) => a.actorName === SECOND || a.actorName === BRAND.demo.dependent)).toBe(true);
  });

  it("keeps the demo dependent on the wallet, card and overview", async () => {
    expect((await getDependentWallet(familyId)).dependent.displayName).toBe(BRAND.demo.dependent);
    expect((await getCardAndPolicy(familyId)).card.dependentName).toBe(BRAND.demo.dependent);
    expect((await getDependentCard()).dependentName).toBe(BRAND.demo.dependent);
    expect((await getParentOverview(familyId)).dependentName).toBe(BRAND.demo.dependent);
  });
});

describe("spending insights", () => {
  it("agree with the activity feed and the bucket balances", async () => {
    const insights = await getSpendingInsights(familyId, { period: "all" });
    const feed = (await getActivity(familyId)).filter((a) => a.kind === "purchase");
    const feedSpent = feed.filter((a) => a.decision === "APPROVED").reduce((sum, a) => sum + a.amountCents, 0);
    const feedStopped = feed.filter((a) => a.decision === "REJECTED").reduce((sum, a) => sum + a.amountCents, 0);
    expect(insights.spentCents).toBe(feedSpent);
    expect(insights.declinedCents).toBe(feedStopped);

    const buckets = await db.select().from(bucketsTable).where(eq(bucketsTable.familyId, familyId));
    expect(insights.spentCents).toBe(buckets.reduce((sum, b) => sum + b.spentCents + b.heldCents, 0));
    expect(insights.byBucket.reduce((sum, b) => sum + b.spentCents, 0)).toBe(insights.spentCents);
  });

  it("splits by dependent and filters to one", async () => {
    const all = await getSpendingInsights(familyId, { period: "all" });
    expect(all.dependents.map((d) => d.id)).toEqual([demoDependentId, secondId]);
    const second = all.byDependent.find((d) => d.dependentId === secondId)!;
    expect(second).toMatchObject({ spentCents: 20_00, purchaseCount: 1, declinedCount: 1, declinedCents: 15_00 });
    expect(all.byDependent.reduce((sum, d) => sum + d.spentCents, 0)).toBe(all.spentCents);

    const only = await getSpendingInsights(familyId, { period: "all", dependentId: secondId });
    expect(only.spentCents).toBe(20_00);
    expect(only.byDependent.map((d) => d.dependentId)).toEqual([secondId]);
    expect(only.approvalRate).toBe(0.5);
  });

  it("refuses a member who isn't a dependent", async () => {
    const [parent] = await db.select().from(membersTable).where(eq(membersTable.role, "parent"));
    await expect(getSpendingInsights(familyId, { dependentId: parent!.id })).rejects.toBeInstanceOf(FamilyServiceError);
  });
});

describe("funding insights", () => {
  it("match the funder's contributions and the family's funding", async () => {
    const [grandparent] = await db.select().from(membersTable).where(eq(membersTable.relationship, "grandparent"));
    const insights = await getFundingInsights(grandparent!.id);
    const { totalCents } = await listMemberContributions(grandparent!.id);
    expect(insights.contributedCents).toBe(totalCents);
    expect(insights.byBucket.reduce((sum, b) => sum + b.contributedCents, 0)).toBe(totalCents);

    const buckets = await db.select().from(bucketsTable).where(eq(bucketsTable.familyId, familyId));
    const funded = new Set(insights.byBucket.map((b) => b.bucketId));
    const fundedBuckets = buckets.filter((b) => funded.has(b.id));
    expect(insights.spentFromFundedBucketsCents).toBe(fundedBuckets.reduce((sum, b) => sum + b.spentCents, 0));
    expect(insights.heldInFundedBucketsCents).toBe(fundedBuckets.reduce((sum, b) => sum + b.heldCents, 0));

    // Spent (settled + held) agrees with the parent's insights for the same buckets,
    // including the second child's approved-but-unsettled purchase.
    const family = await getSpendingInsights(familyId, { period: "all" });
    const familySpentInFunded = family.byBucket
      .filter((b) => b.bucketId !== null && funded.has(b.bucketId))
      .reduce((sum, b) => sum + b.spentCents, 0);
    expect(insights.spentFromFundedBucketsCents + insights.heldInFundedBucketsCents).toBe(familySpentInFunded);
    expect(insights.shareOfFamilyFunding).toBeGreaterThan(0);
    expect(insights.shareOfFamilyFunding).toBeLessThanOrEqual(1);
  });
});
