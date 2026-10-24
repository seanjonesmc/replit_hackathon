import { describe, expect, it } from "vitest";
import { parseSwipeTime } from "./clock";
import { evaluateRules, type RuleInputs } from "./rules";

// The seeded demo state after the purchase history: the Balanced policy plus
// the 11pm–6am window, the spec's bucket limits and the Transit bucket agreed
// in docs/plans/demo-preset-swipes.md.
const TIME_ZONE = "America/Los_Angeles";
const POLICY: RuleInputs["policy"] = {
  blockedCategories: ["bar", "liquor", "gambling", "nightclub", "gaming"],
  blockedMerchants: [],
  allowedMerchants: [],
  timeWindows: [{ start: "23:00", end: "06:00" }],
  approvalThresholdCents: null,
};
const BUCKETS: RuleInputs["buckets"] = [
  { id: 1, name: "Food", availableCents: 118_75, perPurchaseLimitCents: 60_00, approvalThresholdCents: 75_00 },
  { id: 2, name: "School", availableCents: 200_00, perPurchaseLimitCents: 150_00, approvalThresholdCents: 100_00 },
  { id: 3, name: "Social", availableCents: 25_00, perPurchaseLimitCents: 40_00, approvalThresholdCents: 30_00 },
  { id: 4, name: "Transit", availableCents: 50_00, perPurchaseLimitCents: 40_00, approvalThresholdCents: 30_00 },
];

function swipe(
  merchantName: string,
  merchantCategory: string,
  amountCents: number,
  timestamp: string,
  cardStatus: "active" | "frozen" = "active",
): RuleInputs {
  const time = parseSwipeTime(timestamp, TIME_ZONE);
  if (!time) throw new Error(`Bad timestamp ${timestamp}`);
  return {
    card: { id: 1, status: cardStatus },
    swipe: { merchantId: 1, merchantName, merchantCategory, items: [], amountCents, localMinutes: time.localMinutes },
    policy: POLICY,
    buckets: BUCKETS,
    passes: [],
    now: time.instant,
  };
}

const DAYTIME = "2026-10-24T14:30:00-07:00";
const LATE_NIGHT = "2026-10-24T02:10:00-07:00";

/** The input again with an unused 10-minute pass for this card and merchant. */
function withParentPass(input: RuleInputs, maxAmountCents: number): RuleInputs {
  return {
    ...input,
    passes: [
      {
        id: 9,
        cardId: input.card!.id,
        merchantId: input.swipe.merchantId!,
        maxAmountCents,
        expiresAt: new Date(input.now.getTime() + 10 * 60_000),
        usedAt: null,
      },
    ],
  };
}

describe("evaluateRules: the spec's preset swipes", () => {
  it.each([
    { name: "Trader Joe's $18.40, daytime", input: swipe("Trader Joe's", "grocery", 18_40, DAYTIME), decision: "APPROVED", code: "approved", bucket: "Food" },
    { name: "Campus Bookstore $24.00", input: swipe("Campus Bookstore", "bookstore", 24_00, DAYTIME), decision: "APPROVED", code: "approved", bucket: "School" },
    { name: "The Tipsy Tavern $32.00", input: swipe("The Tipsy Tavern", "bar", 32_00, DAYTIME), decision: "REJECTED", code: "blocked_category", bucket: null },
    { name: "Steam $14.99", input: swipe("Steam", "gaming", 14_99, DAYTIME), decision: "REJECTED", code: "blocked_category", bucket: null },
    { name: "Uber at 2:10am $22.00", input: swipe("Uber", "rideshare", 22_00, LATE_NIGHT), decision: "PENDING", code: "outside_hours", bucket: "Transit" },
    { name: "Apple Store $129.00", input: swipe("Apple Store", "electronics", 129_00, DAYTIME), decision: "PENDING", code: "needs_approval", bucket: "School" },
    { name: "any swipe on a frozen card", input: swipe("Trader Joe's", "grocery", 18_40, DAYTIME, "frozen"), decision: "REJECTED", code: "card_inactive", bucket: null },
  ])("$name → $decision $code", ({ input, decision, code, bucket }) => {
    const result = evaluateRules(input);

    expect(result.decision).toBe(decision);
    expect(result.reasonCode).toBe(code);
    expect(result.bucket?.name ?? null).toBe(bucket);
    expect(result.reason).toMatch(/^[A-Z].+\.$/);
    // A hard rule decided each one, so the AI guard never sees them.
    expect(result.sendToAiGuard).toBeNull();
  });
});

// The spec conflicts settled in docs/plans/demo-preset-swipes.md.
describe("evaluateRules: the agreed answers to the spec conflicts", () => {
  it.each([
    { name: "Apple Store $129.00 retried with the parent's pass", input: withParentPass(swipe("Apple Store", "electronics", 129_00, DAYTIME), 129_00), decision: "APPROVED", code: "approved", bucket: "School" },
    { name: "Uber at 2:10am $22.00 retried with the parent's pass", input: withParentPass(swipe("Uber", "rideshare", 22_00, LATE_NIGHT), 22_00), decision: "APPROVED", code: "approved", bucket: "Transit" },
    { name: "Uber $22.00, daytime", input: swipe("Uber", "rideshare", 22_00, DAYTIME), decision: "APPROVED", code: "approved", bucket: "Transit" },
    { name: "Trader Joe's $65.00 (over Food's $60 limit, under its $75 threshold)", input: swipe("Trader Joe's", "grocery", 65_00, DAYTIME), decision: "REJECTED", code: "over_limit", bucket: "Food" },
  ])("$name → $decision $code", ({ input, decision, code, bucket }) => {
    const result = evaluateRules(input);

    expect(result.decision).toBe(decision);
    expect(result.reasonCode).toBe(code);
    expect(result.bucket?.name ?? null).toBe(bucket);
    expect(result.sendToAiGuard).toBeNull();
  });
});
