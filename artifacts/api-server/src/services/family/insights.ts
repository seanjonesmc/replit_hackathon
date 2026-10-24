import { asc, eq, inArray } from "drizzle-orm";
import { db as defaultDb, type Database } from "@workspace/db";
import {
  authorizationsTable,
  contributionsTable,
  membersTable,
  policiesTable,
  type AuthorizationDecision,
  type AuthorizationStatus,
} from "@workspace/db/schema";
import type {
  BucketSummary,
  FundingInsights,
  InsightsBucketSpend,
  InsightsDay,
  InsightsDependentSpend,
  InsightsMerchant,
  SpendingInsights,
} from "@workspace/api-zod";
import { toLocalIso, zonedParts, zonedTimeToInstant } from "../decisions/clock";
import { FamilyServiceError } from "./errors";
import { getDemoFamily, getFamilyMember, orderDependents } from "./family";
import { getBuckets } from "./read-models";

/**
 * Spending insights: one set of KPI definitions shared by every screen.
 *
 * - A logical purchase is a swipe that nothing retried. A parent-approved
 *   original folds into its retry, so it counts once (as the retry), the same
 *   way the activity feed shows it.
 * - Spent: logical purchases the engine APPROVED, whether the money is still
 *   held or already settled. Hold-then-settle changes when money moves, not
 *   whether a purchase was approved, so these numbers hold either way.
 * - Stopped (declined): logical purchases the engine REJECTED, or that a
 *   parent turned down.
 * - Pending: waiting on a parent. Counts toward neither spent nor stopped,
 *   and is left out of the approval rate.
 * - Approval rate: approved / (approved + declined).
 * - Periods are whole days on the family's clock: `7d` is today plus the six
 *   days before, `30d` likewise; the previous period is the same length just
 *   before it. A purchase belongs to the day its (final) swipe happened.
 *
 * The compute functions are pure, so the math is tested over fixture rows.
 */

export const INSIGHTS_PERIODS = ["7d", "30d", "all"] as const;
export type InsightsPeriod = (typeof INSIGHTS_PERIODS)[number];

const PERIOD_DAYS: Record<InsightsPeriod, number | null> = { "7d": 7, "30d": 30, all: null };
const TOP_MERCHANTS = 5;
/** Safety cap on the all-time daily series. */
const MAX_DAYS = 3660;

export interface InsightPurchase {
  id: number;
  dependentMemberId: number;
  bucketId: number | null;
  merchantName: string;
  amountCents: number;
  decision: AuthorizationDecision;
  status: AuthorizationStatus;
  swipedAt: Date;
  previousAuthorizationId: number | null;
}

type Outcome = "approved" | "declined" | "pending";

function outcomeOf(p: InsightPurchase): Outcome {
  if (p.decision === "APPROVED") return "approved";
  if (p.decision === "REJECTED" || p.status === "parent_declined") return "declined";
  return "pending";
}

/** Drops every swipe that a later swipe retried, keeping the final one of each chain. */
export function logicalPurchases(purchases: readonly InsightPurchase[]): InsightPurchase[] {
  const retried = new Set(
    purchases.map((p) => p.previousAuthorizationId).filter((id): id is number => id !== null),
  );
  return purchases.filter((p) => !retried.has(p.id));
}

type InsightBucket = Pick<
  BucketSummary,
  "id" | "name" | "icon" | "fundedCents" | "spentCents" | "heldCents" | "availableCents"
>;

interface Dependent {
  id: number;
  displayName: string;
}

/** The family-clock calendar day of an instant, YYYY-MM-DD. */
export function localDay(instant: Date, timeZone: string): string {
  return toLocalIso(instant, timeZone).slice(0, 10);
}

/** Family-clock midnight `offsetDays` from the day `now` falls on. */
function localMidnight(now: Date, timeZone: string, offsetDays: number): Date {
  const today = zonedParts(now, timeZone);
  const day = new Date(Date.UTC(today.year, today.month - 1, today.day + offsetDays));
  return zonedTimeToInstant(
    {
      year: day.getUTCFullYear(),
      month: day.getUTCMonth() + 1,
      day: day.getUTCDate(),
      hour: 0,
      minute: 0,
      second: 0,
    },
    timeZone,
  );
}

/** Every calendar day from `first` to `last` (YYYY-MM-DD), inclusive. */
function daysBetween(first: string, last: string): string[] {
  const [y, m, d] = first.split("-").map(Number) as [number, number, number];
  const days: string[] = [];
  for (let i = 0; i < MAX_DAYS; i++) {
    const day = new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10);
    if (day > last) break;
    days.push(day);
  }
  return days;
}

const share = (part: number, whole: number) => (whole > 0 ? part / whole : 0);
const sumCents = (ps: readonly InsightPurchase[]) => ps.reduce((sum, p) => sum + p.amountCents, 0);

