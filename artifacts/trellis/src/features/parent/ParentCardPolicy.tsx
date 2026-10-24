import { Ban, Snowflake, Sparkles } from 'lucide-react';
import { useGetCardAndPolicy } from '@workspace/api-client-react';
import { PolicyCard } from '@/components/trellis/policy-card';
import { ChainBadge, PillButton, SectionTitle, Tag } from '@/components/trellis/primitives';
import { LoadingRegion, Skeleton } from '@/components/trellis/skeletons';
import { ComingSoonNote, ErrorState } from '@/components/trellis/states';
import { VirtualCard } from '@/components/trellis/virtual-card';
import { CardFacts } from '@/features/family/CardFacts';
import { ScreenHeader } from '@/features/shell/layout';
import { chainStatusOf } from '@/lib/chain';

export default function ParentCardPolicy() {
  const { data, isLoading, isError, refetch, isFetching } = useGetCardAndPolicy();
  if (isLoading) {
    return (
      <LoadingRegion label="Loading the card and policy" className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="aspect-[1.586] w-full rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </LoadingRegion>
    );
  }
  if (isError || !data) return <ErrorState onRetry={() => refetch()} retrying={isFetching} />;

  const { card, policy, blockedCategories } = data;
  return (
    <>
      <ScreenHeader title="Card & policy" subtitle={`${card.dependentName}'s card and the rules it follows.`} />
      <VirtualCard holderName={card.dependentName} last4={card.last4} data-testid="card-dependent-card" />
      <CardFacts card={card} />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <ChainBadge status={chainStatusOf(card.chain)} />
        <PillButton size="sm" variant="outline" disabled icon={<Snowflake className="size-4" aria-hidden="true" />} data-testid="button-freeze-card">
          Freeze card
        </PillButton>
      </div>
      <ComingSoonNote className="mt-2 justify-end">Freezing arrives in a later step of the demo.</ComingSoonNote>

      <section className="mt-8" aria-labelledby="policy-title">
        <SectionTitle>
          <span id="policy-title">Current policy</span>
        </SectionTitle>
        <PolicyCard
          title={policy.presetName}
          lines={policy.lines}
          footer={
            <div className="flex flex-col gap-2">
              <PillButton size="sm" variant="tint" block disabled icon={<Sparkles className="size-4" aria-hidden="true" />} data-testid="button-policy-builder">
                Describe new rules in plain English
              </PillButton>
              <ComingSoonNote className="justify-center">The policy builder arrives in a later step of the demo.</ComingSoonNote>
            </div>
          }
        />
      </section>

      <section className="mt-8" aria-labelledby="blocked-title">
        <SectionTitle>
          <span id="blocked-title">Always declined</span>
        </SectionTitle>
        <div className="rounded-card-sm bg-surface-alt p-4">
          <ul className="flex flex-wrap gap-2" data-testid="list-blocked-categories">
            {blockedCategories.map((c) => (
              <li key={c.category}>
                <Tag tone="rejected">
                  <Ban className="mr-1 size-3.5" aria-hidden="true" />
                  {c.label}
                </Tag>
              </li>
            ))}
          </ul>
          <p className="type-caption mt-3 text-ink-muted">The card declines these merchant types, whatever the amount.</p>
        </div>
      </section>
    </>
  );
}
