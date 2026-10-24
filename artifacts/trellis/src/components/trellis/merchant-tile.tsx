import { Clock, Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCents } from '@/lib/format';
import { motion } from './motion';

interface MerchantTileProps {
  name: string;
  /** Plain category, e.g. "bar"; shown capitalized with the MCC. */
  category: string;
  mcc: string;
  /** The purchase this tile sends. Null when the simulator has none for it. */
  amountCents: number | null;
  /** When the swipe is simulated, if not now, e.g. "at 2:10am". */
  timeNote?: string;
  icon: LucideIcon;
  /** This tile's swipe is in flight; taps are ignored but focus stays put. */
  loading?: boolean;
  disabled?: boolean;
  onSwipe?: () => void;
  className?: string;
  'data-testid'?: string;
}

const capitalize = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

/**
 * One merchant in the swipe simulator's grid: name, category with MCC, and
 * the price. Tapping it swipes the card there; the server decides.
 */
export function MerchantTile({ name, category, mcc, amountCents, timeNote, icon: Icon, loading, disabled, onSwipe, className, 'data-testid': testId }: MerchantTileProps) {
  const unavailable = amountCents === null;
  const label =
    amountCents === null
      ? `${name}: no sample purchase`
      : `Swipe at ${name} for ${formatCents(amountCents)}${timeNote ? `, ${timeNote}` : ''}`;
  return (
    <button
      type="button"
      onClick={loading ? undefined : onSwipe}
      disabled={disabled || unavailable}
      aria-busy={loading || undefined}
      aria-label={label}
      className={cn(
        'flex min-h-[148px] flex-col items-start gap-3 rounded-card-sm border bg-surface p-4 text-left',
        motion.press,
        'hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'disabled:pointer-events-none',
        (disabled || unavailable) && 'opacity-40',
        className,
      )}
      data-testid={testId}
    >
      <span className="grid size-10 place-items-center rounded-full bg-surface-alt text-ink">
        {loading ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Icon className="size-5" aria-hidden="true" />}
      </span>
      <span className="flex w-full min-w-0 flex-1 flex-col">
        <span className="type-link-sm line-clamp-2 break-words">{name}</span>
        <span className="type-caption tnum mt-0.5 text-ink-muted">
          {capitalize(category)} · MCC {mcc}
        </span>
      </span>
      <span className="flex w-full flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <span className="type-title tnum">{amountCents === null ? '—' : formatCents(amountCents)}</span>
        {timeNote && (
          <span className="type-caption inline-flex items-center gap-1 font-semibold text-ink" data-testid="text-merchant-time">
            <Clock className="size-3.5" aria-hidden="true" />
            {timeNote}
          </span>
        )}
      </span>
    </button>
  );
}
