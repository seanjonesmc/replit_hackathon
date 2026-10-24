import * as DialogPrimitive from '@radix-ui/react-dialog';
import { BRAND } from '@brand/brand.config';
import type { Merchant, SwipeResult } from '@workspace/api-client-react';
import { DecisionResultCard } from '@/components/trellis/decision-result-card';
import { ComingSoonNote } from '@/components/trellis/states';
import { DECIDED_BY, DECISION } from '@/features/family/spending';
import { chainStatusOf } from '@/lib/chain';
import { formatClock, type SwipePreset } from '@/lib/swipe-presets';

/** A decision the API returned, with what was swiped. */
export interface ShownSwipe {
  result: SwipeResult;
  merchant: Merchant;
  preset: SwipePreset;
  /** When the answer arrived. */
  decidedAt: Date;
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
              <DialogPrimitive.Title className="sr-only">Your swipe at {shown.merchant.name}</DialogPrimitive.Title>
              <ResultCard shown={shown} onDone={onClose} />
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function ResultCard({ shown, onDone }: { shown: ShownSwipe; onDone: () => void }) {
  const { result, merchant, preset, decidedAt } = shown;
  const decision = DECISION[result.decision];
  const parent = BRAND.demo.parent;
  return (
    <DecisionResultCard
      key={result.authorizationId}
      decision={decision}
      merchant={merchant.name}
      amountCents={preset.amountCents}
      bucket={result.bucketName ?? undefined}
      swipeNote={preset.clock ? `swiped at ${formatClock(preset.clock)}` : undefined}
      reason={result.reason}
      reasonCode={result.reasonCode}
      decidedBy={DECIDED_BY[result.decidedBy]}
      aiConfidence={result.aiConfidence}
      decisionMs={result.decisionMs}
      trace={result.trace}
      decidedAt={decidedAt}
      chain={chainStatusOf(result.chain)}
      titleAs="h2"
      onDone={onDone}
      footer={
        decision === 'approved' ? (
          <p className="type-caption text-center text-ink-muted" data-testid="text-held-note">
            Approved and held. Nothing is paid until settlement.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-1 text-center">
            {decision === 'pending' && (
              <p className="type-caption text-ink-muted" data-testid="text-waiting-approval">
                It's waiting in {parent}'s approvals.
              </p>
            )}
            <ComingSoonNote className="justify-center">Asking {parent} from here arrives in a later step of the demo.</ComingSoonNote>
          </div>
        )
      }
    />
  );
}
