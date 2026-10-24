import type { InsightsPeriod, SpendingInsights } from '@workspace/api-client-react';
import { chartColor, type BarDatum, type DonutSlice } from '@/components/trellis/charts';

/** The period filter's choices, in order. */
export const PERIODS: { id: InsightsPeriod; label: string; long: string }[] = [
  { id: '7d', label: '7 days', long: 'the last 7 days' },
  { id: '30d', label: '30 days', long: 'the last 30 days' },
  { id: 'all', label: 'All time', long: 'all time' },
];

export const periodLong = (period: InsightsPeriod) => PERIODS.find((p) => p.id === period)?.long ?? period;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
export const purchases = (n: number) => plural(n, 'purchase');

/** True when the period has no purchases at all (approved, declined or pending). */
export const hasNoPurchases = (i: SpendingInsights) => i.decidedCount + i.pendingCount === 0;

/**
 * Spending against the previous period, e.g. "Up 25%", "Down 10%". Null when
 * the previous period had no spending: nothing to compare with.
 */
export function changeVsPrevious(i: Pick<SpendingInsights, 'spentCents' | 'previousPeriodSpentCents'>): string | null {
  const prev = i.previousPeriodSpentCents;
  if (prev === null || prev <= 0) return null;
  const pct = Math.round(((i.spentCents - prev) / prev) * 100);
  if (pct > 0) return `Up ${pct}%`;
  if (pct < 0) return `Down ${-pct}%`;
  return 'No change';
}

/** Color slot per bucket id: buckets keep one color on every screen (display order). */
function bucketColors(i: SpendingInsights) {
  const order = new Map(i.bucketUsage.map((b, index) => [b.bucketId, index]));
  return (bucketId: number | null) => chartColor(bucketId === null ? i.bucketUsage.length : (order.get(bucketId) ?? i.bucketUsage.length));
}

/** The period's spending by bucket as donut slices. */
export function bucketSlices(i: SpendingInsights): DonutSlice[] {
  const color = bucketColors(i);
  return i.byBucket.map((b) => ({
    key: `bucket-${b.bucketId ?? 'none'}`,
    label: b.bucketName,
    valueCents: b.spentCents,
    color: color(b.bucketId),
    note: purchases(b.purchaseCount),
  }));
}

/** The period's spending by dependent as donut slices. */
export function dependentSlices(i: SpendingInsights): DonutSlice[] {
  return i.byDependent.map((d, index) => ({
    key: `dependent-${d.dependentId}`,
    label: d.dependentName,
    valueCents: d.spentCents,
    color: chartColor(index),
    note: `${purchases(d.purchaseCount)} · ${d.declinedCount} declined`,
  }));
}

/** A YYYY-MM-DD family-clock day, read as a calendar date (no zone shift). */
const asDate = (day: string) => new Date(`${day}T12:00:00Z`);

/** The daily series as bars: weekday labels for a week, dates for longer. */
export function dailyBars(i: SpendingInsights): BarDatum[] {
  const short = i.daily.length <= 7;
  return i.daily.map((d) => {
    const date = asDate(d.date);
    return {
      key: d.date,
      label: date.toLocaleDateString('en-US', short ? { weekday: 'short', timeZone: 'UTC' } : { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      longLabel: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' }),
      valueCents: d.spentCents,
    };
  });
}
