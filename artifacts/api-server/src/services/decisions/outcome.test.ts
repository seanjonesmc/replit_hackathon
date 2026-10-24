import { describe, expect, it } from "vitest";
import { NEEDS_PARENT_REVIEW, type AiGuardResult } from "../ai";
import {
  applyAiGuardOutcome,
  fromRules,
  passAlreadyUsed,
  recheckAtCommit,
  type SwipeDecision,
} from "./outcome";
import type { RuleBucket, RuleResult } from "./rules";

// The seeded buckets after the purchase history.
const FOOD: RuleBucket = { id: 1, name: "Food", availableCents: 118_75, perPurchaseLimitCents: 60_00, approvalThresholdCents: 75_00 };
const SCHOOL: RuleBucket = { id: 2, name: "School", availableCents: 200_00, perPurchaseLimitCents: 150_00, approvalThresholdCents: 100_00 };
const SOCIAL: RuleBucket = { id: 3, name: "Social", availableCents: 25_00, perPurchaseLimitCents: 40_00, approvalThresholdCents: 30_00 };
const BUCKETS = [FOOD, SCHOOL, SOCIAL];

/** A suspicious-item swipe at a grocery: step 4 mapped it to Food. */
const SUSPICIOUS_IN_FOOD: RuleResult = {
  decision: "APPROVED",
  reasonCode: "approved",
  reason: "Approved and held in Food until settlement.",
  bucket: FOOD,
  passId: null,
  sendToAiGuard: "suspicious",
};

/** A custom swipe whose category the table doesn't map. */
const AMBIGUOUS: RuleResult = {
  decision: "PENDING",
  reasonCode: "needs_approval",
  reason: NEEDS_PARENT_REVIEW,
  bucket: null,
  passId: null,
  sendToAiGuard: "ambiguous",
};

function guardSays(
  decision: AiGuardResult["decision"],
  bucket: AiGuardResult["bucket"],
): AiGuardResult {
  return {
    decision,
    reasonCode: decision === "APPROVED" ? "approved" : "needs_approval",
    reason: decision === "APPROVED" ? "Looks like normal shopping." : "A parent should look at this.",
    bucket,
    confidence: 0.9,
    decidedBy: "AI guard",
    fallback: false,
    latencyMs: 12,
  };
}

const situation = (amountCents: number) => ({
  amountCents,
  buckets: BUCKETS,
  familyApprovalThresholdCents: null,
});

describe("applyAiGuardOutcome: the AI guard can't move money from the wrong bucket", () => {
  it("keeps the category's bucket when the guard picks another one", () => {
    const result = applyAiGuardOutcome(SUSPICIOUS_IN_FOOD, guardSays("APPROVED", "School"), situation(12_00));

    expect(result.decision).toBe("APPROVED");
    expect(result.bucketId).toBe(FOOD.id);
    expect(result.decidedBy).toBe("ai_guard");
  });

  it("uses the guard's bucket only when the category isn't mapped", () => {
    const result = applyAiGuardOutcome(AMBIGUOUS, guardSays("APPROVED", "School"), situation(12_50));

    expect(result.decision).toBe("APPROVED");
    expect(result.bucketId).toBe(SCHOOL.id);
  });

  it.each([
    { name: "over the guard bucket's per-purchase limit", amount: 45_00, reason: /per-purchase limit for Social/ },
    { name: "over the guard bucket's approval threshold", amount: 35_00, reason: /over \$30\.00 from Social/ },
  ])("sends an approval $name to a parent", ({ amount, reason }) => {
    const result = applyAiGuardOutcome(AMBIGUOUS, guardSays("APPROVED", "Social"), situation(amount));

    expect(result.decision).toBe("PENDING");
    expect(result.reasonCode).toBe("needs_approval");
    expect(result.reason).toMatch(reason);
  });

  it("sends an approval over the family-wide threshold to a parent", () => {
    const result = applyAiGuardOutcome(AMBIGUOUS, guardSays("APPROVED", "School"), {
      ...situation(20_00),
      familyApprovalThresholdCents: 15_00,
    });

    expect(result.decision).toBe("PENDING");
  });

  it("sends an approval with no bucket, or a missing answer, to a parent", () => {
    for (const result of [
      applyAiGuardOutcome(AMBIGUOUS, guardSays("APPROVED", null), situation(9_00)),
      applyAiGuardOutcome(AMBIGUOUS, null, situation(9_00)),
    ]) {
      expect(result).toMatchObject({ decision: "PENDING", reasonCode: "needs_approval", reason: NEEDS_PARENT_REVIEW, passId: null });
    }
  });
});

describe("recheckAtCommit: decisions are re-checked against the locked rows", () => {
  const approved: SwipeDecision = { ...fromRules(SUSPICIOUS_IN_FOOD), decidedBy: "ai_guard", aiConfidence: 0.9 };
  const active = { status: "active" as const };

  it("rejects an approval when the card was frozen while the guard decided", () => {
    const result = recheckAtCommit(approved, { card: { status: "frozen" }, bucket: FOOD, amountCents: 18_40 });

    expect(result).toMatchObject({
      decision: "REJECTED",
      reasonCode: "card_inactive",
      decidedBy: "rule",
      aiConfidence: null,
      bucketId: null,
    });
  });

  it("rejects a pending swipe on a card frozen meanwhile", () => {
    const pending = applyAiGuardOutcome(AMBIGUOUS, null, situation(9_00));
    const result = recheckAtCommit(pending, { card: { status: "frozen" }, bucket: null, amountCents: 9_00 });

    expect(result.reasonCode).toBe("card_inactive");
  });

  it("rejects an approval when another swipe drained the bucket first", () => {
    const result = recheckAtCommit(approved, {
      card: active,
      bucket: { name: "Food", availableCents: 1_95 },
      amountCents: 18_40,
    });

    expect(result).toMatchObject({ decision: "REJECTED", reasonCode: "insufficient_funds", bucketId: FOOD.id });
    expect(result.reason).toBe("Not enough left in Food: $1.95 remaining.");
  });

  it("never approves without a bucket to pay from", () => {
    const result = recheckAtCommit({ ...approved, bucketId: null }, { card: active, bucket: null, amountCents: 18_40 });

    expect(result.decision).toBe("PENDING");
  });

  it("keeps an approval when the card is active and the money is there", () => {
    expect(recheckAtCommit(approved, { card: active, bucket: FOOD, amountCents: 18_40 })).toEqual(approved);
  });

  it("asks a parent again when the temporary pass was already used", () => {
    expect(passAlreadyUsed({ ...approved, passId: 7 })).toMatchObject({ decision: "PENDING", passId: null });
  });
});