export interface SpendingInsightsInput {
  purchases: readonly InsightPurchase[];
  buckets: readonly InsightBucket[];
  /** Every dependent in the family, in display order (demo dependent first). */
  dependents: readonly Dependent[];
  period: InsightsPeriod;
  /** Only this dependent's purchases; null for everyone. */
  dependentId: number | null;
  now: Date;
  timeZone: string;
}

export function computeSpendingInsights(input: SpendingInsightsInput): SpendingInsights {
  const { period, dependentId, now, timeZone } = input;
  const days = PERIOD_DAYS[period];
  // Whole days: the period runs to the end of today on the family's clock.
  const end = localMidnight(now, timeZone, 1);
  const start = days === null ? null : localMidnight(now, timeZone, 1 - days);
  const previousStart = days === null ? null : localMidnight(now, timeZone, 1 - 2 * days);

  const inScope = logicalPurchases(input.purchases).filter(
    (p) => dependentId === null || p.dependentMemberId === dependentId,
  );
  const within = (p: InsightPurchase, from: Date | null, to: Date) =>
    (from === null || p.swipedAt >= from) && p.swipedAt < to;

  const current = inScope.filter((p) => within(p, start, end));
  const approved = current.filter((p) => outcomeOf(p) === "approved");
  const declined = current.filter((p) => outcomeOf(p) === "declined");
  const pendingCount = current.filter((p) => outcomeOf(p) === "pending").length;
  const spentCents = sumCents(approved);

  let previousPeriodSpentCents: number | null = null;
  if (start !== null && previousStart !== null) {
    const previous = inScope.filter((p) => within(p, previousStart, start) && outcomeOf(p) === "approved");
    previousPeriodSpentCents = previous.length > 0 ? sumCents(previous) : null;
  }

  // By bucket: every bucket in display order, plus approved purchases whose bucket is gone.
  const byBucket: InsightsBucketSpend[] = input.buckets.map((b) => {
    const mine = approved.filter((p) => p.bucketId === b.id);
    const cents = sumCents(mine);
    return {
      bucketId: b.id,
      bucketName: b.name,
      icon: b.icon,
      spentCents: cents,
      purchaseCount: mine.length,
      share: share(cents, spentCents),
    };
  });
  const known = new Set(input.buckets.map((b) => b.id));
  const orphaned = approved.filter((p) => p.bucketId === null || !known.has(p.bucketId));
  if (orphaned.length > 0) {
    const cents = sumCents(orphaned);
    byBucket.push({
      bucketId: null,
      bucketName: "No bucket",
      icon: null,
      spentCents: cents,
      purchaseCount: orphaned.length,
      share: share(cents, spentCents),
    });
  }

  const shown = input.dependents.filter((d) => dependentId === null || d.id === dependentId);
  const byDependent: InsightsDependentSpend[] = shown.map((d) => {
    const spent = approved.filter((p) => p.dependentMemberId === d.id);
    const stopped = declined.filter((p) => p.dependentMemberId === d.id);
    const cents = sumCents(spent);
    return {
      dependentId: d.id,
      dependentName: d.displayName,
      spentCents: cents,
      purchaseCount: spent.length,
      declinedCount: stopped.length,
      declinedCents: sumCents(stopped),
      share: share(cents, spentCents),
    };
  });

  // Daily series on the family's clock.
  const perDay = new Map<string, number>();
  for (const p of approved) {
    const day = localDay(p.swipedAt, timeZone);
    perDay.set(day, (perDay.get(day) ?? 0) + p.amountCents);
  }
  const today = localDay(now, timeZone);
  let firstDay: string | null = null;
  if (start !== null) firstDay = localDay(start, timeZone);
  else if (perDay.size > 0) firstDay = [...perDay.keys()].sort()[0]!;
  const daily: InsightsDay[] =
    firstDay === null ? [] : daysBetween(firstDay, today).map((date) => ({ date, spentCents: perDay.get(date) ?? 0 }));

  const merchants = new Map<string, InsightsMerchant>();
  for (const p of approved) {
    const m = merchants.get(p.merchantName) ?? { merchantName: p.merchantName, spentCents: 0, purchaseCount: 0 };
    m.spentCents += p.amountCents;
    m.purchaseCount += 1;
    merchants.set(p.merchantName, m);
  }
  const topMerchants = [...merchants.values()]
    .sort(
      (a, b) =>
        b.spentCents - a.spentCents || b.purchaseCount - a.purchaseCount || a.merchantName.localeCompare(b.merchantName),
    )
    .slice(0, TOP_MERCHANTS);

  const decidedCount = approved.length + declined.length;
  return {
    period,
    periodStart: start,
    periodEnd: now,
    timeZone,
    dependentId,
    dependents: input.dependents.map((d) => ({ id: d.id, displayName: d.displayName })),
    spentCents,
    previousPeriodSpentCents,
    purchaseCount: approved.length,
    averagePurchaseCents: approved.length > 0 ? Math.round(spentCents / approved.length) : null,
    decidedCount,
    approvalRate: decidedCount > 0 ? approved.length / decidedCount : null,
    declinedCount: declined.length,
    declinedCents: sumCents(declined),
    pendingCount,
    byBucket,
    byDependent,
    daily,
    topMerchants,
    bucketUsage: input.buckets.map((b) => ({
      bucketId: b.id,
      bucketName: b.name,
      icon: b.icon,
      fundedCents: b.fundedCents,
      spentCents: b.spentCents,
      heldCents: b.heldCents,
      availableCents: b.availableCents,
    })),
  };
}

