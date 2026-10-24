import { describe, expect, it } from "vitest";
import { BRAND } from "@brand/brand.config";
import { orderDependents, primaryDependent } from "./family";
import {
  computeFundingInsights,
  computeSpendingInsights,
  type InsightPurchase,
  type InsightsPeriod,
} from "./insights";

/**
 * The KPI math over fixture rows, for a family with two dependents. Pure
 * functions: no database. Times are on a Pacific family clock (PDT, UTC−7, in
 * October 2026), with "now" at noon on Saturday Oct 24.
 */

const TZ = "America/Los_Angeles";
const NOW = new Date("2026-10-24T19:00:00Z");
const KID_A = { id: 10, displayName: "Kid A" };
const KID_B = { id: 11, displayName: "Kid B" };
const FOOD = 1;
const SCHOOL = 2;

const buckets = [
  { id: FOOD, name: "Bucket One", icon: "food" as const, fundedCents: 200_00, spentCents: 95_00, heldCents: 5_00, availableCents: 100_00 },
  { id: SCHOOL, name: "Bucket Two", icon: "school" as const, fundedCents: 100_00, spentCents: 25_00, heldCents: 0, availableCents: 75_00 },
];

let nextId = 1;
function purchase(p: Partial<InsightPurchase> & Pick<InsightPurchase, "dependentMemberId" | "amountCents" | "swipedAt">): InsightPurchase {
  return {
    id: nextId++,
    bucketId: FOOD,
    merchantName: "Corner Cafe",
    decision: "APPROVED",
    status: "approved",
    previousAuthorizationId: null,
    ...p,
  };
}
const at = (iso: string) => new Date(iso);

// Ids are fixed so the retry can point at its original.
nextId = 1;
const ROWS: InsightPurchase[] = [
  /* 1 */ purchase({ dependentMemberId: KID_A.id, amountCents: 10_00, swipedAt: at("2026-10-24T17:00:00Z") }),
  /* 2 */ purchase({ dependentMemberId: KID_B.id, amountCents: 25_00, bucketId: SCHOOL, merchantName: "Book Shop", swipedAt: at("2026-10-22T16:00:00Z") }),
  // A pending swipe the parent said yes to (3), then its approved retry (4).
  /* 3 */ purchase({ dependentMemberId: KID_A.id, amountCents: 80_00, decision: "PENDING", status: "parent_approved", merchantName: "Grocer", swipedAt: at("2026-10-21T18:00:00Z") }),
  /* 4 */ purchase({ dependentMemberId: KID_A.id, amountCents: 80_00, merchantName: "Grocer", previousAuthorizationId: 3, swipedAt: at("2026-10-21T18:05:00Z") }),
  /* 5 */ purchase({ dependentMemberId: KID_B.id, amountCents: 30_00, decision: "REJECTED", status: "rejected", bucketId: null, merchantName: "Arcade", swipedAt: at("2026-10-23T03:00:00Z") }),
  /* 6 */ purchase({ dependentMemberId: KID_A.id, amountCents: 90_00, decision: "PENDING", status: "pending", merchantName: "Gadget Store", swipedAt: at("2026-10-24T18:00:00Z") }),
  /* 7 */ purchase({ dependentMemberId: KID_B.id, amountCents: 40_00, decision: "PENDING", status: "parent_declined", merchantName: "Concert Hall", swipedAt: at("2026-10-20T20:00:00Z") }),
  // Exactly midnight on Oct 18, the first day of the 7-day period.
  /* 8 */ purchase({ dependentMemberId: KID_A.id, amountCents: 5_00, swipedAt: at("2026-10-18T07:00:00Z") }),
  // One second before it: the previous period.
  /* 9 */ purchase({ dependentMemberId: KID_A.id, amountCents: 7_00, swipedAt: at("2026-10-18T06:59:59Z") }),
  // Midnight Oct 11: the previous period's first moment.
  /* 10 */ purchase({ dependentMemberId: KID_B.id, amountCents: 12_00, bucketId: SCHOOL, merchantName: "Book Shop", swipedAt: at("2026-10-11T07:00:00Z") }),
  // Before both periods.
  /* 11 */ purchase({ dependentMemberId: KID_B.id, amountCents: 9_99, bucketId: SCHOOL, merchantName: "Book Shop", swipedAt: at("2026-10-11T06:00:00Z") }),
];

