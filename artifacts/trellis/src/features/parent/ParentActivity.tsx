import { ListChecks } from 'lucide-react';
import { useListActivity } from '@workspace/api-client-react';
import { EmptyState } from '@/components/trellis/empty-state';
import { ActivityRowSkeleton, LoadingRegion } from '@/components/trellis/skeletons';
import { ErrorState } from '@/components/trellis/states';
import { FamilyActivityRow } from '@/features/family/FamilyActivityRow';
import { ScreenHeader } from '@/features/shell/layout';
import { isChainInFlight } from '@/lib/chain';

export default function ParentActivity() {
  // Poll while a chain write is in flight so its badge turns into a link once mined.
  const { data, isLoading, isError, refetch, isFetching } = useListActivity({
    query: { refetchInterval: (q) => (q.state.data?.some((a) => isChainInFlight(a.chain)) ? 2000 : false) },
  });
  return (
    <>
      <ScreenHeader title="Activity" subtitle="Every purchase and every dollar added, newest first." />
      {isLoading ? (
        <LoadingRegion label="Loading activity">
          <ul className="flex flex-col divide-y">
            {Array.from({ length: 5 }, (_, i) => (
              <ActivityRowSkeleton key={i} />
            ))}
          </ul>
        </LoadingRegion>
      ) : isError || !data ? (
        <ErrorState onRetry={() => refetch()} retrying={isFetching} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No activity yet"
          body="Purchases and money added to buckets will show up here."
          className="rounded-card border bg-surface"
          data-testid="state-activity-empty"
        />
      ) : (
        <ul className="flex flex-col divide-y" data-testid="list-activity">
          {data.map((a) => (
            <FamilyActivityRow key={a.id} item={a} />
          ))}
        </ul>
      )}
    </>
  );
}
