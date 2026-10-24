import { Zap } from 'lucide-react';
import { useGetDependentWallet } from '@workspace/api-client-react';
import { HeroBalanceCard } from '@/components/trellis/hero-balance-card';
import { PillButton, SectionTitle } from '@/components/trellis/primitives';
import { BucketCardSkeleton, HeroBalanceCardSkeleton, LoadingRegion, Skeleton } from '@/components/trellis/skeletons';
import { ComingSoonNote, ErrorState } from '@/components/trellis/states';
import { VirtualCard } from '@/components/trellis/virtual-card';
import { CardFacts } from '@/features/family/CardFacts';
import { FamilyBucketCard } from '@/features/family/FamilyBucketCard';
import { ScreenHeader } from '@/features/shell/layout';

export default function DependentWallet() {
  const { data, isLoading, isError, refetch, isFetching } = useGetDependentWallet();
  if (isLoading) {
    return (
      <LoadingRegion label="Loading your wallet" className="flex flex-col gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="aspect-[1.586] w-full rounded-card" />
        <HeroBalanceCardSkeleton className="bg-surface-alt" />
        <BucketCardSkeleton />
      </LoadingRegion>
    );
  }
  if (isError || !data) return <ErrorState onRetry={() => refetch()} retrying={isFetching} />;

  return (
    <>
      <ScreenHeader title={`Hi, ${data.dependent.displayName}`} subtitle="Your card and what you can spend." />
      <VirtualCard holderName={data.card.dependentName} last4={data.card.last4} data-testid="card-dependent-card" />
      <CardFacts card={data.card} />
      <HeroBalanceCard
        className="mt-4"
        eyebrow="You can spend"
        amountCents={data.totalAvailableCents}
        caption={`Across ${data.buckets.length} ${data.buckets.length === 1 ? 'bucket' : 'buckets'} · test dollars`}
        data-testid="card-wallet-balance"
      />
      <section className="mt-8" aria-labelledby="wallet-buckets-title">
        <SectionTitle>
          <span id="wallet-buckets-title">By bucket</span>
        </SectionTitle>
        <div className="flex flex-col gap-3">
          {data.buckets.map((b) => (
            <FamilyBucketCard key={b.id} bucket={b} variant="wallet" />
          ))}
        </div>
      </section>
      <div className="mt-8 flex flex-col gap-2">
        <PillButton block disabled icon={<Zap className="size-5" aria-hidden="true" />} data-testid="button-swipe">
          Swipe card
        </PillButton>
        <ComingSoonNote className="justify-center">Trying a purchase arrives in the next step of the demo.</ComingSoonNote>
      </div>
    </>
  );
}
