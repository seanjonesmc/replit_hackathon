import { Snowflake } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from './motion';
import { Wordmark } from './primitives';

interface VirtualCardProps {
  holderName: string;
  last4: string;
  /** Honest marker printed on the card art. Cards are always simulated. */
  note?: string;
  /** The card is frozen: every swipe is declined until it is unfrozen. */
  frozen?: boolean;
  /** Play the entry animation on mount. Remount (change `key`) to replay. */
  animateIn?: boolean;
  className?: string;
  'data-testid'?: string;
}

/**
 * The dependent's virtual card art. Uses the signature color and the app
 * wordmark from BRAND. Never shows a full card number.
 */
export function VirtualCard({ holderName, last4, note = 'Simulated card', frozen, animateIn = true, className, 'data-testid': testId }: VirtualCardProps) {
  return (
    <figure
      className={cn(
        'lattice relative flex aspect-[1.586] w-full flex-col justify-between overflow-hidden rounded-card bg-signature p-6 text-on-signature',
        animateIn && motion.cardIn,
        className,
      )}
      aria-label={`${note} for ${holderName}, ending in ${last4}${frozen ? ', frozen' : ''}`}
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-3">
        <Wordmark onDark />
        <span className="rounded-tag bg-surface/20 px-2 py-1 type-label">{note}</span>
      </div>
      <div aria-hidden="true" className="h-8 w-11 rounded-input border border-surface/40 bg-surface/25" />
      <figcaption className="flex items-end justify-between gap-3">
        <span className="type-link-md min-w-0 truncate">{holderName}</span>
        <span className="type-link-md tnum shrink-0 tracking-[0.12em]" data-testid="text-card-last4">
          •••• {last4}
        </span>
      </figcaption>
      {frozen && (
        <div className="absolute inset-0 grid place-items-center bg-ink/45" data-testid="state-card-frozen">
          <span className="type-link-sm inline-flex h-9 items-center gap-2 rounded-pill bg-surface px-4 text-ink">
            <Snowflake className="size-4" aria-hidden="true" />
            Frozen
          </span>
        </div>
      )}
    </figure>
  );
}
