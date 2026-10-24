import { type ReactNode } from 'react';
import { ArrowDownLeft, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatSignedCents } from '@/lib/format';
import type { ChainStatus, Decision } from '@/lib/domain';
import { ChainBadge, InitialAvatar, StatusPill, Tag } from './primitives';

/** Money put into a bucket: no decision was needed. */
function AddedPill() {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-pill bg-approved-bg px-3 text-[13px] font-semibold text-approved" data-testid="status-added">
      <ArrowDownLeft className="size-4" strokeWidth={2.4} aria-hidden="true" />
      Added
    </span>
  );
}

/** A purchase whose held money was paid out at settlement. */
function SettledPill() {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-pill bg-approved-bg px-3 text-[13px] font-semibold text-approved" data-testid="status-settled">
      <CheckCheck className="size-4" strokeWidth={2.4} aria-hidden="true" />
      Settled
    </span>
  );
}

/** What the row's money stage reads as, after its pill. */
const STAGE_NOTE = {
  held: 'held, not paid yet',
  settled: 'paid to card issuer',
} as const;

interface ActivityRowProps {
  /** Person the row is about; shown as an initial avatar. */
  who: string;
  /** One plain-English sentence describing what happened. */
  sentence: string;
  /** Signed cents: negative for spending, positive for money added. */
  amountCents: number;
  /** A purchase decision, or `added` for money put into a bucket. */
  status: Decision | 'added';
  /** Optional second line, e.g. the reason for a decision. */
  detail?: ReactNode;
  when: string;
  bucket?: string;
  /** Optional step trail, e.g. Pending -> Approved -> Settled. */
  steps?: { label: string }[];
  /**
   * An approved purchase's money: `held` (approved, not paid yet) or
   * `settled` (paid out to the card issuer at settlement).
   */
  stage?: 'held' | 'settled';
  /** Chain status. Never pass verified without a real explorer link. */
  chain?: ChainStatus;
  /** The settlement's chain status (the vault repaying the card issuer). */
  captureChain?: ChainStatus;
  className?: string;
  'data-testid'?: string;
}

/**
 * One row in an activity feed. Renders an <li>; place it inside a <ul>.
 * Declined amounts are struck through because no money moved.
 */
export function ActivityRow({ who, sentence, amountCents, status, detail, when, bucket, steps, stage, chain, captureChain, className, 'data-testid': testId }: ActivityRowProps) {
  return (
    <li className={cn('flex gap-3 py-4', className)} data-testid={testId}>
      <InitialAvatar name={who} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="type-body-sm min-w-0">{sentence}</p>
          <span
            className={cn(
              'type-link-sm tnum shrink-0',
              status === 'rejected' && 'text-ink-muted line-through',
              status === 'pending' && 'text-ink-muted',
            )}
          >
            {formatSignedCents(amountCents)}
          </span>
        </div>
        {detail && <p className="type-caption mt-1 text-ink-muted">{detail}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {status === 'added' ? <AddedPill /> : stage === 'settled' ? <SettledPill /> : <StatusPill status={status} />}
          {stage && (
            <span className={cn('type-caption', stage === 'held' ? 'font-semibold text-pending' : 'text-ink-muted')} data-testid={`text-stage-${stage}`}>
              · {STAGE_NOTE[stage]}
            </span>
          )}
          {bucket && <Tag tone="neutral">{bucket}</Tag>}
          <span className="type-caption text-ink-muted">{when}</span>
        </div>
        {steps && steps.length > 0 && (
          <ol className="type-caption mt-2 flex flex-wrap items-center gap-2 text-ink-muted" aria-label="Decision steps">
            {steps.map((s, i) => (
              <li key={i} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden="true">→</span>}
                {s.label}
              </li>
            ))}
          </ol>
        )}
        {(chain || captureChain) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {chain && <ChainBadge status={chain} />}
            {captureChain && (
              <span className="type-caption flex items-center gap-1.5 text-ink-muted">
                Issuer repaid <ChainBadge status={captureChain} />
              </span>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
