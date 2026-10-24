import { ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import { useGetSpendingInsights } from '@workspace/api-client-react';
import { DonutChart, NoSpendingYet } from '@/components/trellis/charts';
import { SectionTitle } from '@/components/trellis/primitives';
import { LoadingRegion, Skeleton } from '@/components/trellis/skeletons';
import { ErrorState } from '@/components/trellis/states';
import { formatCentsShort } from '@/lib/format';
import { bucketSlices } from './insights-format';

/** Parent home: the last 7 days' spending by bucket, linking to the full Insights screen. */
export function SpendingCard() {
  const insights = useGetSpendingInsights({ period: '7d' });
  return (
    <section className="mt-8" aria-labelledby="spending-title">
      <SectionTitle
        action={
          <Link href="/parent/insights" className="type-link-sm inline-flex items-center gap-0.5 text-primary" data-testid="link-insights">
            Insights
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        }
      >
        <span id="spending-title">Spending</span>
      </SectionTitle>
      <div className="rounded-card-sm border bg-surface p-5" data-testid="card-spending">
        {insights.isLoading ? (
          <LoadingRegion label="Loading spending" className="flex items-center gap-5">
            <Skeleton className="size-[148px] rounded-full" />
            <div className="flex flex-1 flex-col gap-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </LoadingRegion>
        ) : insights.isError || !insights.data ? (
          <ErrorState onRetry={() => insights.refetch()} retrying={insights.isFetching} />
        ) : insights.data.spentCents === 0 ? (
          <NoSpendingYet body="Nothing was spent in the last 7 days." />
        ) : (
          <>
            <p className="type-caption mb-4 text-ink-muted">Last 7 days, by bucket</p>
            <DonutChart
              slices={bucketSlices(insights.data)}
              centerLabel="Spent"
              centerValue={formatCentsShort(insights.data.spentCents)}
              data-testid="chart-spending-by-bucket"
            />
          </>
        )}
      </div>
    </section>
  );
}
