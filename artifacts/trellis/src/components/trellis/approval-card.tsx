import { AlertCircle, Check, X } from 'lucide-react';
import type { Authorization } from '@workspace/api-client-react';
import { formatCents, formatWhen } from '@/lib/format';
import { ComingSoonNote } from './states';
import { InitialAvatar, PillButton, StatusPill, Tag } from './primitives';

export type ApprovalAnswer = 'approve' | 'decline';

interface ApprovalCardProps {
  request: Authorization;
  /** Who swiped, e.g. the dependent's display name. */
  dependentName: string;
  now?: Date;
  /**
   * Sends the parent's answer. Without it (previews) both buttons stay
   * disabled with a note saying why.
   */
  onAnswer?: (answer: ApprovalAnswer) => void;
  /** The answer being sent, if any: that button spins and both are locked. */
  sending?: ApprovalAnswer | null;
  /** Why the last answer didn't go through. */
  error?: string | null;
}

/** One swipe waiting for a parent's OK, with Approve and Decline. */
export function ApprovalCard({ request: r, dependentName, now, onAnswer, sending = null, error }: ApprovalCardProps) {
  const locked = !onAnswer || sending !== null;
  return (
    <article className="rounded-card-sm border bg-surface p-4" data-testid={`card-approval-${r.id}`} aria-busy={sending !== null || undefined}>
      <div className="flex items-start gap-3">
        <InitialAvatar name={dependentName} className="bg-surface-alt" />
        <div className="min-w-0 flex-1">
          <p className="type-body-sm">
            {dependentName} wants to spend <span className="tnum font-semibold">{formatCents(r.amountCents)}</span> at {r.merchantName}
          </p>
          <p className="type-caption mt-1 text-ink-muted">{r.reason}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusPill status="pending" />
            {r.bucketName && <Tag tone="neutral">{r.bucketName}</Tag>}
            <span className="type-caption text-ink-muted">{formatWhen(r.swipedAt, now)}</span>
          </div>
          {r.items.length > 0 && <p className="type-caption mt-2 text-ink-muted">Items: {r.items.join(', ')}</p>}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <PillButton
          size="sm"
          disabled={locked && sending !== 'approve'}
          loading={sending === 'approve'}
          icon={<Check className="size-4" aria-hidden="true" />}
          onClick={() => onAnswer?.('approve')}
          data-testid={`button-approve-${r.id}`}
        >
          Approve
        </PillButton>
        <PillButton
          size="sm"
          variant="outline"
          disabled={locked && sending !== 'decline'}
          loading={sending === 'decline'}
          icon={<X className="size-4" aria-hidden="true" />}
          onClick={() => onAnswer?.('decline')}
          data-testid={`button-decline-${r.id}`}
        >
          Decline
        </PillButton>
      </div>
      {error && (
        <p role="alert" className="type-caption mt-2 flex items-center justify-center gap-1.5 text-center text-rejected" data-testid={`text-approval-error-${r.id}`}>
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {!onAnswer && <ComingSoonNote className="mt-2 justify-center">Approving and declining work in the live app.</ComingSoonNote>}
    </article>
  );
}