function insights(period: InsightsPeriod, dependentId: number | null = null, purchases: InsightPurchase[] = ROWS) {
  return computeSpendingInsights({
    purchases,
    buckets,
    dependents: [KID_A, KID_B],
    period,
    dependentId,
    now: NOW,
    timeZone: TZ,
  });
}

describe("spending insights for the whole family", () => {
  const week = insights("7d");

  it("counts approved purchases once each, a parent-approved retry included", () => {
    // 1 + 2 + 4 (the retry, not its original) + 8.
    expect(week.spentCents).toBe(10_00 + 25_00 + 80_00 + 5_00);
    expect(week.purchaseCount).toBe(4);
    expect(week.averagePurchaseCents).toBe(30_00);
    expect(week.topMerchants[0]).toEqual({ merchantName: "Grocer", spentCents: 80_00, purchaseCount: 1 });
  });

  it("leaves declined and pending purchases out of spend", () => {
    // Declined by the rules (5) and by a parent (7); 6 is still pending.
    expect(week.declinedCount).toBe(2);
    expect(week.declinedCents).toBe(30_00 + 40_00);
    expect(week.pendingCount).toBe(1);
    expect(week.decidedCount).toBe(6);
    expect(week.approvalRate).toBeCloseTo(4 / 6);
    expect(week.topMerchants.map((m) => m.merchantName)).not.toContain("Gadget Store");
  });

  it("starts the period at family-clock midnight and compares with the period before", () => {
    expect(week.periodStart?.toISOString()).toBe("2026-10-18T07:00:00.000Z");
    // 9 (one second before the period) and 10 (the previous period's first moment).
    expect(week.previousPeriodSpentCents).toBe(7_00 + 12_00);
  });

  it("has one day per family-clock day, oldest first", () => {
    expect(week.daily.map((d) => d.date)).toEqual([
      "2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24",
    ]);
    expect(week.daily.map((d) => d.spentCents)).toEqual([5_00, 0, 0, 80_00, 25_00, 0, 10_00]);
    expect(week.daily.reduce((sum, d) => sum + d.spentCents, 0)).toBe(week.spentCents);
  });

  it("splits spending by bucket and by dependent, with shares that add up", () => {
    expect(week.byBucket.map((b) => [b.bucketName, b.spentCents, b.purchaseCount])).toEqual([
      ["Bucket One", 95_00, 3],
      ["Bucket Two", 25_00, 1],
    ]);
    expect(week.byBucket.reduce((sum, b) => sum + b.share, 0)).toBeCloseTo(1);
    expect(week.byDependent).toEqual([
      { dependentId: KID_A.id, dependentName: "Kid A", spentCents: 95_00, purchaseCount: 3, declinedCount: 0, declinedCents: 0, share: 95 / 120 },
      { dependentId: KID_B.id, dependentName: "Kid B", spentCents: 25_00, purchaseCount: 1, declinedCount: 2, declinedCents: 70_00, share: 25 / 120 },
    ]);
  });

  it("reports bucket usage from the bucket balances, whatever the period", () => {
    expect(week.bucketUsage).toEqual(insights("all").bucketUsage);
    expect(week.bucketUsage[0]).toMatchObject({ fundedCents: 200_00, spentCents: 95_00, heldCents: 5_00 });
  });

  it("covers everything for all time, with no previous period", () => {
    const all = insights("all");
    expect(all.periodStart).toBeNull();
    expect(all.previousPeriodSpentCents).toBeNull();
    expect(all.spentCents).toBe(120_00 + 7_00 + 12_00 + 9_99);
    expect(all.daily[0]?.date).toBe("2026-10-10");
    expect(all.daily.at(-1)?.date).toBe("2026-10-24");
  });
});

describe("spending insights for one dependent", () => {
  it("counts only that dependent's purchases", () => {
    const a = insights("7d", KID_A.id);
    expect(a.dependentId).toBe(KID_A.id);
    expect(a.spentCents).toBe(95_00);
    expect(a.purchaseCount).toBe(3);
    expect(a.declinedCount).toBe(0);
    expect(a.pendingCount).toBe(1);
    expect(a.approvalRate).toBe(1);
    expect(a.previousPeriodSpentCents).toBe(7_00);
    expect(a.byDependent.map((d) => d.dependentId)).toEqual([KID_A.id]);
    expect(a.topMerchants.map((m) => m.merchantName)).not.toContain("Book Shop");

    const b = insights("7d", KID_B.id);
    expect(b.spentCents).toBe(25_00);
    expect(b.declinedCents).toBe(70_00);
    expect(b.approvalRate).toBeCloseTo(1 / 3);
    expect(b.previousPeriodSpentCents).toBe(12_00);
  });

  it("still lists every dependent for the filter", () => {
    expect(insights("7d", KID_B.id).dependents).toEqual([KID_A, KID_B]);
  });
});