export interface FundingInsightsInput {
  memberId: number;
  contributions: readonly { funderMemberId: number; bucketId: number; amountCents: number }[];
  buckets: readonly InsightBucket[];
}

/**
 * One funder's contributions by bucket. Buckets pool everyone's money, so
 * "spent from the buckets they fund" is the bucket's spending overall, never
 * a claim about which purchases their own dollars covered.
 */
export function computeFundingInsights(input: FundingInsightsInput): FundingInsights {
  const mine = input.contributions.filter((c) => c.funderMemberId === input.memberId);
  const contributedCents = mine.reduce((sum, c) => sum + c.amountCents, 0);
  const familyFundedCents = input.contributions.reduce((sum, c) => sum + c.amountCents, 0);
  const byBucket = input.buckets
    .map((b) => {
      const cents = mine.filter((c) => c.bucketId === b.id).reduce((sum, c) => sum + c.amountCents, 0);
      return {
        bucketId: b.id,
        bucketName: b.name,
        icon: b.icon,
        contributedCents: cents,
        share: share(cents, contributedCents),
        bucketFundedCents: b.fundedCents,
        bucketSpentCents: b.spentCents,
        bucketHeldCents: b.heldCents,
      };
    })
    .filter((b) => b.contributedCents > 0);
  return {
    memberId: input.memberId,
    contributedCents,
    familyFundedCents,
    shareOfFamilyFunding: familyFundedCents > 0 ? contributedCents / familyFundedCents : null,
    spentFromFundedBucketsCents: byBucket.reduce((sum, b) => sum + b.bucketSpentCents, 0),
    heldInFundedBucketsCents: byBucket.reduce((sum, b) => sum + b.bucketHeldCents, 0),
    byBucket,
  };
}

// ---- Database reads ----------------------------------------------------------

/** The family's spending insights for one period, optionally for one dependent. */
export async function getSpendingInsights(
  familyId: number,
  options: { period?: InsightsPeriod; dependentId?: number | null } = {},
  now: Date = new Date(),
  database: Database = defaultDb,
): Promise<SpendingInsights> {
  const members = await database
    .select()
    .from(membersTable)
    .where(eq(membersTable.familyId, familyId))
    .orderBy(asc(membersTable.id));
  const dependents = orderDependents(members);
  const dependentId = options.dependentId ?? null;
  if (dependentId !== null && !dependents.some((d) => d.id === dependentId)) {
    throw new FamilyServiceError("not_found", `There is no dependent with id ${dependentId}.`);
  }

  const [policy] = await database
    .select({ timeZone: policiesTable.timeZone })
    .from(policiesTable)
    .where(eq(policiesTable.familyId, familyId));
  if (!policy) throw new FamilyServiceError("not_found", "The family's spending policy hasn't been set up yet.");

  const purchases = await database
    .select({
      id: authorizationsTable.id,
      dependentMemberId: authorizationsTable.dependentMemberId,
      bucketId: authorizationsTable.bucketId,
      merchantName: authorizationsTable.merchantName,
      amountCents: authorizationsTable.amountCents,
      decision: authorizationsTable.decision,
      status: authorizationsTable.status,
      swipedAt: authorizationsTable.swipedAt,
      previousAuthorizationId: authorizationsTable.previousAuthorizationId,
    })
    .from(authorizationsTable)
    .where(eq(authorizationsTable.familyId, familyId));

  const buckets = await getBuckets(familyId, now, database);
  return computeSpendingInsights({
    purchases,
    buckets,
    dependents,
    period: options.period ?? "7d",
    dependentId,
    now,
    timeZone: policy.timeZone,
  });
}

/** One member's funding insights within the demo family. */
export async function getFundingInsights(
  memberId: number,
  now: Date = new Date(),
  database: Database = defaultDb,
): Promise<FundingInsights> {
  const family = await getDemoFamily(database);
  await getFamilyMember(memberId, database);
  const buckets = await getBuckets(family.id, now, database);
  const contributions =
    buckets.length === 0
      ? []
      : await database
          .select({
            funderMemberId: contributionsTable.funderMemberId,
            bucketId: contributionsTable.bucketId,
            amountCents: contributionsTable.amountCents,
          })
          .from(contributionsTable)
          .where(
            inArray(
              contributionsTable.bucketId,
              buckets.map((b) => b.id),
            ),
          );
  return computeFundingInsights({ memberId, contributions, buckets });
}
