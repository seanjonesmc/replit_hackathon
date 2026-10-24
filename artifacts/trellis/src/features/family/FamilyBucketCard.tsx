import type { BucketSummary } from '@workspace/api-client-react';
import { BucketCard } from '@/components/trellis/bucket-card';
import { formatCents } from '@/lib/format';

interface FamilyBucketCardProps {
  bucket: BucketSummary;
  /** `parent`: this week's spending; `wallet`: the rules the dependent spends under. */
  variant?: 'parent' | 'wallet';
}

/** A bucket from the API on the shared bucket card. */
export function FamilyBucketCard({ bucket: b, variant = 'parent' }: FamilyBucketCardProps) {
  return (
    <BucketCard
      name={b.name}
      icon={b.icon}
      availableCents={b.availableCents}
      totalCents={b.fundedCents}
      heldCents={b.heldCents}
      purpose={b.purpose ?? undefined}
      fundedBy={b.funderNames.length > 0 ? b.funderNames.join(' & ') : undefined}
      data-testid={`card-bucket-${b.id}`}
    >
      {variant === 'parent' ? (
        <p className="type-caption tnum mt-2 text-ink-muted" data-testid={`text-bucket-week-${b.id}`}>
          {formatCents(b.spentThisWeekCents)} spent this week
        </p>
      ) : (
        <p className="type-caption mt-2 text-ink-muted">
          Up to <span className="tnum font-semibold text-ink">{formatCents(b.perPurchaseLimitCents)}</span> a purchase · ask first over{' '}
          <span className="tnum font-semibold text-ink">{formatCents(b.approvalThresholdCents)}</span>
        </p>
      )}
    </BucketCard>
  );
}