describe("empty periods", () => {
  it("returns zeros and nulls, not made-up numbers, with no purchases", () => {
    const empty = insights("7d", null, []);
    expect(empty.spentCents).toBe(0);
    expect(empty.purchaseCount).toBe(0);
    expect(empty.averagePurchaseCents).toBeNull();
    expect(empty.approvalRate).toBeNull();
    expect(empty.previousPeriodSpentCents).toBeNull();
    expect(empty.topMerchants).toEqual([]);
    expect(empty.byBucket.every((b) => b.spentCents === 0 && b.share === 0)).toBe(true);
    expect(empty.daily.every((d) => d.spentCents === 0)).toBe(true);
    expect(insights("all", null, []).daily).toEqual([]);
  });

  it("leaves out the comparison when the previous period had no spending", () => {
    // 30 days covers every row, so the 30 days before it are empty.
    expect(insights("30d").previousPeriodSpentCents).toBeNull();
  });

  it("counts a period with only pending purchases as no spending", () => {
    const pendingOnly = insights("7d", null, ROWS.filter((r) => r.status === "pending"));
    expect(pendingOnly.spentCents).toBe(0);
    expect(pendingOnly.pendingCount).toBe(1);
    expect(pendingOnly.approvalRate).toBeNull();
  });
});

describe("funding insights", () => {
  const contributions = [
    { funderMemberId: 1, bucketId: FOOD, amountCents: 150_00 },
    { funderMemberId: 2, bucketId: FOOD, amountCents: 50_00 },
    { funderMemberId: 2, bucketId: SCHOOL, amountCents: 100_00 },
  ];

  it("gives one funder's contributions by bucket and share of all funding", () => {
    const f = computeFundingInsights({ memberId: 2, contributions, buckets });
    expect(f.contributedCents).toBe(150_00);
    expect(f.familyFundedCents).toBe(300_00);
    expect(f.shareOfFamilyFunding).toBe(0.5);
    expect(f.byBucket.map((b) => [b.bucketName, b.contributedCents, b.share])).toEqual([
      ["Bucket One", 50_00, 1 / 3],
      ["Bucket Two", 100_00, 2 / 3],
    ]);
    // Pooled: the buckets' spending overall, not "their" dollars.
    expect(f.spentFromFundedBucketsCents).toBe(95_00 + 25_00);
    expect(f.heldInFundedBucketsCents).toBe(5_00);
  });

  it("only lists buckets the funder added to", () => {
    const f = computeFundingInsights({ memberId: 1, contributions, buckets });
    expect(f.byBucket.map((b) => b.bucketId)).toEqual([FOOD]);
    expect(f.spentFromFundedBucketsCents).toBe(95_00);
  });

  it("has no share when nobody has added money", () => {
    const f = computeFundingInsights({ memberId: 1, contributions: [], buckets });
    expect(f.contributedCents).toBe(0);
    expect(f.shareOfFamilyFunding).toBeNull();
    expect(f.byBucket).toEqual([]);
  });
});

describe("choosing the dependent the single-dependent screens show", () => {
  const demoName = BRAND.demo.dependent;
  const member = (id: number, displayName: string, role: "dependent" | "parent" = "dependent") => ({ id, displayName, role });

  it("puts the demo dependent first even when another child has a lower id", () => {
    const members = [member(1, "Parent", "parent"), member(2, "Older Child"), member(5, demoName), member(3, "Younger Child")];
    expect(primaryDependent(members)?.id).toBe(5);
    expect(orderDependents(members).map((m) => m.id)).toEqual([5, 2, 3]);
  });

  it("falls back to the lowest id without the demo dependent", () => {
    expect(primaryDependent([member(9, "Second Child"), member(4, "First Child")])?.id).toBe(4);
    expect(primaryDependent([member(1, "Parent", "parent")])).toBeUndefined();
  });
});
