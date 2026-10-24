import { useGetFundingInsights } from '@workspace/api-client-react';
import { DonutChart, KpiTile, chartColor, formatShare } from '@/components/trellis/charts';
import { SectionTitle } from '@/components/trellis/primitives';
import { LoadingRegion, Skeleton } from '@/components/trellis/skeletons';
import { ErrorState } from '@/components/trellis/states';
import { formatCents, formatCentsShort } from '@/lib/format';

/**
 * A funder's contributions by bucket, their share of everything the family
 * added, and what has been spent from the buckets they add to. Buckets pool
 * everyone's money, so the wording never claims their exact dollars bought
 * anything.
 */
export function FundingBreakdown({ memberId, bucketOrder }: { memberId: number; bucketOrder: number[] }) {
  const insights = useGetFundingInsights(memberId);
  const colorOf = (bucketId: number) => {
    const index = bucketOrder.indexOf(bucketId);
    return chartColor(index === -1 ? bucketOrder.length : index);
  };

  return (
    <section className="mt-8" aria-labelledby="funding-split-title">
      <SectionTitle>
        <span id="funding-split-title">How your money is split</span>
      </SectionTitle>
      {insights.isLoading ? (
        <LoadingRegion label="Loading how your money is split" className="flex flex-col gap-3">
          <Skeleton className="h-[188px] rounded-card-sm" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-[110px] rounded-card-sm" />
            <Skeleton className="h-[110px] rounded-card-sm" />
          </div>
        </LoadingRegion>
      ) : insights.isError || !insights.data ? (
        <ErrorState onRetry={() => insights.refetch()} retrying={insights.isFetching} />
      ) : insights.data.contributedCents === 0 ? (
        <p className="type-caption px-1 text-ink-muted" data-testid="state-funding-empty">
          Once you add money, you'll see how it's split across the buckets.
        </p>
      ) : (
        <div className="flex flex-col gap-3" data-testid="card-funding-split">
          <div className="rounded-card-sm border bg-surface p-5">
            <DonutChart
              slices={insights.data.byBucket.map((b) => ({
                key: `bucket-${b.bucketId}`,
                label: b.bucketName,
                valueCents: b.contributedCents,
                color: colorOf(b.bucketId),
              }))}
              centerLabel="You added"
              centerValue={formatCentsShort(insights.data.contributedCents)}
              data-testid="chart-funding-by-bucket"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <KpiTile
              label="Your share"
              value={insights.data.shareOfFamilyFunding === null ? '—' : formatShare(insights.data.shareOfFamilyFunding)}
              caption={`of the ${formatCents(insights.data.familyFundedCents)} the family added`}
              data-testid="kpi-funding-share"
            />
            <KpiTile
              label="Spent so far"
              value={formatCents(insights.data.spentFromFundedBucketsCents + insights.data.heldInFundedBucketsCents)}
              caption={
                insights.data.heldInFundedBucketsCents > 0
                  ? `from the buckets you add to, incl. ${formatCents(insights.data.heldInFundedBucketsCents)} not settled yet`
                  : 'from the buckets you add to'
              }
              data-testid="kpi-funding-spent"
            />
          </div>
          <p className="type-caption px-1 text-ink-muted" data-testid="text-funding-pooled">
            Buckets pool everyone's money, so this is what's been spent from them overall, not a list of what your own dollars bought.
          </p>
        </div>
      )}
    </section>
  );
}
