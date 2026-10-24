import { performance } from "node:perf_hooks";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import {
  authorizationsTable,
  bucketsTable,
  cardsTable,
  db,
  merchantsTable,
  temporaryPassesTable,
  type Authorization,
  type AuthorizationDecision,
  type AuthorizationStatus,
  type Card,
  type DbExecutor,
  type Merchant,
  type TemporaryPass,
} from "@workspace/db";
import { logger } from "../../lib/logger";
import {
  runAiGuard,
  type AiGuardInput,
  type AiGuardResult,
  type RuleDecision,
} from "../ai";
import { FamilyServiceError, getFamilyMember } from "../family";
import { getFamilyPolicy, type FamilyPolicySettings } from "../policies";
import { handOffToChain } from "./chain-handoff";
import { parseSwipeTime, type SwipeTime } from "./clock";
import {
  applyAiGuardOutcome,
  fromRules,
  passAlreadyUsed,
  recheckAtCommit,
  type SwipeDecision,
} from "./outcome";
import { evaluateRules, type RuleResult } from "./rules";

export type { SwipeDecision } from "./outcome";

/** The spec's swipe payload. `amount` is in cents. */
export interface SwipeInput {
  cardId: number;
  dependentId: number;
  /** A seeded merchant; null or omitted for a custom swipe. */
  merchantId?: number | null;
  merchantName: string;
  mcc: string;
  merchantCategory: string;
  items: string[];
  amount: number;
  location: string;
  timestamp: string;
}

/** The AI guard as the engine calls it (`runAiGuard` by default). */
export type AiGuardFn = (
  input: AiGuardInput,
) => Promise<AiGuardResult | RuleDecision>;

export interface SwipeOptions {
  /** The guard for step 10; null runs without one. Defaults to `runAiGuard`. */
  aiGuard?: AiGuardFn | null;
}

/** Everything the rules need, loaded in one pass before any decision. */
export interface SwipeContext {
  familyId: number;
  dependentId: number;
  /** Null when the card doesn't exist for this dependent. */
  card: Card | null;
  merchant: Merchant | null;
  /** What was bought. For seeded merchants, the stored name, MCC and category. */
  snapshot: {
    merchantName: string;
    mcc: string;
    merchantCategory: string;
    items: string[];
    amountCents: number;
    location: string;
  };
  swipeTime: SwipeTime;
  settings: FamilyPolicySettings;
  passes: TemporaryPass[];
  now: Date;
}

export interface SwipeOutcome {
  authorization: Authorization;
  bucketName: string | null;
}

const STATUS_BY_DECISION: Record<AuthorizationDecision, AuthorizationStatus> = {
  APPROVED: "approved",
  REJECTED: "rejected",
  PENDING: "pending",
};

/** Loads every rule input up front. Throws for an unknown dependent or merchant. */
export async function loadSwipeContext(
  input: SwipeInput,
  executor: DbExecutor = db,
  now: Date = new Date(),
): Promise<SwipeContext> {
  const merchantId = input.merchantId ?? null;
  // Sequential, not Promise.all: the seed runs this inside a transaction,
  // which is one connection.
  const settings = await getFamilyPolicy(executor);
  const dependent = await getFamilyMember(input.dependentId, executor);
  const [card] = await executor
    .select()
    .from(cardsTable)
    .where(
      and(
        eq(cardsTable.id, input.cardId),
        eq(cardsTable.dependentMemberId, input.dependentId),
      ),
    );
  const [merchant] =
    merchantId === null
      ? []
      : await executor
          .select()
          .from(merchantsTable)
          .where(eq(merchantsTable.id, merchantId));
  const passes = await executor
    .select()
    .from(temporaryPassesTable)
    .where(
      and(
        eq(temporaryPassesTable.cardId, input.cardId),
        isNull(temporaryPassesTable.usedAt),
        gt(temporaryPassesTable.expiresAt, now),
      ),
    );

  if (merchantId !== null && !merchant) {
    throw new FamilyServiceError(
      "not_found",
      `There is no merchant with id ${merchantId}.`,
    );
  }
  const swipeTime = parseSwipeTime(input.timestamp, settings.timeZone);
  if (!swipeTime) {
    throw new FamilyServiceError(
      "invalid",
      "timestamp: expected an ISO 8601 date and time, e.g. 2026-10-24T14:30:00-07:00.",
    );
  }

  return {
    familyId: settings.familyId,
    dependentId: dependent.id,
    card: card ?? null,
    merchant: merchant ?? null,
    snapshot: {
      merchantName: merchant?.name ?? input.merchantName.trim(),
      mcc: merchant?.mcc ?? input.mcc,
      merchantCategory: merchant?.category ?? input.merchantCategory.trim(),
      items: input.items,
      amountCents: input.amount,
      location: input.location,
    },
    swipeTime,
    settings,
    passes,
    now,
  };
}

