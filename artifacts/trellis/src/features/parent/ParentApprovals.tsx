import { useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion as animated, useIsPresent } from 'framer-motion';
import { Inbox } from 'lucide-react';
import { BRAND } from '@brand/brand.config';
import {
  getGetAuthorizationQueryKey,
  getListApprovalsQueryKey,
  useGetFamily,
  useGetParentOverview,
  useListApprovals,
  useResolveApproval,
  type Authorization,
} from '@workspace/api-client-react';
import { ApprovalCard, type ApprovalAnswer } from '@/components/trellis/approval-card';
import { EmptyState } from '@/components/trellis/empty-state';
import { DURATION, EASE_SETTLE, motion } from '@/components/trellis/motion';
import { LoadingRegion, Skeleton } from '@/components/trellis/skeletons';
import { ErrorState } from '@/components/trellis/states';
import { apiErrorMessage, refreshAfterSwipe } from '@/features/family/spending';
import { ScreenHeader } from '@/features/shell/layout';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';

const APPROVALS_POLL_MS = 3000;

/** How long an answered request takes to fade and collapse out of the list (quick). */
export const APPROVAL_EXIT_MS = DURATION.quick;

/** The request list. With reduced motion, answered requests leave at once. */
function LeavingRows({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  return reduced ? <>{children}</> : <AnimatePresence initial={false}>{children}</AnimatePresence>;
}

/**
 * One request in the list. Once answered it fades and collapses away; while
 * it leaves it is hidden from assistive tech and can't be tapped.
 */
function LeavingRow({ children }: { children: ReactNode }) {
  const present = useIsPresent();
  return (
    <animated.div
      className="overflow-hidden pb-3"
      exit={{ opacity: 0, height: 0, paddingBottom: 0 }}
      transition={{ duration: APPROVAL_EXIT_MS / 1000, ease: EASE_SETTLE }}
      aria-hidden={present ? undefined : true}
      inert={!present}
      data-leaving={present ? undefined : 'true'}
    >
      {children}
    </animated.div>
  );
}

export default function ParentApprovals() {
  const queryClient = useQueryClient();
  // New requests show up while the screen is open, even from another device.
  const approvals = useListApprovals({ query: { refetchInterval: APPROVALS_POLL_MS } });
  // The overview names the dependent; it is usually cached from the home tab.
  const overview = useGetParentOverview();
  // The parent answering: the server checks the role again.
  const family = useGetFamily();
  const resolve = useResolveApproval();
  const [sending, setSending] = useState<{ id: number; answer: ApprovalAnswer } | null>(null);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const data = approvals.data;
  const dependentName = overview.data?.dependentName;
  const parentId = family.data?.members.find((m) => m.role === 'parent')?.id;
  const isLoading = approvals.isLoading || overview.isLoading || family.isLoading;
  const isError = approvals.isError || overview.isError || family.isError;
  const isFetching = approvals.isFetching || overview.isFetching || family.isFetching;
  const refetch = () => {
    void approvals.refetch();
    void overview.refetch();
    void family.refetch();
  };

  const answer = (request: Authorization, choice: ApprovalAnswer) => {
    if (parentId === undefined || sending) return;
    setSending({ id: request.id, answer: choice });
    setErrors(({ [request.id]: _cleared, ...rest }) => rest);
    resolve.mutate(
      { authorizationId: request.id, data: { parentId, decision: choice } },
      {
        onSuccess: (thread) => {
          // Answered requests leave the list at once; everything else refetches.
          queryClient.setQueryData<Authorization[]>(getListApprovalsQueryKey(), (list) => list?.filter((a) => a.id !== request.id));
          queryClient.setQueryData(getGetAuthorizationQueryKey(request.id), thread);
        },
        onError: (error) =>
          setErrors((prev) => ({
            ...prev,
            [request.id]: apiErrorMessage(
              error,
              choice === 'approve' ? "The approval didn't go through. Try again." : "The decline didn't go through. Try again.",
            ),
          })),
        onSettled: () => {
          setSending(null);
          void refreshAfterSwipe(queryClient);
        },
      },
    );
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
      ) : (
        <div className="flex flex-col">
          <LeavingRows>
            {data.map((r) => (
              <LeavingRow key={r.id}>
                <ApprovalCard
                  request={r}
                  dependentName={dependentName}
                  onAnswer={parentId === undefined ? undefined : (choice) => answer(r, choice)}
                  sending={sending?.id === r.id ? sending.answer : null}
                  error={errors[r.id] ?? null}
                />
              </LeavingRow>
            ))}
          </LeavingRows>
          {data.length === 0 && (
            <EmptyState
              icon={Inbox}
              title="You're all caught up"
              body={`When ${BRAND.demo.dependent} asks for an OK on a purchase, it shows up here.`}
              className={cn('rounded-card border bg-surface', motion.fadeIn)}
              data-testid="state-approvals-empty"
            />
          )}
        </div>
      )}
    </>
  );
}
