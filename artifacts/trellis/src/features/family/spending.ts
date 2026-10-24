import type { QueryClient } from '@tanstack/react-query';
import {
  getGetCardAndPolicyQueryKey,
  getGetCardQueryKey,
  getGetDependentWalletQueryKey,
  getGetOverviewQueryKey,
  getGetParentOverviewQueryKey,
  getListActivityQueryKey,
  getListApprovalsQueryKey,
  getListAuthorizationsQueryKey,
  getListBucketsQueryKey,
  type DecidedBy as ApiDecidedBy,
  type Decision as ApiDecision,
} from '@workspace/api-client-react';
import type { DecidedBy, Decision } from '@/lib/domain';

/** The API's decision as the screens name it. */
export const DECISION: Record<ApiDecision, Decision> = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PENDING: 'pending',
};

export const DECIDED_BY: Record<ApiDecidedBy, DecidedBy> = {
  Rule: 'rule',
  'AI guard': 'ai_guard',
};

/** API errors carry `{ error }`; fall back to a plain sentence otherwise. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { data?: unknown } | null)?.data;
  if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string' && data.error) {
    return data.error;
  }
  return fallback;
}

/**
 * After a swipe: the feeds, approvals and every balance it may have moved.
 * Screens on view refetch now; the rest refetch when opened.
 */
export function refreshAfterSwipe(queryClient: QueryClient) {
  return Promise.all(
    [
      getListAuthorizationsQueryKey(),
      getListApprovalsQueryKey(),
      getListActivityQueryKey(),
      getGetParentOverviewQueryKey(),
      getListBucketsQueryKey(),
      getGetDependentWalletQueryKey(),
      getGetOverviewQueryKey(),
    ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );
}

/** After freezing or unfreezing: every screen that shows the card. */
export function refreshAfterCardChange(queryClient: QueryClient) {
  return Promise.all(
    [getGetCardQueryKey(), getGetCardAndPolicyQueryKey(), getGetDependentWalletQueryKey()].map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
  );
}
