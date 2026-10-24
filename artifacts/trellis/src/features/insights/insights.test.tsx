// @vitest-environment happy-dom
import { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import type { FundingInsights, SpendingInsights } from '@workspace/api-client-react';
import { byTestId, cleanupApi, mockApi, renderWithApi, settle, type ApiCall } from '@/test/api-test-utils';
import { FundingBreakdown } from './FundingBreakdown';
import ParentInsights from './ParentInsights';
import { SpendingCard } from './SpendingCard';
import { WeekSpendCard } from './WeekSpendCard';
import { changeVsPrevious, dailyBars } from './insights-format';

/*
 * Recharts draws nothing in happy-dom (no layout size), so these tests read
 * the text every chart carries: legends, tiles and the empty states.
 */

const usage = [
  { bucketId: 1, bucketName: 'Food', icon: 'food' as const, fundedCents: 200_00, spentCents: 40_00, heldCents: 12_50, availableCents: 147_50 },
  { bucketId: 2, bucketName: 'School', icon: 'school' as const, fundedCents: 100_00, spentCents: 0, heldCents: 0, availableCents: 100_00 },
];

const kids = [
  { id: 11, displayName: 'Kid A' },
  { id: 12, displayName: 'Kid B' },
];

function insights(overrides: Partial<SpendingInsights> = {}): SpendingInsights {
  return {
    period: '7d',
    periodStart: '2026-10-18T07:00:00.000Z',
    periodEnd: '2026-10-25T07:00:00.000Z',
    timeZone: 'America/Los_Angeles',
    dependentId: null,
    dependents: kids,
    spentCents: 30_00,
    previousPeriodSpentCents: null,
    purchaseCount: 3,
    averagePurchaseCents: 10_00,
    decidedCount: 4,
    approvalRate: 0.75,
    declinedCount: 1,
    declinedCents: 15_00,
    pendingCount: 0,
    byBucket: [
      { bucketId: 1, bucketName: 'Food', icon: 'food', spentCents: 22_50, purchaseCount: 2, share: 0.75 },
      { bucketId: 2, bucketName: 'School', icon: 'school', spentCents: 0, purchaseCount: 0, share: 0 },
      { bucketId: 3, bucketName: 'Social', icon: 'social', spentCents: 7_50, purchaseCount: 1, share: 0.25 },
    ],
    byDependent: [
      { dependentId: 11, dependentName: 'Kid A', spentCents: 20_00, purchaseCount: 2, declinedCount: 0, declinedCents: 0, share: 2 / 3 },
      { dependentId: 12, dependentName: 'Kid B', spentCents: 10_00, purchaseCount: 1, declinedCount: 1, declinedCents: 15_00, share: 1 / 3 },
    ],
    daily: ['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24'].map((date, i) => ({
      date,
      spentCents: i === 6 ? 30_00 : 0,
    })),
    topMerchants: [
      { merchantName: 'Corner Grocer', spentCents: 22_50, purchaseCount: 2 },
      { merchantName: 'Cinema Example', spentCents: 7_50, purchaseCount: 1 },
    ],
    bucketUsage: usage,
    ...overrides,
  };
}

const empty = (overrides: Partial<SpendingInsights> = {}) =>
  insights({
    spentCents: 0,
    purchaseCount: 0,
    averagePurchaseCents: null,
    decidedCount: 0,
    approvalRate: null,
    declinedCount: 0,
    declinedCents: 0,
    byBucket: insights().byBucket.map((b) => ({ ...b, spentCents: 0, purchaseCount: 0, share: 0 })),
    byDependent: insights().byDependent.map((d) => ({ ...d, spentCents: 0, purchaseCount: 0, declinedCount: 0, declinedCents: 0, share: 0 })),
    daily: [],
    topMerchants: [],
    ...overrides,
  });

const text = (id: string) => byTestId(id)?.textContent ?? '';
const params = (call: ApiCall) => Object.fromEntries(new URLSearchParams(call.search));
const insightCalls = (calls: ApiCall[]) => calls.filter((c) => c.path === '/api/family/insights');

afterEach(() => cleanupApi());

describe('parent home spending card', () => {
  it('shows the last 7 days by bucket with dollars and shares as text, skipping empty buckets', async () => {
    const calls = mockApi({ 'GET /api/family/insights': { body: insights() } });
    renderWithApi(<SpendingCard />);
    await settle();

    expect(params(insightCalls(calls)[0]!)).toEqual({ period: '7d' });
    expect(text('legend-bucket-1')).toContain('Food');
    expect(text('legend-bucket-1')).toContain('$22.50');
    expect(text('legend-bucket-1')).toContain('75%');
    expect(text('legend-bucket-3')).toContain('25%');
    expect(byTestId('legend-bucket-2')).toBeNull();
    expect(text('chart-spending-by-bucket')).toContain('$30');
    expect(byTestId('link-insights')?.getAttribute('href')).toBe('/parent/insights');
  });

  it('says "No spending yet" instead of a chart of zeros', async () => {
    mockApi({ 'GET /api/family/insights': { body: empty() } });
    renderWithApi(<SpendingCard />);
    await settle();

    expect(text('state-no-spending')).toContain('No spending yet');
    expect(byTestId('chart-spending-by-bucket')).toBeNull();
  });

  it('shows an error with a retry when the read fails', async () => {
    mockApi({ 'GET /api/family/insights': { status: 500, body: { error: 'boom' } } });
    renderWithApi(<SpendingCard />);
    await settle();

    expect(byTestId('state-error')).not.toBeNull();
    expect(byTestId('button-retry')).not.toBeNull();
  });
});

describe('parent insights screen', () => {
  it('hides the child filter for a one-child family and refetches when the period changes', async () => {
    const calls = mockApi({
      'GET /api/family/insights': (call) => ({
        body: insights({ period: (params(call).period as SpendingInsights['period']) ?? '7d', dependents: [kids[0]!], byDependent: [insights().byDependent[0]!] }),
      }),
    });
    renderWithApi(<ParentInsights />);
    await settle();

    expect(byTestId('filter-child')).toBeNull();
    expect(byTestId('section-by-child')).toBeNull();
    expect(byTestId('filter-period-7d')?.getAttribute('aria-pressed')).toBe('true');

    act(() => byTestId('filter-period-30d')!.click());
    await settle();
    expect(params(insightCalls(calls).at(-1)!)).toEqual({ period: '30d' });
    expect(byTestId('filter-period-30d')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('splits by child for the whole family and filters to one child', async () => {
    const calls = mockApi({
      'GET /api/family/insights': (call) => {
        const id = params(call).dependentId;
        if (!id) return { body: insights() };
        const kid = insights().byDependent.find((d) => d.dependentId === Number(id))!;
        return { body: insights({ dependentId: Number(id), byDependent: [kid], spentCents: kid.spentCents }) };
      },
    });
    renderWithApi(<ParentInsights />);
    await settle();

    expect(text('filter-child')).toContain('All children');
    expect(text('section-by-child')).toContain('Kid A');
    expect(text('legend-dependent-12')).toContain('1 purchase · 1 declined');

    act(() => byTestId('filter-child-12')!.click());
    await settle();
    expect(params(insightCalls(calls).at(-1)!)).toEqual({ period: '7d', dependentId: '12' });
    expect(byTestId('filter-child-12')?.getAttribute('aria-pressed')).toBe('true');
    expect(byTestId('section-by-child')).toBeNull();
  });

  it('shows the KPI tiles, and the change only when the previous period had spending', async () => {
    mockApi({ 'GET /api/family/insights': { body: insights() } });
    renderWithApi(<ParentInsights />);
    await settle();

    expect(text('kpi-total-spent')).toContain('$30.00');
    expect(text('kpi-purchases')).toContain('3');
    expect(text('kpi-average')).toContain('$10.00');
    expect(text('kpi-approval-rate')).toContain('75%');
    expect(text('kpi-stopped')).toContain('$15.00');
    expect(byTestId('kpi-change')).toBeNull();
    expect(text('list-top-merchants')).toContain('Corner Grocer');
    expect(text('row-bucket-usage-1')).toContain('$52.50 spent of $200.00 added · incl. $12.50 held');
    cleanupApi();

    mockApi({ 'GET /api/family/insights': { body: insights({ previousPeriodSpentCents: 20_00 }) } });
    renderWithApi(<ParentInsights />);
    await settle();
    expect(text('kpi-change')).toContain('Up 50%');
  });

  it('shows "No spending yet" for a period with no purchases, not zeroed tiles', async () => {
    mockApi({ 'GET /api/family/insights': { body: empty() } });
    renderWithApi(<ParentInsights />);
    await settle();

    expect(text('state-no-spending')).toContain('No spending yet');
    expect(byTestId('kpi-tiles')).toBeNull();
    expect(byTestId('section-bucket-usage')).not.toBeNull();
  });
});

describe('dependent "This week" card', () => {
  it('asks only for that dependent\'s last 7 days', async () => {
    const calls = mockApi({
      'GET /api/family/insights': { body: insights({ dependentId: 12, spentCents: 10_00, byBucket: [{ ...insights().byBucket[2]!, spentCents: 10_00, share: 1 }] }) },
    });
    renderWithApi(<WeekSpendCard dependentId={12} />);
    await settle();

    expect(params(insightCalls(calls)[0]!)).toEqual({ period: '7d', dependentId: '12' });
    expect(text('legend-bucket-3')).toContain('$10.00');
  });

  it('shows "No spending yet" with nothing spent', async () => {
    mockApi({ 'GET /api/family/insights': { body: empty({ dependentId: 12 }) } });
    renderWithApi(<WeekSpendCard dependentId={12} />);
    await settle();
    expect(text('card-week-spend')).toContain('No spending yet');
  });
});

describe('grandparent funding breakdown', () => {
  const funding: FundingInsights = {
    memberId: 3,
    contributedCents: 150_00,
    familyFundedCents: 300_00,
    shareOfFamilyFunding: 0.5,
    byBucket: [
      { bucketId: 1, bucketName: 'Food', icon: 'food', contributedCents: 100_00, share: 2 / 3, bucketFundedCents: 200_00, bucketSpentCents: 40_00, bucketHeldCents: 12_50 },
      { bucketId: 2, bucketName: 'School', icon: 'school', contributedCents: 50_00, share: 1 / 3, bucketFundedCents: 100_00, bucketSpentCents: 0, bucketHeldCents: 0 },
    ],
    spentFromFundedBucketsCents: 40_00,
    heldInFundedBucketsCents: 12_50,
  };

  it('shows contributions by bucket, the family share and pooled spending in honest words', async () => {
    mockApi({ 'GET /api/members/3/funding-insights': { body: funding } });
    renderWithApi(<FundingBreakdown memberId={3} bucketOrder={[1, 2]} />);
    await settle();

    expect(text('legend-bucket-1')).toContain('$100.00');
    expect(text('legend-bucket-1')).toContain('67%');
    expect(text('kpi-funding-share')).toContain('50%');
    expect(text('kpi-funding-share')).toContain('$300.00');
    expect(text('kpi-funding-spent')).toContain('$52.50');
    expect(text('kpi-funding-spent')).toContain('incl. $12.50 not settled yet');
    expect(text('text-funding-pooled')).toContain('pool');
  });

  it('shows an error with a retry when the read fails', async () => {
    mockApi({ 'GET /api/members/3/funding-insights': { status: 500, body: { error: 'boom' } } });
    renderWithApi(<FundingBreakdown memberId={3} bucketOrder={[]} />);
    await settle();
    expect(byTestId('state-error')).not.toBeNull();
  });
});

describe('insight formatting', () => {
  it('compares with the previous period only when it had spending', () => {
    expect(changeVsPrevious({ spentCents: 10_00, previousPeriodSpentCents: null })).toBeNull();
    expect(changeVsPrevious({ spentCents: 10_00, previousPeriodSpentCents: 0 })).toBeNull();
    expect(changeVsPrevious({ spentCents: 5_00, previousPeriodSpentCents: 10_00 })).toBe('Down 50%');
    expect(changeVsPrevious({ spentCents: 10_00, previousPeriodSpentCents: 10_00 })).toBe('No change');
  });

  it('labels a week by weekday and longer periods by date, without shifting days', () => {
    expect(dailyBars(insights()).map((d) => d.label)).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    const month = dailyBars(insights({ daily: [{ date: '2026-10-01', spentCents: 5_00 }, { date: '2026-10-02', spentCents: 0 }, ...insights().daily] }));
    expect(month[0]!.label).toBe('Oct 1');
    expect(month[0]!.longLabel).toBe('Thursday, Oct 1');
  });
});
