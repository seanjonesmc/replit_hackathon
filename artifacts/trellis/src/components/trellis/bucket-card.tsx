import { BookOpen, Bus, Sparkles, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCents } from '@/lib/format';
import type { BucketIcon } from '@/lib/domain';

export const bucketIcons: Record<BucketIcon, LucideIcon> = {
  food: UtensilsCrossed,
  school: BookOpen,
  social: Sparkles,
  transit: Bus,
};

interface BucketCardProps {
  name: string;
  icon: BucketIcon;
  availableCents: number;
  totalCents: number;
  /** Money reserved by pending requests. */
  heldCents?: number;
  purpose?: string;
  fundedBy?: string;
  className?: string;
  'data-testid'?: string;
}

/** A spending bucket: what's left, a progress bar, and who funds it. */
export function BucketCard({ name, icon, availableCents, totalCents, heldCents = 0, purpose, fundedBy, className, 'data-testid': testId }: BucketCardProps) {
  const Icon = bucketIcons[icon];
  const pct = totalCents > 0 ? Math.max(0, Math.min(100, Math.round((availableCents / totalCents) * 100))) : 0;
  const details = [purpose, fundedBy && `Funded by ${fundedBy}`].filter(Boolean).join(' · ');

  return (
    <article className={cn('min-w-0 rounded-card-sm border bg-surface p-5', className)} data-testid={testId}>
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-tint text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="type-link-md truncate">{name}</h3>
          {details && <p className="type-caption truncate text-ink-muted">{details}</p>}
        </div>
      </div>
      <p className="mt-4 flex items-baseline justify-between gap-2">
        <span className="type-title tnum">{formatCents(availableCents)} left</span>
        <span className="type-caption tnum text-ink-muted">of {formatCents(totalCents)}</span>
      </p>
      <div
        className="mt-2 h-2 overflow-hidden rounded-pill bg-surface-alt"
        role="img"
        aria-label={`${pct}% of the ${name} bucket available`}
      >
        <div className="h-full rounded-pill bg-primary" style={{ width: `${pct}%` }} />
      </div>
      {heldCents > 0 && (
        <p className="type-caption tnum mt-2 text-pending">{formatCents(heldCents)} on hold for a pending request</p>
      )}
    </article>
  );
}
