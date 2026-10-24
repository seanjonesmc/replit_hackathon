import { Inbox } from 'lucide-react';
import { BRAND } from '@brand/brand.config';
import { useGetParentOverview, useListApprovals } from '@workspace/api-client-react';
import { ApprovalCard } from '@/components/trellis/approval-card';
import { EmptyState } from '@/components/trellis/empty-state';
import { LoadingRegion, Skeleton } from '@/components/trellis/skeletons';
import { ErrorState } from '@/components/trellis/states';
import { ScreenHeader } from '@/features/shell/layout';

export default function ParentApprovals() {
  const approvals = useListApprovals();
  // The overview names the dependent; it is usually cached from the home tab.
  const overview = useGetParentOverview();
  const data = approvals.data;
  const dependentName = overview.data?.dependentName;
  const isLoading = approvals.isLoading || overview.isLoading;
  const isError = approvals.isError || overview.isError;
  const isFetching = approvals.isFetching || overview.isFetching;
  const refetch = () => {
    void approvals.refetch();
    void overview.refetch();
  };
  return (
    <>
      <ScreenHeader title="Approvals" subtitle="Purchases waiting for your OK." />
      {isLoading ? (
        <LoadingRegion label="Loading approvals" className="flex flex-col gap-3">
          <Skeleton className="h-44 rounded-card-sm" />
          <Skeleton className="h-44 rounded-card-sm" />
        </LoadingRegion>
      ) : isError || !data || !dependentName ? (
        <ErrorState onRetry={() => refetch()} retrying={isFetching} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="You're all caught up"
          body={`When ${BRAND.demo.dependent} asks for an OK on a purchase, it shows up here.`}
          className="rounded-card bg-surface-alt"
          data-testid="state-approvals-empty"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((r) => (
            <ApprovalCard key={r.id} request={r} dependentName={dependentName} />
          ))}
        </div>
      )}
    </>
  );
}
