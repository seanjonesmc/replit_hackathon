import { useId, type ReactNode } from 'react';
import { BRAND } from '@brand/brand.config';
import { cn } from '@/lib/utils';
import { formatCents, formatDecisionTime } from '@/lib/format';
import type { ChainStatus, Decision } from '@/lib/domain';
import { motion } from './motion';
import { ChainBadge, PillButton, decisionMeta } from './primitives';

interface DecisionResultCardProps {
  decision: Decision;
  merchant: string;
  amountCents: number;
  /** Plain-English reason shown as the main explanation. */
  reason: string;
  /** Machine reason code, shown in small text under the reason. */
  reasonCode: string;
  decidedAt: Date;
  chain: ChainStatus;
  bucket?: string;
  /** Shown for declined and pending decisions only. */
  onAskParent?: () => void;
  onDone?: () => void;
  /** Extra content under the actions, e.g. a live status message. */
  footer?: ReactNode;
  titleAs?: 'h1' | 'h2' | 'h3' | 'h4';
  className?: string;
}

/**
 * Full-screen result of a spending decision. Fills its container; scales in
 * from 0.95 on mount (remount with a new `key` to replay).
 */
export function DecisionResultCard({
  decision,
  merchant,
  amountCents,
  reason,
  reasonCode,
  decidedAt,
  chain,
  bucket,
  onAskParent,
  onDone,
  footer,
  titleAs: Title = 'h1',
  className,
}: DecisionResultCardProps) {
  const meta = decisionMeta[decision];
  const titleId = useId();
  const canAsk = decision !== 'approved';

  return (
    <section
      className={cn('flex h-full min-h-0 flex-col overflow-y-auto bg-surface', motion.decisionIn, className)}
      aria-labelledby={titleId}
      data-testid={`card-decision-${decision}`}
    >
      <div className={cn('flex flex-col items-center px-6 pb-8 pt-10 text-center', meta.bg)}>
        <span className={cn('grid size-16 place-items-center rounded-full bg-surface', meta.fg)}>
          <meta.Icon className="size-9" strokeWidth={2.2} aria-hidden="true" />
        </span>
        <Title id={titleId} className={cn('type-display-md mt-4', meta.fg)} data-testid="text-decision-label">
          {meta.label}
        </Title>
        <p className={cn('type-display-xl tnum mt-3 text-ink', decision === 'rejected' && 'line-through decoration-2')}>
          {formatCents(amountCents)}
        </p>
        <p className="type-body-sm mt-1 text-ink-muted">
          at {merchant}
          {bucket && <> · {bucket}</>}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <p className="type-body-md" data-testid="text-decision-reason">{reason}</p>
          <p className="type-caption mt-1 text-ink-muted">
            Reason code: <code className="font-body tnum" data-testid="text-reason-code">{reasonCode}</code>
          </p>
        </div>

        <dl className="flex flex-col divide-y border-y">
          <div className="flex items-center justify-between gap-3 py-3">
            <dt className="type-caption text-ink-muted">Decided</dt>
            <dd className="type-caption tnum text-right">
              <time dateTime={decidedAt.toISOString()} data-testid="text-decision-time">{formatDecisionTime(decidedAt)}</time>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 py-3">
            <dt className="type-caption text-ink-muted">Chain</dt>
            <dd>
              <ChainBadge status={chain} />
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex flex-col gap-3">
          {canAsk && (
            <PillButton block onClick={onAskParent} data-testid="button-ask-parent">
              {BRAND.copy.askParentLabel}
            </PillButton>
          )}
          {onDone && (
            <PillButton block variant={canAsk ? 'outline' : 'primary'} onClick={onDone} data-testid="button-decision-done">
              Done
            </PillButton>
          )}
          {footer}
        </div>
      </div>
    </section>
  );
}
