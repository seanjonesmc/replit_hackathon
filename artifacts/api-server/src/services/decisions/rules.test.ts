import { describe, expect, it } from "vitest";
import { parseSwipeTime } from "./clock";
import { evaluateRules, type RuleInputs } from "./rules";

// The seeded demo state after the purchase history: the Balanced policy plus
// the 11pm–6am window, and the spec's bucket limits.
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

describe("evaluateRules: the spec's preset swipes", () => {
  it.each([
    { name: "Trader Joe's $18.40, daytime", input: swipe("Trader Joe's", "grocery", 18_40, DAYTIME), decision: "APPROVED", code: "approved", bucket: "Food" },
    { name: "Campus Bookstore $24.00", input: swipe("Campus Bookstore", "bookstore", 24_00, DAYTIME), decision: "APPROVED", code: "approved", bucket: "School" },
    { name: "The Tipsy Tavern $32.00", input: swipe("The Tipsy Tavern", "bar", 32_00, DAYTIME), decision: "REJECTED", code: "blocked_category", bucket: null },
    { name: "Steam $14.99", input: swipe("Steam", "gaming", 14_99, DAYTIME), decision: "REJECTED", code: "blocked_category", bucket: null },
    { name: "Uber at 2:10am $22.00", input: swipe("Uber", "rideshare", 22_00, "2026-10-24T02:10:00-07:00"), decision: "PENDING", code: "outside_hours", bucket: null },
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