/**
 * Step 10's AI guard slot. Called with "undecided" (no hard rule decided);
 * its result is final and can only be APPROVED or PENDING. Any error waits
 * for a parent. `applyAiGuardOutcome` keeps a mapped category's bucket.
 */
async function askAiGuard(
  aiGuard: AiGuardFn,
  ctx: SwipeContext,
  rules: RuleResult,
): Promise<SwipeDecision> {
  let outcome: AiGuardResult | RuleDecision | null;
  try {
    outcome = await aiGuard({
      payload: {
        cardId: ctx.card?.id ?? 0,
        dependentId: ctx.dependentId,
        merchantId: ctx.merchant?.id ?? "custom",
        merchantName: ctx.snapshot.merchantName,
        mcc: ctx.snapshot.mcc,
        merchantCategory: ctx.snapshot.merchantCategory,
        items: ctx.snapshot.items,
        amount: ctx.snapshot.amountCents,
        location: ctx.snapshot.location,
        // Family-local time, so the guard reads the same clock as the rules.
        timestamp: ctx.swipeTime.localIso,
      },
      policy: ctx.settings.policy,
      bucketAvailableCents: Object.fromEntries(
        ctx.settings.buckets.map((b) => [b.name, b.availableCents]),
      ),
      ruleOutcome: "undecided",
    });
  } catch (err) {
    logger.warn({ err }, "AI guard failed; the swipe waits for a parent");
    outcome = null;
  }
  return applyAiGuardOutcome(rules, outcome, {
    amountCents: ctx.snapshot.amountCents,
    buckets: ctx.settings.buckets,
    familyApprovalThresholdCents: ctx.settings.policy.approvalThresholdCents,
  });
}

/** Runs the rules, then the AI guard if they send the swipe there. Timed. */
export async function decideSwipe(
  ctx: SwipeContext,
  aiGuard: AiGuardFn | null,
): Promise<SwipeDecision> {
  const startedAt = performance.now();
  const rules = evaluateRules({
    card: ctx.card && { id: ctx.card.id, status: ctx.card.status },
    swipe: {
      merchantId: ctx.merchant?.id ?? null,
      merchantName: ctx.snapshot.merchantName,
      merchantCategory: ctx.snapshot.merchantCategory,
      items: ctx.snapshot.items,
      amountCents: ctx.snapshot.amountCents,
      localMinutes: ctx.swipeTime.localMinutes,
    },
    policy: ctx.settings.policy,
    buckets: ctx.settings.buckets,
    passes: ctx.passes,
    now: ctx.now,
  });

  const decided =
    rules.sendToAiGuard && aiGuard
      ? await askAiGuard(aiGuard, ctx, rules)
      : fromRules(rules);
  const elapsed = performance.now() - startedAt;
  return { ...decided, decisionMs: Math.round(elapsed * 1000) / 1000 };
}

/**
 * Stores the authorization and, for an approval, moves the money in one
 * transaction. The card row is locked first, so a freeze and a swipe never
 * overlap: a card frozen while the AI guard was thinking rejects the swipe
 * here. Then the paying bucket is locked and its balance re-checked, so two
 * quick swipes can't overspend it. The amount goes available → held (the
 * authorization hold) → spent (settled), and any temporary pass is used up.
 * Rejected and pending swipes move no money.
 */
