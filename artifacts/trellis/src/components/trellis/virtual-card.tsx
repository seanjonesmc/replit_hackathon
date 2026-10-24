import { Snowflake } from 'lucide-react';
import { BRAND } from '@brand/brand.config';
import { cn } from '@/lib/utils';
import { formatExpiry } from '@/lib/format';
import { motion } from './motion';
import { LogoMark } from './primitives';

interface VirtualCardProps {
  holderName: string;
  last4: string;
  /** Card expiry, printed as "Valid thru MM/YY". */
  expiryMonth: number;
  expiryYear: number;
  /** Honest marker printed on the card art. Cards are always simulated. */
  note?: string;
  /** The card is frozen: every swipe is declined until it is unfrozen. */
  frozen?: boolean;
  /** Play the entry animation on mount. Remount (change `key`) to replay. */
  animateIn?: boolean;
  className?: string;
  'data-testid'?: string;
}

/** EMV chip with its contact pads, drawn in the BRAND chip color. */
function CardChip() {
  return (
    <svg viewBox="0 0 44 34" aria-hidden="true" className="h-[34px] w-11 shrink-0" data-testid="img-card-chip">
      <rect x="0.5" y="0.5" width="43" height="33" rx="6" fill="var(--color-card-chip)" />
      <g fill="none" stroke="var(--color-card-face-end)" strokeOpacity="0.45" strokeWidth="1">
        <path d="M0.5 11.5H14M0.5 22.5H14M30 11.5H43.5M30 22.5H43.5M22 0.5V8M22 26V33.5" />
        <rect x="14" y="8" width="16" height="18" rx="3" />
      </g>
    </svg>
  );
}

/** The contactless (tap to pay) symbol: four widening arcs. */
function ContactlessMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-7 shrink-0" data-testid="img-contactless">
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M7 9.5a4 4 0 0 1 0 5" />
        <path d="M10.5 7a8 8 0 0 1 0 10" />
        <path d="M14 4.5a12 12 0 0 1 0 15" />
        <path d="M17.5 2a16 16 0 0 1 0 20" />
      </g>
    </svg>
  );
}

/**
 * The dependent's virtual debit card art: a dark BRAND card face (never the
 * signature lime, so it reads apart from the hero balance card), EMV chip,
 * contactless symbol, masked number, holder, expiry and a "Debit" label.
 * Never shows more than the last four digits and carries no card network logo.
 */
export function VirtualCard({
  holderName,
  last4,
  expiryMonth,
  expiryYear,
  note = 'Simulated card',
  frozen,
  animateIn = true,
  className,
  'data-testid': testId,
}: VirtualCardProps) {
  const expiry = formatExpiry(expiryMonth, expiryYear);
  return (
    <figure
      className={cn(
        'card-face relative flex aspect-[1.586] w-full flex-col justify-between overflow-hidden rounded-card p-5 text-on-card-face shadow-lg shadow-ink/20 ring-1 ring-on-card-face/10 sm:p-6',
        animateIn && motion.cardIn,
        className,
      )}
      aria-label={`${note} for ${holderName}, debit card ending in ${last4}, valid thru ${expiry}${frozen ? ', frozen' : ''}`}
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-2" data-testid="text-app-name">
          <LogoMark className="size-8" />
          <span className="font-heading text-[22px] font-bold tracking-[-0.5px]">{BRAND.appName}</span>
        </span>
        <span className="rounded-tag border border-on-card-face/25 px-2 py-1 type-label" data-testid="text-card-note">
          {note}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <CardChip />
        <ContactlessMark />
      </div>

      <figcaption className="flex flex-col gap-2">
        <p className="font-mono text-[19px] font-medium tracking-[0.14em] sm:text-[21px]" data-testid="text-card-number">
          <span aria-hidden="true">•••• •••• •••• </span>
          <span className="tnum" data-testid="text-card-last4">{last4}</span>
        </p>
        <div className="flex items-end justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase leading-none tracking-[0.08em] text-on-card-face/80">
              Valid thru <span className="tnum font-mono text-[13px] tracking-normal text-on-card-face" data-testid="text-card-expiry">{expiry}</span>
            </span>
            <span className="type-link-sm min-w-0 truncate uppercase tracking-[0.06em]" data-testid="text-card-holder">
              {holderName}
            </span>
          </div>
          <span className="font-heading shrink-0 text-[20px] font-bold italic tracking-[-0.3px]" data-testid="text-card-type">
            Debit
          </span>
        </div>
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
