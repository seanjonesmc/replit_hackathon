import {
  useGetFamily,
  useListMemberBankAccounts,
  useListMemberContributions,
  type Member,
} from '@workspace/api-client-react';
import { isChainInFlight } from '@/lib/chain';

/** Picks which family member is adding money. */
export type PickFundingMember = (members: Member[]) => Member | undefined;

/** The grandparent (or, failing that, the first funder). */
export const pickGrandparent: PickFundingMember = (members) =>
  members.find((m) => m.relationship === 'grandparent') ?? members.find((m) => m.role === 'funder');

/** The parent, who funds buckets as herself. */
export const pickParent: PickFundingMember = (members) => members.find((m) => m.role === 'parent');

/**
 * One family member as a funder: finds their member record in the family,
 * then loads their linked bank and their contributions.
 */
export function useFundingMember(pick: PickFundingMember) {
  const family = useGetFamily();
  const funder = pick(family.data?.members ?? []);
  const enabled = funder !== undefined;
  const banks = useListMemberBankAccounts(funder?.id ?? 0, { query: { enabled } });
  // Poll while a contribution's chain write is in flight, until it is mined or fails.
  const contributions = useListMemberContributions(funder?.id ?? 0, {
    query: {
      enabled,
      refetchInterval: (q) => (q.state.data?.contributions.some((c) => isChainInFlight(c.chain)) ? 2000 : false),
    },
  });
  return {
    funder,
    /** Every bank the funder linked. */
    banks: banks.data ?? [],
    /** The bank they add money from (the first one linked). */
    bank: banks.data?.[0] ?? null,
    totalCents: contributions.data?.totalCents ?? 0,
    contributions: contributions.data?.contributions ?? [],
    isLoading: family.isLoading || (enabled && (banks.isLoading || contributions.isLoading)),
    isError: family.isError || banks.isError || contributions.isError,
    isFetching: family.isFetching || banks.isFetching || contributions.isFetching,
    /** The family loaded but has no funder to show. */
    missingFunder: family.isSuccess && !enabled,
    refetch: () => {
      void family.refetch();
      if (enabled) {
        void banks.refetch();
        void contributions.refetch();
      }
    },
  };
}

export type FundingMember = ReturnType<typeof useFundingMember>;

/** The grandparent's view. */
export function useFunderContributions(): FundingMember {
  return useFundingMember(pickGrandparent);
}

/** The parent's view when she adds money herself. */
export function useParentFunding(): FundingMember {
  return useFundingMember(pickParent);
}
