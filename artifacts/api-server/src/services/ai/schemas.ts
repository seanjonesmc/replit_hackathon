import { z } from "zod";

/**
 * Shared contracts for the AI service layer. All money is in whole cents.
 *
 * FamilyPolicy is the policy builder's output and the AI guard's input. It is
 * the only policy schema in the repo; reuse it rather than defining another.
 */

/** The only bucket names a policy may use. */
export const BUCKET_NAMES = [
  "Food",
  "School",
  "Social",
  "Transit",
  "Rent & Utilities",
  "Tuition",
] as const;
export const BucketName = z.enum(BUCKET_NAMES);
export type BucketName = z.infer<typeof BucketName>;

/**
 * Known merchant categories. Blocked categories must come from this list
 * (e.g. "casinos" maps to "gambling"). Includes the spec's category-to-bucket
 * lookup table plus the categories it blocks by default.
 */
export const MERCHANT_CATEGORIES = [
  "bar",
  "liquor",
  "gambling",
  "nightclub",
  "gaming",
  "grocery",
  "restaurant",
  "bookstore",
  "school supplies",
  "movies",
  "bowling",
  "concerts",
  "rideshare",
  "transit",
  "electronics",
] as const;
export const MerchantCategory = z.enum(MERCHANT_CATEGORIES);
export type MerchantCategory = z.infer<typeof MerchantCategory>;

const Cents = z.number().int().nonnegative();

/** 24-hour clock time, "HH:MM". */
const ClockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected HH:MM");

export const PolicyBucket = z.object({
  name: BucketName,
  budgetCents: Cents,
  /** Display only: describes the budget. It never creates recurring allowances. */
  period: z.enum(["week", "month"]).nullable(),
  perTxLimitCents: Cents.nullable(),
  approvalThresholdCents: Cents.nullable(),
});
export type PolicyBucket = z.infer<typeof PolicyBucket>;

/**
 * Purchases whose clock time falls inside a window need approval. A window
 * whose end is earlier than its start wraps past midnight (23:00–06:00).
 */
export const TimeWindow = z
  .object({ start: ClockTime, end: ClockTime })
  .refine((w) => w.start !== w.end, "A time window needs different start and end times");
export type TimeWindow = z.infer<typeof TimeWindow>;

const MerchantName = z.string().trim().min(1);

export const FamilyPolicy = z.object({
  buckets: z
    .array(PolicyBucket)
    .refine(
      (buckets) => new Set(buckets.map((b) => b.name)).size === buckets.length,
      "Each bucket may appear only once",
    ),
  blockedCategories: z.array(MerchantCategory),
  /** Family-wide "ask me before anything over $X". */
  approvalThresholdCents: Cents.nullable(),
  timeWindows: z.array(TimeWindow),
  blockedMerchants: z.array(MerchantName),
  allowedMerchants: z.array(MerchantName),
});
export type FamilyPolicy = z.infer<typeof FamilyPolicy>;

/** The fixed reason every AI failure falls back to. */
export const NEEDS_PARENT_REVIEW = "Needs a parent's review.";

// ---------------------------------------------------------------------------
// Policy builder
// ---------------------------------------------------------------------------

export const PolicyBuilderInput = z.object({
  /** The parent's rules in plain English. */
  text: z.string().trim().min(1).max(4000),
  dependentName: z.string().trim().min(1).optional(),
  /** When present, the model returns the complete updated policy. */
  currentPolicy: FamilyPolicy.optional(),
});
export type PolicyBuilderInput = z.infer<typeof PolicyBuilderInput>;

/** What the model must return (validated before use). */
export const PolicyBuilderModelOutput = z.object({
  policy: FamilyPolicy,
  /** Phrases the model couldn't map, shown to the parent. */
  notUnderstood: z.array(z.string()),
});
export type PolicyBuilderModelOutput = z.infer<typeof PolicyBuilderModelOutput>;

export type PolicyBuilderResult =
  | { status: "DRAFT"; policy: FamilyPolicy; notUnderstood: string[] }
  | { status: "PENDING"; reason: typeof NEEDS_PARENT_REVIEW; policy: null };

// ---------------------------------------------------------------------------
// AI guard
// ---------------------------------------------------------------------------

const Id = z.union([z.string().min(1), z.number().int()]);

/** The spec's swipe payload. `amount` is in cents. */
export const SwipePayload = z.object({
  cardId: Id,
  dependentId: Id,
  merchantId: Id,
  merchantName: z.string().trim().min(1),
  mcc: z.string().trim().min(1),
  /** Free text: the guard exists for categories the rules can't map. */
  merchantCategory: z.string().trim().min(1),
  items: z.array(z.string()),
  amount: z.number().int().positive(),
  location: z.string(),
  /**
   * ISO 8601. Time windows compare against the clock time written here, so
   * send the swipe's local time (with its offset).
   */
  timestamp: z.string().datetime({ offset: true, local: true }),
});
export type SwipePayload = z.infer<typeof SwipePayload>;

/** A decision the deterministic rule engine already made. */
export interface RuleDecision {
  decision: "APPROVED" | "REJECTED" | "PENDING";
  reasonCode: string;
  reason: string;
  decidedBy: "Rule";
}

/** Guard input other than `ruleOutcome`, validated before the model is called. */
export const AiGuardContext = z.object({
  payload: SwipePayload,
  policy: FamilyPolicy,
  /** Bucket name → amount still available in that bucket. */
  bucketAvailableCents: z.record(z.string(), Cents),
});
export type AiGuardContext = z.infer<typeof AiGuardContext>;

export type AiGuardInput<R extends RuleDecision = RuleDecision> = AiGuardContext & {
  /** The rule engine's decision, or "undecided" when no hard rule applied. */
  ruleOutcome: R | "undecided";
};

/** What the model must return (validated before use). */
export const AiGuardModelOutput = z.object({
  bucket: z.string().trim().min(1),
  confidence: z.number().min(0).max(1),
  verdict: z.enum(["approve", "flag"]),
  /** One short sentence a teenager would understand. */
  reason: z.string().trim().min(1).max(300),
});
export type AiGuardModelOutput = z.infer<typeof AiGuardModelOutput>;

/** The guard's own decisions: it can approve or escalate, never reject. */
export interface AiGuardResult {
  decision: "APPROVED" | "PENDING";
  reasonCode: "approved" | "needs_approval";
  reason: string;
  /** Only a bucket that exists in the policy; otherwise null. */
  bucket: BucketName | null;
  confidence: number | null;
  decidedBy: "AI guard";
  /** True when the model failed, timed out or returned invalid output. */
  fallback: boolean;
  latencyMs: number;
}
