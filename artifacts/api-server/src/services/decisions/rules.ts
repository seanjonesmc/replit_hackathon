import type { CardStatus, ReasonCode } from "@workspace/db";
import { NEEDS_PARENT_REVIEW, type BucketName } from "../ai";
import { formatCents } from "../family/errors";
import { clockToMinutes, formatClock } from "./clock";

/**
 * The deterministic rule engine: one pure, ordered function over pre-loaded
 * inputs. The first rule that matches decides and evaluation stops there, so
 * a swipe fails fast. No I/O, no clock reads: the same inputs always give the
 * same result.
 *
 * The AI guard is not called here. When a swipe belongs to it (step 10), the
 * result says so in `sendToAiGuard` and carries the decision to use when no
 * guard is available.
 */

export type Decision = "APPROVED" | "REJECTED" | "PENDING";

export interface RuleCard {
  id: number;
  status: CardStatus;
}

export interface RuleBucket {
  id: number;
  name: string;
  availableCents: number;
  perPurchaseLimitCents: number;
  approvalThresholdCents: number;
}

export interface RulePass {
  id: number;
  cardId: number;
  merchantId: number;
  maxAmountCents: number;
  expiresAt: Date;
  usedAt: Date | null;
}

export interface RulePolicy {
  blockedCategories: string[];
  blockedMerchants: string[];
  allowedMerchants: string[];
  timeWindows: { start: string; end: string }[];
  /** Optional family-wide approval threshold. */
  approvalThresholdCents: number | null;
}

export interface RuleSwipe {
  /** A seeded merchant's id; null for a custom swipe. */
  merchantId: number | null;
  merchantName: string;
  merchantCategory: string;
  items: string[];
  amountCents: number;
  /** Minutes since midnight on the family's clock. */
  localMinutes: number;
}

export interface RuleInputs {
  /** Null when the swipe names a card that doesn't exist for this dependent. */
  card: RuleCard | null;
  swipe: RuleSwipe;
  policy: RulePolicy;
  /** The family's buckets. */
  buckets: RuleBucket[];
  /** Temporary passes for this card (used or not). */
  passes: RulePass[];
  /** Server time, for pass expiry. */
  now: Date;
}

export type AiGuardReason = "ambiguous" | "suspicious";

export interface RuleResult {
  decision: Decision;
  reasonCode: ReasonCode;
  /** One short sentence a teenager would understand. */
  reason: string;
  /** The bucket the money would come from; null when none was resolved. */
  bucket: RuleBucket | null;
  /** The temporary pass an approval relies on (step 7). */
  passId: number | null;
  /**
   * Set when the AI guard should decide (step 10). The decision above is then
   * the one to use when no guard is available.
   */
  sendToAiGuard: AiGuardReason | null;
}

/** Step 4's lookup table: merchant category → bucket name. */
export const CATEGORY_BUCKETS: Readonly<Record<string, BucketName>> = {
  grocery: "Food",
  restaurant: "Food",
  bookstore: "School",
  "school supplies": "School",
  electronics: "School",
  movies: "Social",
  bowling: "Social",
  concerts: "Social",
  rideshare: "Transit",
  transit: "Transit",
};

/**
 * Step 10's short list of item words that hint at a blocked category
 * (alcohol, gambling, gaming currency). Matched as whole words, any case.
 */
export const SUSPICIOUS_ITEM_KEYWORDS: readonly string[] = [
  "beer",
  "wine",
  "vodka",
  "whiskey",
  "tequila",
  "rum",
  "liquor",
  "lottery",
  "scratch-off",
  "casino chips",
  "poker chips",
  "sports bet",
  "v-bucks",
];

const SUSPICIOUS_ITEM = new RegExp(
  `\\b(?:${SUSPICIOUS_ITEM_KEYWORDS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})s?\\b`,
  "i",
);

/** How a blocked category reads in "This card can't be used for …". */
const CATEGORY_PHRASES: Readonly<Record<string, string>> = {
  bar: "bars",
  liquor: "liquor stores",
  gambling: "gambling",
  nightclub: "nightclubs",
  gaming: "gaming",
};

const normalize = (value: string) => value.trim().toLowerCase();

/** Step 5's reason, also used when a concurrent swipe drained the bucket first. */
export function insufficientFundsReason(bucketName: string, availableCents: number): string {
  return `Not enough left in ${bucketName}: ${formatCents(availableCents)} remaining.`;
}

/**
 * Step 1's check: why this card can't pay, or null when it is active. Also
 * used when the swipe is stored, in case the card was frozen meanwhile.
 */
const CARD_MISSING_REASON = "This card isn't set up, so it can't be used.";

export function cardInactiveReason(card: Pick<RuleCard, "status"> | null): string | null {
  if (!card) return CARD_MISSING_REASON;
  if (card.status === "frozen") return "Your card is frozen, so purchases are paused.";
  if (card.status !== "active") return "Your card hasn't been activated yet.";
  return null;
}

export function hasSuspiciousItem(items: readonly string[]): boolean {
  return items.some((item) => SUSPICIOUS_ITEM.test(item));
}

