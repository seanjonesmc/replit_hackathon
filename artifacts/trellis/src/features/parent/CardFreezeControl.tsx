import { useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Snowflake, Sun } from 'lucide-react';
import { getGetCardQueryKey, useFreezeCard, useUnfreezeCard, type Card } from '@workspace/api-client-react';
import { PillButton } from '@/components/trellis/primitives';
import { apiErrorMessage, refreshAfterCardChange } from '@/features/family/spending';

/**
 * The parent's freeze switch. Freezing declines every swipe at once;
 * unfreezing restores normal decisions. Database only until the chain step.
 */
export function CardFreezeControl({ card, leading, className }: { card: Card; leading?: ReactNode; className?: string }) {
  const queryClient = useQueryClient();
  const freeze = useFreezeCard();
  const unfreeze = useUnfreezeCard();
  const [failure, setFailure] = useState<string | null>(null);
  const frozen = card.status === 'frozen';
  const activated = card.status !== 'issued';
  const busy = freeze.isPending || unfreeze.isPending;

  const toggle = () => {
    setFailure(null);
    const mutation = frozen ? unfreeze : freeze;
    mutation.mutate(undefined, {
      onSuccess: (updated) => {
        // Show the new state at once; the other card screens refetch.
        queryClient.setQueryData(getGetCardQueryKey(), updated);
        void refreshAfterCardChange(queryClient);
      },
      onError: (error) =>
        setFailure(apiErrorMessage(error, frozen ? "The card couldn't be unfrozen. Try again." : "The card couldn't be frozen. Try again.")),
    });
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {leading}
        <PillButton
          size="sm"
          variant={frozen ? 'primary' : 'outline'}
          disabled={!activated}
          loading={busy}
          icon={frozen ? <Sun className="size-4" aria-hidden="true" /> : <Snowflake className="size-4" aria-hidden="true" />}
          onClick={toggle}
          className="ml-auto"
          data-testid="button-freeze-card"
        >
          {frozen ? 'Unfreeze card' : 'Freeze card'}
        </PillButton>
      </div>
      <p className="type-caption mt-2 text-right text-ink-muted" data-testid="text-freeze-hint">
        {!activated
          ? "The card isn't active yet, so it can't be frozen."
          : frozen
            ? 'Every swipe is declined while the card is frozen.'
            : 'Freezing declines every swipe straight away.'}
      </p>
      {failure && (
        <p role="alert" className="type-caption mt-1 flex items-center justify-end gap-1.5 text-rejected" data-testid="text-freeze-error">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {failure}
        </p>
      )}
    </div>
  );
}
