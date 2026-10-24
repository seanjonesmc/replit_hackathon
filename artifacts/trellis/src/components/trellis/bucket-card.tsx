import { useRef, type ReactNode } from 'react';
import { BookOpen, Bus, Sparkles, UtensilsCrossed, Wallet, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BucketIcon } from '@/lib/domain';
import { AnimatedCents } from './animated-cents';
import { motion } from './motion';

export const bucketIcons: Record<BucketIcon, LucideIcon> = {
  food: UtensilsCrossed,
  school: BookOpen,
  social: Sparkles,
  transit: Bus,
};

interface BucketCardProps {
  name: string;
  /** Falls back to a plain wallet icon when the bucket has none. */
  icon?: BucketIcon | null;
  availableCents: number;
  totalCents: number;
  /** Money held for approved purchases that haven't settled (been paid) yet. */
  heldCents?: number;
  purpose?: string;
  fundedBy?: string;
  /** Extra lines under the progress bar, e.g. weekly spend or the bucket's rules. */
  children?: ReactNode;
  className?: string;
  'data-testid'?: string;
}

/** A bucket's icon in a round tint badge. No icon falls back to a wallet. */
export function BucketIconBadge({ icon, className }: { icon?: BucketIcon | null; className?: string }) {
  const Icon = icon ? bucketIcons[icon] : Wallet;
  return (
    <span className={cn('grid size-10 shrink-0 place-items-center rounded-full bg-tint text-primary', className)}>
      <Icon className="size-5" aria-hidden="true" />
    </span>
  );
}

/**
 * A spending bucket: what's left, a progress bar, and who funds it. As money
 * moves, the amounts count to their new values, the bar eases to its new
 * width, and a held line that settles collapses away.
 */
export function BucketCard({ name, icon, availableCents, totalCents, heldCents = 0, purpose, fundedBy, children, className, 'data-testid': testId }: BucketCardProps) {
  const pct = totalCents > 0 ? Math.max(0, Math.min(100, Math.round((availableCents / totalCents) * 100))) : 0;
  const details = [purpose, fundedBy && `Funded by ${fundedBy}`].filter(Boolean).join(' · ');
  // The held line keeps its last amount while it collapses after settlement.
  const lastHeld = useRef(heldCents);
  if (heldCents > 0) lastHeld.current = heldCents;
  const held = heldCents > 0;

  return (
    <article className={cn('min-w-0 rounded-card-sm border bg-surface p-5', className)} data-testid={testId}>
      <div className="flex items-center gap-3">
        <BucketIconBadge icon={icon} />
        <div className="min-w-0 flex-1">
          <h3 className="type-link-md truncate">{name}</h3>
          {details && <p className="type-caption truncate text-ink-muted">{details}</p>}
        </div>
      </div>
      <p className="mt-4 flex items-baseline justify-between gap-2">
        <span className="type-title tnum">
          <AnimatedCents cents={availableCents} /> left
        </span>
        <span className="type-caption tnum text-ink-muted">
          of <AnimatedCents cents={totalCents} />
        </span>
      </p>
      <div
        className="mt-2 h-2 overflow-hidden rounded-pill bg-surface-alt"
        role="img"
        aria-label={`${pct}% of the ${name} bucket available`}
      >
        <div className={cn('h-full rounded-pill bg-primary', motion.barWidth)} style={{ width: `${pct}%` }} />
      </div>
      <div className={cn(motion.collapse, held ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')} aria-hidden={held ? undefined : true}>
        <div className="min-h-0 overflow-hidden">
          {lastHeld.current > 0 && (
            <p className="type-caption mt-2 flex items-baseline justify-between gap-2" data-testid={held && testId ? `${testId}-held` : undefined}>
              <span className="tnum font-semibold text-pending">
                Held <AnimatedCents cents={lastHeld.current} />
              </span>
              <span className="text-ink-muted">approved, not paid yet</span>
            </p>
          )}
        </div>
      </div>
      {children}
    </article>
  );
}