export async function recordDecision(
  ctx: SwipeContext,
  decided: SwipeDecision,
  options: { at?: Date; previousAuthorizationId?: number | null } = {},
  executor: DbExecutor = db,
): Promise<Authorization> {
  const at = options.at ?? new Date();
  const amount = ctx.snapshot.amountCents;

  return executor.transaction(async (tx) => {
    // Lock order: card, then bucket (freezing locks only the card).
    const [card] =
      ctx.card && decided.decision !== "REJECTED"
        ? await tx
            .select({ status: cardsTable.status })
            .from(cardsTable)
            .where(eq(cardsTable.id, ctx.card.id))
            .for("update")
        : [];
    const [bucket] =
      decided.decision === "APPROVED" && decided.bucketId !== null
        ? await tx
            .select({
              name: bucketsTable.name,
              availableCents: bucketsTable.availableCents,
            })
            .from(bucketsTable)
            .where(eq(bucketsTable.id, decided.bucketId))
            .for("update")
        : [];

    let final = recheckAtCommit(decided, {
      card: card ?? null,
      bucket: bucket ?? null,
      amountCents: amount,
    });

    if (final.decision === "APPROVED" && final.passId !== null) {
      const claimed = await tx
        .update(temporaryPassesTable)
        .set({ usedAt: at })
        .where(
          and(
            eq(temporaryPassesTable.id, final.passId),
            isNull(temporaryPassesTable.usedAt),
            gt(temporaryPassesTable.expiresAt, at),
          ),
        )
        .returning({ id: temporaryPassesTable.id });
      if (claimed.length === 0) final = passAlreadyUsed(final);
    }

    const approved = final.decision === "APPROVED";
    const [authorization] = await tx
      .insert(authorizationsTable)
      .values({
        familyId: ctx.familyId,
        cardId: ctx.card?.id ?? null,
        dependentMemberId: ctx.dependentId,
        merchantId: ctx.merchant?.id ?? null,
        merchantName: ctx.snapshot.merchantName,
        mcc: ctx.snapshot.mcc,
        merchantCategory: ctx.snapshot.merchantCategory,
        items: ctx.snapshot.items,
        amountCents: amount,
        location: ctx.snapshot.location,
        swipedAt: ctx.swipeTime.instant,
        bucketId: final.bucketId,
        decision: final.decision,
        status: STATUS_BY_DECISION[final.decision],
        reasonCode: final.reasonCode,
        reason: final.reason,
        decidedBy: final.decidedBy,
        aiConfidence: final.aiConfidence,
        decisionMs: final.decisionMs,
        previousAuthorizationId: options.previousAuthorizationId ?? null,
        settledAt: approved ? at : null,
        createdAt: at,
      })
      .returning();

    if (approved && final.bucketId !== null) {
      // Authorization hold: available → held.
      await tx
        .update(bucketsTable)
        .set({
          availableCents: sql`${bucketsTable.availableCents} - ${amount}`,
          heldCents: sql`${bucketsTable.heldCents} + ${amount}`,
        })
        .where(eq(bucketsTable.id, final.bucketId));
      // Settlement (capture): held → spent.
      await tx
        .update(bucketsTable)
        .set({
          heldCents: sql`${bucketsTable.heldCents} - ${amount}`,
          spentCents: sql`${bucketsTable.spentCents} + ${amount}`,
        })
        .where(eq(bucketsTable.id, final.bucketId));
    }

    return authorization!;
  });
}

/**
 * The decision engine for one swipe: load all inputs, decide (rules, then the
 * AI guard slot), store, then hand off to the chain without waiting.
 */
export async function processSwipe(
  input: SwipeInput,
  options: SwipeOptions = {},
): Promise<SwipeOutcome> {
  const aiGuard = options.aiGuard === undefined ? runAiGuard : options.aiGuard;
  const ctx = await loadSwipeContext(input);
  const decided = await decideSwipe(ctx, aiGuard);
  const authorization = await recordDecision(ctx, decided);

  handOffToChain(authorization).catch((err: unknown) => {
    logger.error(
      { err, authorizationId: authorization.id },
      "Chain hand-off failed",
    );
  });

  const bucketName =
    ctx.settings.buckets.find((b) => b.id === authorization.bucketId)?.name ??
    null;
  return { authorization, bucketName };
}
