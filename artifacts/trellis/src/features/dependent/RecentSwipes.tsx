import { ReceiptText } from 'lucide-react';
import { useListAuthorizations, type Authorization } from '@workspace/api-client-react';
import { ActivityRow } from '@/components/trellis/activity-row';
import { EmptyState } from '@/components/trellis/empty-state';
import { SectionTitle } from '@/components/trellis/primitives';
import { ActivityRowSkeleton, LoadingRegion } from '@/components/trellis/skeletons';
import { ErrorState } from '@/components/trellis/states';
import { DECISION } from '@/features/family/spending';
import { chainStatusOf, isChainInFlight } from '@/lib/chain';
import { formatWhen } from '@/lib/format';

const RECENT_LIMIT = 5;
// Extra rows so folding a parent-approved original into its retry still fills the list.
const FETCH_LIMIT = RECENT_LIMIT * 2;

/**
 * One row per purchase: an original a parent approved is folded into its
 * retry, and the steps read in plain words.
 */
export function recentPurchases(rows: readonly Authorization[]) {
  return rows
    .filter((a) => a.nextAuthorizationId === null)
    .slice(0, RECENT_LIMIT)
    .map((a) => {
      if (a.previousAuthorizationId !== null) {
        const outcome = a.decision === 'APPROVED' ? 'Approved' : 'Declined';
        return { row: a, status: DECISION[a.decision], detail: `Pending → Parent approved → ${outcome}` };
      }
      if (a.status === 'parent_declined') {
        return { row: a, status: 'rejected' as const, detail: 'Pending → Parent declined' };
      }
      return { row: a, status: DECISION[a.decision], detail: a.reason };
    });
}

/** The latest swipes on the card, newest first; refreshed after every swipe. */
export function RecentSwipes({ holderName, className }: { holderName: string; className?: string }) {
  // Poll while a chain write is in flight so its badge turns into a link once mined.
  const { data, isLoading, isError, refetch, isFetching } = useListAuthorizations(
    { limit: FETCH_LIMIT },
    { query: { refetchInterval: (q) => (q.state.data?.some((a) => isChainInFlight(a.chain)) ? 2000 : false) } },
  );
  const purchases = data ? recentPurchases(data) : [];
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
      ) : purchases.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No swipes yet"
          body="Tap a shop above to try your card."
          className="rounded-card border bg-surface"
          data-testid="state-recent-swipes-empty"
        />
      ) : (
        <ul className="flex flex-col divide-y" data-testid="list-recent-swipes">
          {purchases.map(({ row: a, status, detail }) => (
            <ActivityRow
              key={a.id}
              who={holderName}
              sentence={a.merchantName}
              amountCents={-a.amountCents}
              status={status}
              detail={detail}
              when={formatWhen(a.swipedAt)}
              bucket={a.bucketName ?? undefined}
              stage={a.settlement ?? undefined}
              chain={chainStatusOf(a.chain)}
              data-testid={`row-swipe-${a.id}`}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
