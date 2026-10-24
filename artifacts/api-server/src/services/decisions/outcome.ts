import type { AuthorizationDecision, DecidedBy, ReasonCode } from "@workspace/db";
import { NEEDS_PARENT_REVIEW, type AiGuardResult, type RuleDecision } from "../ai";
import { formatCents } from "../family/errors";
import {
  cardInactiveReason,
  insufficientFundsReason,
  type RuleBucket,
  type RuleCard,
  type RuleResult,
} from "./rules";

/**
 * Pure steps around the rule engine: turning the AI guard's answer into a
 * decision, and re-checking a decision against the locked rows when it is
 * stored. No I/O, so both are unit-tested without a database.
 */

export interface SwipeDecision {
  decision: AuthorizationDecision;
  reasonCode: ReasonCode;
  reason: string;
  decidedBy: DecidedBy;
  aiConfidence: number | null;
  bucketId: number | null;
  /** The temporary pass an approval uses. */
  passId: number | null;
  decisionMs: number;
}

export function fromRules(rules: RuleResult): SwipeDecision {
  return {
    decision: rules.decision,
    reasonCode: rules.reasonCode,
    reason: rules.reason,
    decidedBy: "rule",
    aiConfidence: null,
    bucketId: rules.bucket?.id ?? null,
    passId: rules.passId,
    decisionMs: 0,
  };
}

export interface AiGuardSituation {
  amountCents: number;
  /** The family's buckets, for the guard's pick on an ambiguous swipe. */
  buckets: readonly RuleBucket[];
  /** The policy's optional family-wide approval threshold. */
  familyApprovalThresholdCents: number | null;
}

/**
 * Step 10: the AI guard's answer as the engine's decision. It can only be
 * APPROVED or PENDING; a missing or failed answer waits for a parent.
 *
 * The bucket stays deterministic: when step 4 mapped the category (a
 * suspicious-item swipe), that bucket pays and the guard's pick is ignored.
 * Only an ambiguous swipe takes the guard's bucket. Either way an approval
 * must still fit that bucket's per-purchase limit and approval thresholds,
 * or it waits for a parent. (Funds are re-checked when the swipe is stored.)
 */
export function applyAiGuardOutcome(
  rules: RuleResult,
  outcome: AiGuardResult | RuleDecision | null,
  situation: AiGuardSituation,
): SwipeDecision {
  const fromGuard = outcome?.decidedBy === "AI guard" ? outcome : null;
  const bucket =
    rules.bucket ??
    (fromGuard?.bucket
      ? (situation.buckets.find((b) => b.name === fromGuard.bucket) ?? null)
      : null);
  const pending = (reason: string): SwipeDecision => ({
    decision: "PENDING",
    reasonCode: "needs_approval",
    reason,
    decidedBy: "ai_guard",
    aiConfidence: fromGuard?.confidence ?? null,
    bucketId: bucket?.id ?? null,
    passId: null,
    decisionMs: 0,
  });

  if (!fromGuard) return pending(NEEDS_PARENT_REVIEW);
  if (fromGuard.decision === "PENDING") {
    return { ...pending(fromGuard.reason), reasonCode: fromGuard.reasonCode };
  }

  // An approval must pay from one of the family's buckets, within its limits.
  if (!bucket) return pending(NEEDS_PARENT_REVIEW);
  const amount = situation.amountCents;
  if (amount > bucket.perPurchaseLimitCents) {
    return pending(
      `That's over the ${formatCents(bucket.perPurchaseLimitCents)} per-purchase limit for ${bucket.name}, so a parent needs to OK it.`,
    );
  }
  if (amount > bucket.approvalThresholdCents) {
    return pending(
      `Purchases over ${formatCents(bucket.approvalThresholdCents)} from ${bucket.name} need a parent's OK.`,
    );
  }
  const familyThreshold = situation.familyApprovalThresholdCents;
  if (familyThreshold !== null && amount > familyThreshold) {
    return pending(`Purchases over ${formatCents(familyThreshold)} need a parent's OK.`);
  }

  return {
    decision: "APPROVED",
    reasonCode: "approved",
    reason: fromGuard.reason,
    decidedBy: "ai_guard",
    aiConfidence: fromGuard.confidence,
    bucketId: bucket.id,
    passId: null,
    decisionMs: 0,
  };
}

/** The rows `recordDecision` locked, as they are now. */
export interface CommitState {
  /** The card; null when the swipe named no card. */
  card: Pick<RuleCard, "status"> | null;
  /** The paying bucket, for an approval. */
  bucket: Pick<RuleBucket, "name" | "availableCents"> | null;
  amountCents: number;
}

/**
 * Re-checks a decision against the locked card and bucket just before it is
 * stored. The AI guard can take a second, so the card may have been frozen,
 * or another swipe may have drained the bucket, since the rules ran. Steps 1
 * and 5 then decide on the fresh rows. Rejections stand as they are.
 */
export function recheckAtCommit(
  decided: SwipeDecision,
  state: CommitState,
): SwipeDecision {
  if (decided.decision === "REJECTED") return decided;

  const byRule = (reasonCode: ReasonCode, reason: string, bucketId: number | null) => ({
    ...decided,
    decision: "REJECTED" as const,
    reasonCode,
    reason,
    decidedBy: "rule" as const,
    aiConfidence: null,
    bucketId,
    passId: null,
  });

  // 1. A card frozen meanwhile stops approvals and pending swipes alike.
  const inactive = cardInactiveReason(state.card);
  if (inactive) return byRule("card_inactive", inactive, null);

  if (decided.decision !== "APPROVED") return decided;

  // Never approve without a bucket to pay from.
  if (decided.bucketId === null) {
    return {
      ...decided,
      decision: "PENDING",
      reasonCode: "needs_approval",
      reason: NEEDS_PARENT_REVIEW,
      passId: null,
    };
  }

  // 5. Another swipe may have got there first.
  if (!state.bucket || state.bucket.availableCents < state.amountCents) {
    return byRule(
      "insufficient_funds",
      insufficientFundsReason(
        state.bucket?.name ?? "this bucket",
        state.bucket?.availableCents ?? 0,
      ),
      decided.bucketId,
    );
  }
  return decided;
}

/** The temporary pass was used by another swipe first: ask a parent again. */
export function passAlreadyUsed(decided: SwipeDecision): SwipeDecision {
  return {
    ...decided,
    decision: "PENDING",
    reasonCode: "needs_approval",
    reason: "That parent OK was already used, so ask a parent again.",
    passId: null,
  };
}
