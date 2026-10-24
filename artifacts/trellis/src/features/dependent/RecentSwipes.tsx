import { ReceiptText } from 'lucide-react';
import { useListAuthorizations } from '@workspace/api-client-react';
import { ActivityRow } from '@/components/trellis/activity-row';
import { EmptyState } from '@/components/trellis/empty-state';
import { SectionTitle } from '@/components/trellis/primitives';
import { ActivityRowSkeleton, LoadingRegion } from '@/components/trellis/skeletons';
import { ErrorState } from '@/components/trellis/states';
import { DECISION } from '@/features/family/spending';
import { chainStatusOf } from '@/lib/chain';
import { formatWhen } from '@/lib/format';

const RECENT_LIMIT = 5;

/** The latest swipes on the card, newest first; refreshed after every swipe. */
export function RecentSwipes({ holderName, className }: { holderName: string; className?: string }) {
  const { data, isLoading, isError, refetch, isFetching } = useListAuthorizations({ limit: RECENT_LIMIT });
  return (
    <section className={className} aria-labelledby="recent-swipes-title">
      <SectionTitle>
        <span id="recent-swipes-title">Recent swipes</span>
      </SectionTitle>
      {isLoading ? (
        <LoadingRegion label="Loading recent swipes">
          <ul className="flex flex-col divide-y">
            {Array.from({ length: 3 }, (_, i) => (
              <ActivityRowSkeleton key={i} />
            ))}
          </ul>
        </LoadingRegion>
      ) : isError || !data ? (
        <ErrorState onRetry={() => refetch()} retrying={isFetching} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No swipes yet"
          body="Tap a shop above to try your card."
          className="rounded-card border bg-surface"
          data-testid="state-recent-swipes-empty"
        />
      ) : (
        <ul className="flex flex-col divide-y" data-testid="list-recent-swipes">
          {data.map((a) => (
            <ActivityRow
              key={a.id}
              who={holderName}
              sentence={a.merchantName}
              amountCents={-a.amountCents}
              status={DECISION[a.decision]}
              detail={a.reason}
              when={formatWhen(a.swipedAt)}
              bucket={a.bucketName ?? undefined}
              chain={chainStatusOf(a.chain)}
              data-testid={`row-swipe-${a.id}`}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
