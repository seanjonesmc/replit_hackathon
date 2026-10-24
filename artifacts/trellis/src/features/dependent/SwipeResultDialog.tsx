import { useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { BRAND } from '@brand/brand.config';
import { useGetAuthorization, type AuthorizationThread, type SwipeResult } from '@workspace/api-client-react';
import { DecisionResultCard } from '@/components/trellis/decision-result-card';
import { DECIDED_BY, DECISION, refreshAfterSwipe } from '@/features/family/spending';
import { chainStatusOf } from '@/lib/chain';
import { formatClock } from '@/lib/swipe-presets';

/** How often a pending result checks for the parent's answer. */
export const ANSWER_POLL_MS = 1000;

/** A decision the API returned, with what was swiped. */
export interface ShownSwipe {
  result: SwipeResult;
  merchantName: string;
  amountCents: number;
  /** Family-clock time ("HH:MM") the swipe was simulated at, if set. */
  clock?: string;
  /** When the answer arrived. */
  decidedAt: Date;
}

/** True once a parent has answered and, after an approval, the retry is in. */
export function isAnswered(thread: AuthorizationThread | undefined): thread is AuthorizationThread {
  const status = thread?.authorization.status;
  return status === 'parent_declined' || (status === 'parent_approved' && thread?.retry != null);
}

/**
 * The full-screen decision result over the app shell, filling the phone
 * column. Done (or Escape) returns to the grid with focus on the tile.
 */
export function SwipeResultDialog({ shown, onClose }: { shown: ShownSwipe | null; onClose: () => void }) {
  return (
    <DialogPrimitive.Root open={shown !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-surface-alt" />
        <DialogPrimitive.Content
          className="pt-safe pb-safe fixed inset-0 z-50 mx-auto flex w-full max-w-phone flex-col bg-surface outline-none md:border-x"
          aria-describedby={undefined}
          data-testid="dialog-swipe-result"
        >
          {shown && (
            <>
              <DialogPrimitive.Title className="sr-only">Your swipe at {shown.merchantName}</DialogPrimitive.Title>
              <ResultCard shown={shown} onDone={onClose} />
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function ResultCard({ shown, onDone }: { shown: ShownSwipe; onDone: () => void }) {
  const { result, merchantName, amountCents, clock, decidedAt } = shown;
  const queryClient = useQueryClient();
  const parent = BRAND.demo.parent;
  const swipedNote = clock ? `swiped at ${formatClock(clock)}` : undefined;
  const asking = result.decision === 'PENDING';

  // A pending swipe is already in the parent's approvals: check for the
  // answer every second until it arrives, then stop.
  const thread = useGetAuthorization(result.authorizationId, {
    query: {
      enabled: asking,
      refetchInterval: (query) => (isAnswered(query.state.data) ? false : ANSWER_POLL_MS),
    },
  });
  const answered = asking && isAnswered(thread.data);

  // Once answered, the feed and balances on screen catch up too.
  useEffect(() => {
    if (answered) void refreshAfterSwipe(queryClient);
  }, [answered, queryClient]);

  // Every answer reuses the pending card (same key): it changes in place,
  // fading to the new decision instead of jumping to a fresh screen.
  const common = { merchant: merchantName, amountCents, titleAs: 'h2' as const, onDone };

  if (answered && thread.data) {
    const { authorization: original, retry } = thread.data;
    if (original.status === 'parent_declined' || !retry) {
      return (
        <DecisionResultCard
          key={result.authorizationId}
          {...common}
          decision="rejected"
          label="Parent declined"
          swipeNote={swipedNote}
          reason={`${parent} said no to this one, so nothing was charged.`}
          reasonCode="parent_declined"
          decidedAt={original.resolvedAt ? new Date(original.resolvedAt) : new Date()}
          chain={chainStatusOf(original.resolveChain)}
          ask="hidden"
        />
      );
    }
    return (
      <DecisionResultCard
        key={result.authorizationId}
        {...common}
        decision={DECISION[retry.decision]}
        bucket={retry.bucketName ?? undefined}
        swipeNote={`tried again after ${parent} said yes`}
        reason={retry.reason}
        reasonCode={retry.reasonCode}
        decidedBy={DECIDED_BY[retry.decidedBy]}
        aiConfidence={retry.aiConfidence}
        decisionMs={retry.decisionMs}
        decidedAt={new Date(retry.createdAt)}
        chain={chainStatusOf(retry.chain)}
        ask="hidden"
        footer={retry.decision === 'APPROVED' ? <HeldNote /> : undefined}
      />
    );
  }

  return (
    <DecisionResultCard
      key={result.authorizationId}
      {...common}
      decision={DECISION[result.decision]}
      bucket={result.bucketName ?? undefined}
      swipeNote={swipedNote}
      reason={result.reason}
      reasonCode={result.reasonCode}
      decidedBy={DECIDED_BY[result.decidedBy]}
      aiConfidence={result.aiConfidence}
      decisionMs={result.decisionMs}
      trace={result.trace}
      decidedAt={decidedAt}
      chain={chainStatusOf(result.chain)}
      ask={asking ? 'sent' : 'hidden'}
      askedName={parent}
      footer={
        asking ? (
          <div className="flex flex-col items-center gap-1 text-center" aria-live="polite">
            <p className="type-caption text-ink-muted" data-testid="text-waiting-approval">
              It's waiting in {parent}'s approvals. This screen updates as soon as {parent} answers.
            </p>
            {thread.isError && (
              <p className="type-caption text-rejected" data-testid="text-answer-check-error">
                Can't check for an answer right now. Still trying.
              </p>
            )}
          </div>
        ) : result.decision === 'APPROVED' ? (
          <HeldNote />
        ) : undefined
      }
    />
  );
}

/** Approvals only hold the money; it's paid at settlement. */
function HeldNote() {
  return (
    <p className="type-caption text-center text-ink-muted" data-testid="text-held-note">
      Approved and held. Nothing is paid until settlement.
    </p>
  );
}
