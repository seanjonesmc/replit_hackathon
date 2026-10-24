import { describe, expect, it, vi } from "vitest";
import { buildPolicyFromText, type ModelCaller } from "./index";

// The model is always stubbed: these tests make no network calls.
const stub = (reply: string) => vi.fn<ModelCaller>(async () => reply);

const SAMPLE_RULES =
  "Sam gets $100 a week for food, nothing at bars or casinos, no gaming, and ask me before anything over $75.";

const SAMPLE_REPLY = {
  policy: {
    buckets: [
      {
        name: "Food",
        budgetCents: 10000,
        period: "week",
        perTxLimitCents: null,
        approvalThresholdCents: null,
      },
    ],
    blockedCategories: ["bar", "gambling", "gaming"],
    approvalThresholdCents: 7500,
    timeWindows: [],
    blockedMerchants: [],
    allowedMerchants: [],
  },
  notUnderstood: [],
};

describe("buildPolicyFromText", () => {
  it("returns a validated DRAFT policy from the model's JSON", async () => {
    const callModel = stub("```json\n" + JSON.stringify(SAMPLE_REPLY) + "\n```");

    const result = await buildPolicyFromText(
      { text: SAMPLE_RULES, dependentName: "Sam" },
      { callModel },
    );

    expect(result).toEqual({
      status: "DRAFT",
      policy: SAMPLE_REPLY.policy,
      notUnderstood: [],
    });
    expect(callModel).toHaveBeenCalledOnce();
    const request = callModel.mock.calls[0][0];
    expect(request.model).toMatch(/sonnet/);
    expect(request.user).toContain(SAMPLE_RULES);
  });

  it.each([
    ["no JSON at all", "Sure! Food gets $100 a week."],
    ["JSON that breaks the schema", JSON.stringify({ policy: { buckets: [{ name: "Fun" }] } })],
  ])("returns PENDING when the model replies with %s", async (_label, reply) => {
    const result = await buildPolicyFromText({ text: SAMPLE_RULES }, { callModel: stub(reply) });

    expect(result).toEqual({
      status: "PENDING",
      reason: "Needs a parent's review.",
      policy: null,
    });
  });

  it("returns PENDING instead of throwing when the model call fails", async () => {
    const callModel = vi.fn<ModelCaller>(async () => {
      throw new Error("upstream unavailable");
    });

    const result = await buildPolicyFromText({ text: SAMPLE_RULES }, { callModel });

    expect(result).toMatchObject({ status: "PENDING", reason: "Needs a parent's review." });
  });
});
