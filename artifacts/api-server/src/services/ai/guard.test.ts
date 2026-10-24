import { describe, expect, it, vi } from "vitest";
import {
  runAiGuard,
  type AiGuardInput,
  type FamilyPolicy,
  type ModelCaller,
  type RuleDecision,
} from "./index";

// The model is always stubbed: these tests make no network calls.
const stub = (reply: unknown) =>
  vi.fn<ModelCaller>(async () => (typeof reply === "string" ? reply : JSON.stringify(reply)));

const policy: FamilyPolicy = {
  buckets: [
    { name: "Food", budgetCents: 15000, period: "week", perTxLimitCents: 6000, approvalThresholdCents: 7500 },
    { name: "School", budgetCents: 20000, period: null, perTxLimitCents: 15000, approvalThresholdCents: 10000 },
  ],
  blockedCategories: ["bar", "liquor", "gambling", "nightclub", "gaming"],
  approvalThresholdCents: null,
  timeWindows: [{ start: "23:00", end: "06:00" }],
  blockedMerchants: [],
  allowedMerchants: [],
};

const input = (amount = 1840): AiGuardInput => ({
  payload: {
    cardId: "card-1",
    dependentId: "dep-1",
    merchantId: "m-1",
    merchantName: "Corner Mart",
    mcc: "5499",
    merchantCategory: "convenience store",
    items: ["sandwich", "orange juice"],
    amount,
    location: "Campus",
    timestamp: "2026-10-24T12:30:00-05:00",
  },
  policy,
  bucketAvailableCents: { Food: 9000, School: 20000 },
  ruleOutcome: "undecided",
});

const approveFood = {
  bucket: "Food",
  confidence: 0.92,
  verdict: "approve",
  reason: "Looks like lunch, so it comes out of Food.",
};

describe("runAiGuard", () => {
  it("passes a decided rule outcome through unchanged without calling the model", async () => {
    const ruleOutcome: RuleDecision = {
      decision: "REJECTED",
      reasonCode: "blocked_category",
      reason: "Bars are blocked on this card.",
      decidedBy: "Rule",
    };
    const callModel = stub(approveFood);

    const result = await runAiGuard({ ...input(), ruleOutcome }, { callModel });

    expect(result).toBe(ruleOutcome);
    expect(callModel).not.toHaveBeenCalled();
  });

  it("approves within the policy from the model's validated JSON", async () => {
    const callModel = stub(approveFood);

    const result = await runAiGuard(input(), { callModel });

    expect(result).toMatchObject({
      decision: "APPROVED",
      reasonCode: "approved",
      reason: approveFood.reason,
      bucket: "Food",
      confidence: 0.92,
      decidedBy: "AI guard",
      fallback: false,
    });
    const request = callModel.mock.calls[0][0];
    expect(request.model).toMatch(/haiku/);
    expect(request.latencySensitive).toBe(true);
  });

  it("turns an AI approval that breaks a hard limit into PENDING", async () => {
    // $70 is over Food's $60 per-purchase limit.
    const result = await runAiGuard(input(7000), { callModel: stub(approveFood) });

    expect(result).toMatchObject({
      decision: "PENDING",
      reasonCode: "needs_approval",
      bucket: "Food",
      fallback: false,
    });
  });

  it("falls back to PENDING on malformed model output", async () => {
    const result = await runAiGuard(input(), { callModel: stub("approve, probably food") });

    expect(result).toMatchObject({
      decision: "PENDING",
      reasonCode: "needs_approval",
      reason: "Needs a parent's review.",
      bucket: null,
      confidence: null,
      decidedBy: "AI guard",
      fallback: true,
    });
  });
});
