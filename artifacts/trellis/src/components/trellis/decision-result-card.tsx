import { useId, type ReactNode } from 'react';
import { CheckCircle2, Clock, Lock, MinusCircle, XCircle, type LucideIcon } from 'lucide-react';
import { BRAND } from '@brand/brand.config';
import { cn } from '@/lib/utils';
import { formatCents, formatDecisionTime, formatDurationMs } from '@/lib/format';
import type { ChainStatus, DecidedBy, Decision } from '@/lib/domain';
import { motion } from './motion';
import { ChainBadge, PillButton, decisionMeta } from './primitives';

/** One step of what happened during the swipe, in plain words. */
export interface DecisionTraceStep {
  label: string;
  state: 'done' | 'held' | 'skipped' | 'approved' | 'rejected' | 'pending';
}

const traceIcon: Record<DecisionTraceStep['state'], { Icon: LucideIcon; cls: string }> = {
  done: { Icon: CheckCircle2, cls: 'text-ink-muted' },
  held: { Icon: Lock, cls: 'text-pending' },
  skipped: { Icon: MinusCircle, cls: 'text-ink-muted' },
  approved: { Icon: CheckCircle2, cls: 'text-approved' },
  rejected: { Icon: XCircle, cls: 'text-rejected' },
  pending: { Icon: Clock, cls: 'text-pending' },
};

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
  /** Extra detail after the merchant, e.g. "swiped at 2:10am". */
  swipeNote?: string;
  /** What decided it. Omit when unknown (preview samples). */
  decidedBy?: DecidedBy;
  /** The AI guard's confidence (0–1), shown when the AI guard decided. */
  aiConfidence?: number | null;
  /** Measured decision time. Omit when it wasn't measured; never invent one. */
  decisionMs?: number | null;
  /** What happened, in order: the card network's ask, the checks, the hold, the decision. */
  trace?: DecisionTraceStep[];
  /**
   * Shown for declined and pending decisions only. Without a handler the
   * button stays visible but disabled (explain why in `footer`).
   */
  onAskParent?: () => void;
  onDone?: () => void;
  /** Extra content under the actions, e.g. a live status message. */
  footer?: ReactNode;
  titleAs?: 'h1' | 'h2' | 'h3' | 'h4';
  className?: string;
}

const decidedByLabel: Record<DecidedBy, string> = {
  rule: 'Rule',
  ai_guard: 'AI guard',
};

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
  swipeNote,
  decidedBy,
  aiConfidence,
  decisionMs,
  trace,
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
          {swipeNote && <> · {swipeNote}</>}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <p className="type-body-md" data-testid="text-decision-reason">{reason}</p>
          <p className="type-caption mt-1 text-ink-muted">
            Reason code: <code className="font-mono tnum" data-testid="text-reason-code">{reasonCode}</code>
          </p>
        </div>

        {trace && trace.length > 0 && (
          <div>
            <h3 className="type-caption font-semibold text-ink-muted">What happened</h3>
            <ol className="mt-2 flex flex-col gap-2" aria-label="What happened" data-testid="list-decision-trace">
              {trace.map((step, i) => {
                const { Icon, cls } = traceIcon[step.state];
                return (
                  <li key={i} className="flex items-start gap-2" data-testid={`trace-step-${i + 1}`}>
                    <Icon className={cn('mt-0.5 size-4 shrink-0', cls)} strokeWidth={2.4} aria-hidden="true" />
                    <span className={cn('type-body-sm', step.state === 'held' && 'font-semibold')}>{step.label}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        <dl className="flex flex-col divide-y border-y">
          {decidedBy && (
            <div className="flex items-center justify-between gap-3 py-3">
              <dt className="type-caption text-ink-muted">Decided by</dt>
              <dd className="type-caption text-right font-semibold" data-testid="text-decided-by">
                {decidedByLabel[decidedBy]}
                {decidedBy === 'ai_guard' && aiConfidence != null && (
                  <span className="tnum font-normal text-ink-muted"> · {Math.round(aiConfidence * 100)}% sure</span>
                )}
              </dd>
            </div>
          )}
          {decisionMs != null && (
            <div className="flex items-center justify-between gap-3 py-3">
              <dt className="type-caption text-ink-muted">Decision time</dt>
              <dd className="type-caption tnum text-right font-semibold" data-testid="text-decision-ms">
                {formatDurationMs(decisionMs)}
              </dd>
            </div>
          )}
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
            <PillButton block onClick={onAskParent} disabled={!onAskParent} data-testid="button-ask-parent">
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
