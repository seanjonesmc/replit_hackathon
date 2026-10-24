import { ChevronLeft } from 'lucide-react';
import { Link } from 'wouter';
import { useGetFamily } from '@workspace/api-client-react';
import { AddMoneyFlow } from '@/features/funder/AddMoneyFlow';
import { useParentFunding } from '@/features/funder/use-funder';

/**
 * The parent adds money as herself, from her own linked bank, into one of the
 * dependent's buckets. Same flow as the grandparent's Add money tab.
 */
export default function ParentAddMoney() {
  const funding = useParentFunding();
  const family = useGetFamily();
  const dependent = family.data?.members.find((m) => m.role === 'dependent')?.displayName;
  return (
    <>
      <Link
        href="/parent/home"
        className="type-link-sm -ml-1 mb-3 inline-flex items-center gap-1 text-primary"
        data-testid="link-back-home"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Home
      </Link>
      <AddMoneyFlow
        funding={funding}
        title="Add money"
        subtitle={dependent ? `Top up one of ${dependent}'s buckets.` : 'Pick a bucket to top up.'}
      />
    </>
  );
}
