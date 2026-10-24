import { ChevronRight, Hand } from 'lucide-react';
import { Link } from 'wouter';
import { useGetFamily, useGetParentOverview, useListActivity } from '@workspace/api-client-react';
import { HeroBalanceCard } from '@/components/trellis/hero-balance-card';
import { InitialAvatar, SectionTitle } from '@/components/trellis/primitives';
import { ActivityRowSkeleton, BucketCardSkeleton, HeroBalanceCardSkeleton, LoadingRegion, Skeleton } from '@/components/trellis/skeletons';
import { ErrorState } from '@/components/trellis/states';
import { FamilyActivityRow } from '@/features/family/FamilyActivityRow';
import { FamilyBucketCard } from '@/features/family/FamilyBucketCard';
import { ScreenHeader } from '@/features/shell/layout';

function MemberAvatars({ names }: { names: string[] }) {
  return (
    <ul className="flex items-center" aria-label="Family members">
      {names.map((n, i) => (
        <li key={n} className={i > 0 ? '-ml-2' : undefined}>
          <InitialAvatar name={n} className="size-9 bg-surface text-[13px] ring-2 ring-signature" />
          <span className="sr-only">{n}</span>
        </li>
      ))}
    </ul>
  );
}

function ApprovalsLink({ count }: { count: number }) {
  return (
    <Link
      href="/parent/approvals"
      className="flex items-center gap-3 rounded-card-sm bg-surface-alt p-4 transition-colors hover:bg-tint"
      data-testid="link-pending-approvals"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-pending-bg text-pending">
        <Hand className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="type-link-sm block">Approvals</span>
        <span className="type-caption block text-ink-muted">
          {count === 0 ? 'Nothing waiting for you' : `${count} waiting for your OK`}
        </span>
      </span>
      <span
        className={
          count > 0
            ? 'grid min-w-7 place-items-center rounded-pill bg-rejected px-2 text-[13px] font-bold leading-7 text-surface tnum'
            : 'grid min-w-7 place-items-center rounded-pill bg-surface px-2 text-[13px] font-bold leading-7 text-ink-muted tnum'
        }
        data-testid="badge-pending-approvals"
      >
        {count}
      </span>
      <ChevronRight className="size-5 text-ink-muted" aria-hidden="true" />
    </Link>
  );
}

export default function ParentHome() {
  const overview = useGetParentOverview();
  const activity = useListActivity();
  const family = useGetFamily();

  if (overview.isLoading) {
    return (
      <LoadingRegion label="Loading the family pot" className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <HeroBalanceCardSkeleton className="bg-surface-alt" />
        <Skeleton className="h-[72px] rounded-card-sm" />
        <BucketCardSkeleton />
        <BucketCardSkeleton />
      </LoadingRegion>
    );
  }
  if (overview.isError || !overview.data) {
    return <ErrorState onRetry={() => overview.refetch()} retrying={overview.isFetching} />;
  }

  const o = overview.data;
  const recent = activity.data?.slice(0, 3) ?? [];
  const members = family.data?.members.map((m) => m.displayName) ?? [];
  return (
    <>
      <ScreenHeader title={`Hi, ${o.parentName}`} subtitle={o.familyName} />
      <HeroBalanceCard
        eyebrow="Family pot"
        amountCents={o.potTotalCents}
        caption={`Across ${o.buckets.length} ${o.buckets.length === 1 ? 'bucket' : 'buckets'} · test dollars`}
        data-testid="card-family-pot"
      >
        {members.length > 0 && <MemberAvatars names={members} />}
      </HeroBalanceCard>
      <div className="mt-4">
        <ApprovalsLink count={o.pendingApprovalsCount} />
      </div>

      <section className="mt-8" aria-labelledby="buckets-title">
        <SectionTitle>
          <span id="buckets-title">Buckets</span>
        </SectionTitle>
        <div className="flex flex-col gap-3">
          {o.buckets.map((b) => (
            <FamilyBucketCard key={b.id} bucket={b} />
          ))}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="recent-title">
        <SectionTitle
          action={
            <Link href="/parent/activity" className="type-link-sm text-primary" data-testid="link-see-all-activity">
              See all
            </Link>
          }
        >
          <span id="recent-title">Recent activity</span>
        </SectionTitle>
        {activity.isLoading ? (
          <LoadingRegion label="Loading recent activity">
            <ul className="flex flex-col divide-y">
              <ActivityRowSkeleton />
              <ActivityRowSkeleton />
            </ul>
          </LoadingRegion>
        ) : activity.isError ? (
          <ErrorState onRetry={() => activity.refetch()} retrying={activity.isFetching} />
        ) : recent.length === 0 ? (
          <p className="type-caption px-1 text-ink-muted">No activity yet.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {recent.map((a) => (
              <FamilyActivityRow key={a.id} item={a} compact />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
