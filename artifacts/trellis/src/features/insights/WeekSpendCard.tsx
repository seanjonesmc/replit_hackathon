import { useGetSpendingInsights } from '@workspace/api-client-react';
import { DonutChart, NoSpendingYet } from '@/components/trellis/charts';
import { SectionTitle } from '@/components/trellis/primitives';
import { LoadingRegion, Skeleton } from '@/components/trellis/skeletons';
import { ErrorState } from '@/components/trellis/states';
import { formatCentsShort } from '@/lib/format';
import { bucketSlices } from './insights-format';

/**
 * The dependent's own spending over the last 7 days, by bucket. Always
 * filtered to them, so a sibling's purchases never show here.
 */
export function WeekSpendCard({ dependentId }: { dependentId: number }) {
  const insights = useGetSpendingInsights({ period: '7d', dependentId });
  return (
    <section className="mt-8" aria-labelledby="week-spend-title">
      <SectionTitle>
        <span id="week-spend-title">This week</span>
      </SectionTitle>
      <div className="rounded-card-sm border bg-surface p-5" data-testid="card-week-spend">
        {insights.isLoading ? (
          <LoadingRegion label="Loading your week" className="flex items-center gap-5">
            <Skeleton className="size-[112px] rounded-full" />
            <div className="flex flex-1 flex-col gap-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </LoadingRegion>
        ) : insights.isError || !insights.data ? (
          <ErrorState onRetry={() => insights.refetch()} retrying={insights.isFetching} />
        ) : insights.data.spentCents === 0 ? (
          <NoSpendingYet body="What you spend in the last 7 days shows up here." />
        ) : (
          <>
            <p className="type-caption mb-4 text-ink-muted">What you spent in the last 7 days</p>
            <DonutChart
              size="sm"
              slices={bucketSlices(insights.data)}
              centerLabel="Spent"
              centerValue={formatCentsShort(insights.data.spentCents)}
              data-testid="chart-week-spend"
            />
          </>
        )}
      </div>
    </section>
  );
}
