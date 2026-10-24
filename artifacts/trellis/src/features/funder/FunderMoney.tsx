import { HandCoins } from 'lucide-react';
import { BucketIconBadge } from '@/components/trellis/bucket-card';
import { EmptyState } from '@/components/trellis/empty-state';
import { ChainBadge, SectionTitle } from '@/components/trellis/primitives';
import { LoadingRegion, Skeleton } from '@/components/trellis/skeletons';
import { ComingSoonNote, ErrorState } from '@/components/trellis/states';
import { ScreenHeader } from '@/features/shell/layout';
import { chainStatusOf } from '@/lib/chain';
import { formatCents, formatWhen } from '@/lib/format';
import { useListBuckets } from '@workspace/api-client-react';
import { useFunderContributions } from './use-funder';

export default function FunderMoney() {
  const funder = useFunderContributions();
  const buckets = useListBuckets();

  if (funder.isLoading) {
    return (
      <LoadingRegion label="Loading your contributions" className="flex flex-col gap-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-20 rounded-card-sm" />
        <Skeleton className="h-20 rounded-card-sm" />
      </LoadingRegion>
    );
  }
  if (funder.isError) return <ErrorState onRetry={funder.refetch} retrying={funder.isFetching} />;

  const contributions = funder.contributions;
  const iconFor = (bucketId: number) => buckets.data?.find((b) => b.id === bucketId)?.icon ?? null;
  const bucketCount = new Set(contributions.map((c) => c.bucketId)).size;
  return (
    <>
      <ScreenHeader title="Where my money went" />
      {contributions.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title="Nothing added yet"
          body="You'll see every purchase your money covers, right here."
          className="rounded-card bg-surface-alt"
          data-testid="state-contributions-empty"
        />
      ) : (
        <>
          <div className="rounded-card bg-surface-alt p-5" data-testid="card-total-contributed">
            <p className="type-label text-ink-muted">You've added</p>
            <p className="type-display-md tnum mt-2">{formatCents(funder.totalCents)}</p>
            <p className="type-caption mt-1 text-ink-muted">Test dollars, across {bucketCount} {bucketCount === 1 ? 'bucket' : 'buckets'}</p>
          </div>
          <section className="mt-8" aria-labelledby="contributions-title">
            <SectionTitle>
              <span id="contributions-title">Your contributions</span>
            </SectionTitle>
            <ul className="flex flex-col divide-y" data-testid="list-contributions">
              {contributions.map((c) => (
                <li key={c.id} className="flex gap-3 py-4" data-testid={`row-contribution-${c.id}`}>
                  <BucketIconBadge icon={iconFor(c.bucketId)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="type-body-sm">You added money to {c.bucketName}</p>
                      <span className="type-link-sm tnum shrink-0 text-approved">+{formatCents(c.amountCents)}</span>
                    </div>
                    <p className="type-caption mt-1 text-ink-muted" data-testid={`text-contribution-note-${c.id}`}>
                      {c.note}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="type-caption text-ink-muted">{formatWhen(c.createdAt)}</span>
                      <ChainBadge status={chainStatusOf(c.chain)} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <ComingSoonNote className="mt-2">Which purchases each contribution paid for arrives in a later step of the demo.</ComingSoonNote>
          </section>
        </>
      )}
    </>
  );
}
