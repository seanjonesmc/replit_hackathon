import { useState } from 'react';
import { Check, Landmark, PiggyBank } from 'lucide-react';
import { useListBuckets } from '@workspace/api-client-react';
import { BucketIconBadge } from '@/components/trellis/bucket-card';
import { EmptyState } from '@/components/trellis/empty-state';
import { ChainBadge, PillButton, SectionTitle } from '@/components/trellis/primitives';
import { HeroBalanceCardSkeleton, LoadingRegion, Skeleton } from '@/components/trellis/skeletons';
import { ComingSoonNote, ErrorState } from '@/components/trellis/states';
import { ScreenHeader } from '@/features/shell/layout';
import { HeroBalanceCard } from '@/components/trellis/hero-balance-card';
import { chainStatusOf } from '@/lib/chain';
import { formatCents } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useFunderContributions } from './use-funder';

export default function FunderAddMoney() {
  const funder = useFunderContributions();
  const buckets = useListBuckets();
  const [selected, setSelected] = useState<number | null>(null);

  if (funder.isLoading || buckets.isLoading) {
    return (
      <LoadingRegion label="Loading your bank and buckets" className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <HeroBalanceCardSkeleton className="bg-surface-alt" />
        <Skeleton className="h-[72px] rounded-card-sm" />
        <Skeleton className="h-[72px] rounded-card-sm" />
        <Skeleton className="h-[72px] rounded-card-sm" />
      </LoadingRegion>
    );
  }
  if (funder.isError || buckets.isError) {
    return (
      <ErrorState
        onRetry={() => {
          funder.refetch();
          void buckets.refetch();
        }}
        retrying={funder.isFetching || buckets.isFetching}
      />
    );
  }

  const name = funder.funder?.displayName;
  const bank = funder.bank;
  const list = buckets.data ?? [];
  return (
    <>
      <ScreenHeader title={name ? `Hi, ${name}` : 'Add money'} subtitle="Pick a bucket to top up." />

      <section aria-labelledby="bank-title">
        <SectionTitle>
          <span id="bank-title">From</span>
        </SectionTitle>
        {bank ? (
          <HeroBalanceCard
            eyebrow={`${bank.bankName} ••${bank.last4}`}
            amountCents={bank.balanceCents}
            caption="Available to add · simulated bank · test dollars"
            badge={<Landmark className="size-5 shrink-0" aria-hidden="true" />}
            data-testid="card-linked-bank"
          >
            <ChainBadge status={chainStatusOf(bank.chain)} />
          </HeroBalanceCard>
        ) : (
          <EmptyState
            icon={Landmark}
            title="No bank linked"
            body="Linking a bank arrives with onboarding in a later step of the demo."
            className="rounded-card bg-surface-alt"
            data-testid="state-no-bank"
          />
        )}
      </section>

      <section className="mt-8" aria-labelledby="bucket-choice-title">
        <SectionTitle>
          <span id="bucket-choice-title">To</span>
        </SectionTitle>
        {list.length === 0 ? (
          <EmptyState
            icon={PiggyBank}
            title="No buckets yet"
            body="Buckets appear here once the family sets them up."
            className="rounded-card bg-surface-alt"
            data-testid="state-no-buckets"
          />
        ) : (
          <div role="radiogroup" aria-labelledby="bucket-choice-title" className="flex flex-col gap-2">
            {list.map((b) => {
              const isSelected = selected === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelected(b.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-card-sm border-2 bg-surface-alt p-4 text-left transition-colors',
                    isSelected ? 'border-primary' : 'border-transparent hover:border-hairline',
                  )}
                  data-testid={`option-bucket-${b.id}`}
                >
                  <BucketIconBadge icon={b.icon} />
                  <span className="min-w-0 flex-1">
                    <span className="type-link-sm block">{b.name}</span>
                    <span className="type-caption block text-ink-muted">{b.purpose}</span>
                  </span>
                  <span className="text-right">
                    <span className="type-link-sm tnum block">{formatCents(b.availableCents)}</span>
                    <span className="type-caption block text-ink-muted">left</span>
                  </span>
                  <span
                    className={cn(
                      'grid size-6 shrink-0 place-items-center rounded-full border-2',
                      isSelected ? 'border-primary bg-primary text-on-primary' : 'border-hairline',
                    )}
                    aria-hidden="true"
                  >
                    {isSelected && <Check className="size-4" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-8 flex flex-col gap-2">
        <PillButton block disabled icon={<PiggyBank className="size-5" aria-hidden="true" />} data-testid="button-add-money">
          Add money
        </PillButton>
        <ComingSoonNote className="justify-center">Adding money arrives in a later step of the demo.</ComingSoonNote>
      </div>
    </>
  );
}
