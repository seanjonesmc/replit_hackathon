import { useState, type ReactNode } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'wouter';
import { useGetSpendingInsights, type InsightsPeriod, type SpendingInsights } from '@workspace/api-client-react';
import { BucketIconBadge } from '@/components/trellis/bucket-card';
import { BarSeries, DonutChart, KpiTile, NoSpendingYet, formatShare } from '@/components/trellis/charts';
import { SectionTitle } from '@/components/trellis/primitives';
import { LoadingRegion, Skeleton } from '@/components/trellis/skeletons';
import { ErrorState } from '@/components/trellis/states';
import { ScreenHeader } from '@/features/shell/layout';
import { formatCents, formatCentsShort } from '@/lib/format';
import { cn } from '@/lib/utils';
import { PERIODS, bucketSlices, changeVsPrevious, dailyBars, dependentSlices, hasNoPurchases, periodLong, purchases } from './insights-format';

interface FilterOption<T> {
  value: T;
  label: string;
}

const ALL_CHILDREN: FilterOption<number | null> = { value: null, label: 'All children' };
const PERIOD_OPTIONS: FilterOption<InsightsPeriod>[] = PERIODS.map((p) => ({ value: p.id, label: p.label }));

/** A row of toggle buttons; exactly one is pressed. */
function FilterGroup<T extends string | number | null>({
  label,
  options,
  value,
  onChange,
  testId,
}: {
  label: string;
  options: FilterOption<T>[];
  value: T;
  onChange: (value: NoInfer<T>) => void;
  testId: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2" data-testid={testId}>
      {options.map((o) => {
        const pressed = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-9 rounded-pill border px-4 text-[14px] font-bold transition-colors',
              pressed ? 'border-primary bg-primary text-on-primary' : 'bg-surface text-ink hover:bg-tint',
            )}
            data-testid={`${testId}-${o.value ?? 'all'}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Panel({ id, title, caption, children }: { id: string; title: string; caption?: string; children: ReactNode }) {
  return (
    <section className="mt-8" aria-labelledby={`${id}-title`} data-testid={`section-${id}`}>
      <SectionTitle>
        <span id={`${id}-title`}>{title}</span>
      </SectionTitle>
      <div className="rounded-card-sm border bg-surface p-5">
        {caption && <p className="type-caption mb-4 text-ink-muted">{caption}</p>}
        {children}
      </div>
    </section>
  );
}

function KpiTiles({ data }: { data: SpendingInsights }) {
  const change = changeVsPrevious(data);
  const previousLabel = data.period === '30d' ? 'previous 30 days' : 'previous 7 days';
  return (
    <div className="grid grid-cols-2 gap-3" data-testid="kpi-tiles">
      <KpiTile label="Total spent" value={formatCents(data.spentCents)} caption={data.pendingCount > 0 ? `${data.pendingCount} still waiting on an OK` : undefined} data-testid="kpi-total-spent" />
      {change && (
        <KpiTile
          label="Change"
          value={change}
          caption={`vs ${formatCents(data.previousPeriodSpentCents ?? 0)} the ${previousLabel}`}
          data-testid="kpi-change"
        />
      )}
      <KpiTile label="Purchases" value={data.purchaseCount} caption="Approved, each counted once" data-testid="kpi-purchases" />
      <KpiTile label="Average" value={data.averagePurchaseCents === null ? '—' : formatCents(data.averagePurchaseCents)} caption="Per purchase" data-testid="kpi-average" />
      <KpiTile
        label="Approval rate"
        value={data.approvalRate === null ? '—' : formatShare(data.approvalRate)}
        caption={data.decidedCount === 0 ? 'Nothing decided yet' : `${data.purchaseCount} of ${data.decidedCount} approved`}
        data-testid="kpi-approval-rate"
      />
      <KpiTile
        label="Stopped"
        value={formatCents(data.declinedCents)}
        caption={`${purchases(data.declinedCount)} declined by the rules or a parent`}
        data-testid="kpi-stopped"
      />
    </div>
  );
}

function BucketUsage({ data }: { data: SpendingInsights }) {
  return (
    <ul className="flex flex-col gap-5" data-testid="list-bucket-usage">
      {data.bucketUsage.map((b) => {
        const funded = b.fundedCents;
        // Spent means approved, held or settled, as everywhere else.
        const used = b.spentCents + b.heldCents;
        const spentPct = funded > 0 ? Math.min(100, (b.spentCents / funded) * 100) : 0;
        const heldPct = funded > 0 ? Math.min(100 - spentPct, (b.heldCents / funded) * 100) : 0;
        return (
          <li key={b.bucketId} className="flex gap-3" data-testid={`row-bucket-usage-${b.bucketId}`}>
            <BucketIconBadge icon={b.icon} className="bg-surface-alt" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="type-link-sm">{b.bucketName}</span>
                <span className="type-caption tnum text-ink-muted">{funded > 0 ? `${formatShare(used / funded)} spent` : 'Not funded yet'}</span>
              </div>
              <div className="mt-2 flex h-2 overflow-hidden rounded-pill bg-surface-alt" aria-hidden="true">
                <span className="h-full bg-chart-1" style={{ width: `${spentPct}%` }} />
                <span className="h-full bg-chart-4" style={{ width: `${heldPct}%` }} />
              </div>
              <p className="type-caption tnum mt-1.5 text-ink-muted">
                {formatCents(used)} spent of {formatCents(funded)} added
                {b.heldCents > 0 && ` · incl. ${formatCents(b.heldCents)} held`}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function InsightsBody({ data }: { data: SpendingInsights }) {
  const empty = hasNoPurchases(data);
  const showByChild = data.dependentId === null && data.dependents.length > 1;
  return (
    <>
      {empty ? (
        <NoSpendingYet className="mt-6" body={`No purchases in ${periodLong(data.period)}.`} />
      ) : (
        <>
          <div className="mt-6">
            <KpiTiles data={data} />
          </div>
          <Panel id="by-bucket" title="By bucket">
            {data.spentCents === 0 ? (
              <NoSpendingYet />
            ) : (
              <DonutChart slices={bucketSlices(data)} centerLabel="Spent" centerValue={formatCentsShort(data.spentCents)} data-testid="chart-insights-by-bucket" />
            )}
          </Panel>
          {showByChild && (
            <Panel id="by-child" title="By child">
              {data.spentCents === 0 ? (
                <>
                  <NoSpendingYet />
                  <ChildDeclines data={data} />
                </>
              ) : (
                <DonutChart slices={dependentSlices(data)} centerLabel="Spent" centerValue={formatCentsShort(data.spentCents)} data-testid="chart-insights-by-child" />
              )}
            </Panel>
          )}
          <Panel id="daily" title="Day by day">
            {data.spentCents === 0 ? <NoSpendingYet /> : <BarSeries data={dailyBars(data)} label={`Spending per day, ${periodLong(data.period)}`} data-testid="chart-daily" />}
          </Panel>
          <Panel id="top-merchants" title="Top stores">
            {data.topMerchants.length === 0 ? (
              <NoSpendingYet />
            ) : (
              <ol className="flex flex-col divide-y" data-testid="list-top-merchants">
                {data.topMerchants.map((m, index) => (
                  <li key={m.merchantName} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-alt text-[13px] font-bold tnum">{index + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="type-body-sm block truncate">{m.merchantName}</span>
                      <span className="type-caption block text-ink-muted">{purchases(m.purchaseCount)}</span>
                    </span>
                    <span className="type-link-sm tnum">{formatCents(m.spentCents)}</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </>
      )}
      <Panel id="bucket-usage" title="Bucket usage" caption="All time, whole family. Buckets are shared by every child.">
        <BucketUsage data={data} />
      </Panel>
    </>
  );
}

/** With no spending but some declines, still say who was stopped. */
function ChildDeclines({ data }: { data: SpendingInsights }) {
  const stopped = data.byDependent.filter((d) => d.declinedCount > 0);
  if (stopped.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-col gap-1">
      {stopped.map((d) => (
        <li key={d.dependentId} className="type-caption text-ink-muted">
          {d.dependentName}: {d.declinedCount} declined ({formatCents(d.declinedCents)})
        </li>
      ))}
    </ul>
  );
}

/** The parent's Insights screen: spending KPIs and charts, filtered by child and period. */
export default function ParentInsights() {
  const [period, setPeriod] = useState<InsightsPeriod>('7d');
  const [dependentId, setDependentId] = useState<number | null>(null);
  const insights = useGetSpendingInsights(
    dependentId === null ? { period } : { period, dependentId },
    { query: { placeholderData: keepPreviousData } },
  );
  const data = insights.data;

  return (
    <>
      <Link href="/parent/home" className="type-link-sm -ml-1 mb-3 inline-flex items-center gap-1 text-primary" data-testid="link-back-home">
        <ChevronLeft className="size-4" aria-hidden="true" />
        Home
      </Link>
      <ScreenHeader title="Insights" subtitle="Where the family's money goes." />

      {insights.isLoading ? (
        <LoadingRegion label="Loading insights" className="flex flex-col gap-3">
          <Skeleton className="h-9 w-64 rounded-pill" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-[92px] rounded-card-sm" />
            ))}
          </div>
          <Skeleton className="h-[200px] rounded-card-sm" />
        </LoadingRegion>
      ) : insights.isError || !data ? (
        <ErrorState onRetry={() => insights.refetch()} retrying={insights.isFetching} />
      ) : (
        <div aria-busy={insights.isFetching} className={cn('transition-opacity', insights.isPlaceholderData && 'opacity-60')}>
          <div className="flex flex-col gap-3">
            {data.dependents.length > 1 && (
              <FilterGroup
                label="Which child"
                options={[ALL_CHILDREN, ...data.dependents.map((d): FilterOption<number | null> => ({ value: d.id, label: d.displayName }))]}
                value={dependentId}
                onChange={setDependentId}
                testId="filter-child"
              />
            )}
            <FilterGroup
              label="Period"
              options={PERIOD_OPTIONS}
              value={period}
              onChange={setPeriod}
              testId="filter-period"
            />
          </div>
          <InsightsBody data={data} />
        </div>
      )}
    </>
  );
}