/** The window a family-clock time falls in; an end before the start wraps past midnight. */
export function findTimeWindow(
  localMinutes: number,
  windows: RulePolicy["timeWindows"],
): RulePolicy["timeWindows"][number] | null {
  return (
    windows.find((w) => {
      const start = clockToMinutes(w.start);
      const end = clockToMinutes(w.end);
      return start < end
        ? localMinutes >= start && localMinutes < end
        : localMinutes >= start || localMinutes < end;
    }) ?? null
  );
}

export function evaluateRules(input: RuleInputs): RuleResult {
  const { card, swipe, policy, buckets, passes, now } = input;
  const amount = swipe.amountCents;
  const result = (
    decision: Decision,
    reasonCode: ReasonCode,
    reason: string,
    bucket: RuleBucket | null = null,
    extra: Partial<Pick<RuleResult, "passId" | "sendToAiGuard">> = {},
  ): RuleResult => ({
    decision,
    reasonCode,
    reason,
    bucket,
    passId: extra.passId ?? null,
    sendToAiGuard: extra.sendToAiGuard ?? null,
  });

  // 1. Card: it must exist for this dependent and be active, not frozen.
  const inactive = cardInactiveReason(card);
  if (inactive || !card) {
    return result("REJECTED", "card_inactive", inactive ?? CARD_MISSING_REASON);
  }

  // 2. Blocked categories (e.g. bar, liquor, gambling, nightclub, gaming).
  const category = normalize(swipe.merchantCategory);
  if (policy.blockedCategories.some((c) => normalize(c) === category)) {
    const phrase = CATEGORY_PHRASES[category] ?? category;
    return result("REJECTED", "blocked_category", `This card can't be used for ${phrase}.`);
  }

  // 3. Merchant lists: blocked merchants are rejected; allowed merchants
  //    carry on but are never sent to the AI guard (step 10).
  const merchant = normalize(swipe.merchantName);
  if (policy.blockedMerchants.some((m) => normalize(m) === merchant)) {
    return result("REJECTED", "blocked_category", `Your card is blocked at ${swipe.merchantName.trim()}.`);
  }
  const allowedMerchant = policy.allowedMerchants.some((m) => normalize(m) === merchant);

  // 4. Category → bucket. No match, or no such bucket in this family, makes
  //    the swipe ambiguous: steps 5, 6, 7 and 9 need a bucket and are skipped.
  const bucketName = CATEGORY_BUCKETS[category];
  const bucket = bucketName ? (buckets.find((b) => b.name === bucketName) ?? null) : null;

  if (bucket) {
    // 5. Enough money left in the bucket.
    if (amount > bucket.availableCents) {
      return result(
        "REJECTED",
        "insufficient_funds",
        insufficientFundsReason(bucket.name, bucket.availableCents),
        bucket,
      );
    }

    // 6. Per-purchase limit.
    if (amount > bucket.perPurchaseLimitCents) {
      return result(
        "REJECTED",
        "over_limit",
        `That's over the ${formatCents(bucket.perPurchaseLimitCents)} per-purchase limit for ${bucket.name}.`,
        bucket,
      );
    }

    // 7. An unused, unexpired temporary pass for this card and merchant that
    //    covers the amount approves it (it skips the time and threshold checks).
    const pass = passes.find(
      (p) =>
        swipe.merchantId !== null &&
        p.cardId === card.id &&
        p.merchantId === swipe.merchantId &&
        p.usedAt === null &&
        p.expiresAt.getTime() > now.getTime() &&
        amount <= p.maxAmountCents,
    );
    if (pass) {
      return result(
        "APPROVED",
        "approved",
        `A parent OK'd this, so it's paid from ${bucket.name}.`,
        bucket,
        { passId: pass.id },
      );
    }
  }

  // 8. Time windows, on the family's clock (e.g. 11pm–6am needs a parent's OK).
  const window = findTimeWindow(swipe.localMinutes, policy.timeWindows);
  if (window) {
    return result(
      "PENDING",
      "outside_hours",
      `Purchases between ${formatClock(window.start)} and ${formatClock(window.end)} need a parent's OK.`,
      bucket,
    );
  }

  if (bucket) {
    // 9. Approval thresholds: the bucket's, then the family-wide one.
    if (amount > bucket.approvalThresholdCents) {
      return result(
        "PENDING",
        "needs_approval",
        `Purchases over ${formatCents(bucket.approvalThresholdCents)} from ${bucket.name} need a parent's OK.`,
        bucket,
      );
    }
    if (policy.approvalThresholdCents !== null && amount > policy.approvalThresholdCents) {
      return result(
        "PENDING",
        "needs_approval",
        `Purchases over ${formatCents(policy.approvalThresholdCents)} need a parent's OK.`,
        bucket,
      );
    }
  }

  // 10. AI guard slot. An ambiguous swipe goes to the guard (unless the
  //     merchant is allowed); without a guard it waits for a parent.
  if (!bucket) {
    return result("PENDING", "needs_approval", NEEDS_PARENT_REVIEW, null, {
      sendToAiGuard: allowedMerchant ? null : "ambiguous",
    });
  }

  // 11. Everything else is approved. Suspicious items at a merchant that isn't
  //     allowed go to the guard first; without one, this approval stands.
  return result("APPROVED", "approved", `Approved and paid from ${bucket.name}.`, bucket, {
    sendToAiGuard: !allowedMerchant && hasSuspiciousItem(swipe.items) ? "suspicious" : null,
  });
}
