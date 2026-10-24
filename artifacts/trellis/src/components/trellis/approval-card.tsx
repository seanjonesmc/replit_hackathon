import type { Authorization } from '@workspace/api-client-react';
import { formatCents, formatWhen } from '@/lib/format';
import { ComingSoonNote } from './states';
import { InitialAvatar, PillButton, StatusPill, Tag } from './primitives';

interface ApprovalCardProps {
  request: Authorization;
  /** Who swiped, e.g. the dependent's display name. */
  dependentName: string;
  now?: Date;
}

/** One swipe waiting for a parent's OK. Approving and declining arrive in a later step. */
export function ApprovalCard({ request: r, dependentName, now }: ApprovalCardProps) {
  return (
    <article className="rounded-card-sm border bg-surface p-4" data-testid={`card-approval-${r.id}`}>
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
        <PillButton size="sm" disabled data-testid={`button-approve-${r.id}`}>Approve</PillButton>
        <PillButton size="sm" variant="outline" disabled data-testid={`button-decline-${r.id}`}>Decline</PillButton>
      </div>
      <ComingSoonNote className="mt-2 justify-center">Approving and declining arrive in the next step of the demo.</ComingSoonNote>
    </article>
  );
}
