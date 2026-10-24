import { useState } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { useGetFamily, useResetDemo } from '@workspace/api-client-react';
import { PillButton } from '@/components/trellis/primitives';
import { apiErrorMessage } from '@/features/family/spending';

/** Shown in the confirm step and under the button: what a reset does and doesn't undo. */
export const RESET_CHAIN_NOTE =
  "Transactions already sent to Monad stay on chain. The reset clears the app's records only, so links to earlier runs stop showing.";

/**
 * The presenter's "Reset demo" in parent settings. After a confirm step it
 * puts the family back where the demo script starts (nothing sent today, no
 * groceries bought, nothing held), then drops every cached screen so each
 * one reloads from the fresh seed (every row id changes).
 */
export function DemoResetControl() {
  const queryClient = useQueryClient();
  const family = useGetFamily();
  const reset = useResetDemo();
  const [open, setOpen] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const parentId = family.data?.members.find((m) => m.role === 'parent')?.id;

  const confirm = () => {
    if (parentId === undefined) return;
    setFailure(null);
    setDone(false);
    reset.mutate(
      { data: { memberId: parentId } },
      {
        onSuccess: () => {
          setOpen(false);
          setDone(true);
          // Ids all changed: clear every cached screen; ones on view refetch now.
          void queryClient.resetQueries();
        },
        onError: (error) => {
          setOpen(false);
          setFailure(apiErrorMessage(error, "The demo couldn't be reset. Try again."));
        },
      },
    );
  };

  return (
    <div data-testid="card-demo-reset">
      <AlertDialog.Root open={open} onOpenChange={(next) => !reset.isPending && setOpen(next)}>
        <AlertDialog.Trigger asChild>
          <PillButton
            variant="outline"
            block
            disabled={parentId === undefined}
            loading={reset.isPending}
            icon={<RotateCcw className="size-4" aria-hidden="true" />}
            data-testid="button-reset-demo"
          >
            Reset demo
          </PillButton>
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-ink/40" />
          <AlertDialog.Content
            className="fixed inset-x-4 top-1/2 z-50 mx-auto w-auto max-w-[calc(var(--container-phone)-2rem)] -translate-y-1/2 rounded-card-sm border bg-surface p-5 outline-none"
            data-testid="dialog-reset-demo"
          >
            <AlertDialog.Title className="type-title font-heading text-ink">Reset the demo?</AlertDialog.Title>
            <AlertDialog.Description asChild>
              <div className="type-body-sm mt-2 flex flex-col gap-2 text-ink-muted">
                <p>
                  The family goes back to where the demo script starts: no money sent today, no groceries bought and nothing held. Money sent,
                  purchases, approvals, settlements and rule changes from earlier runs are cleared.
                </p>
                <p data-testid="text-reset-chain-note">{RESET_CHAIN_NOTE}</p>
              </div>
            </AlertDialog.Description>
            <div className="mt-5 flex flex-col gap-2">
              <PillButton
                block
                loading={reset.isPending}
                icon={<RotateCcw className="size-4" aria-hidden="true" />}
                onClick={confirm}
                data-testid="button-confirm-reset"
              >
                Reset demo
              </PillButton>
              <AlertDialog.Cancel asChild>
                <PillButton block variant="outline" disabled={reset.isPending} data-testid="button-cancel-reset">
                  Cancel
                </PillButton>
              </AlertDialog.Cancel>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      {done ? (
        <p role="status" className="type-caption mt-2 flex items-center justify-center gap-1.5 text-approved" data-testid="text-reset-done">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          Demo reset. Ready to run the script from the start.
        </p>
      ) : (
        <p className="type-caption mt-2 text-center text-ink-muted" data-testid="text-reset-hint">
          Starts the script over. Nothing on chain is undone.
        </p>
      )}
      {failure && (
        <p role="alert" className="type-caption mt-1 flex items-center justify-center gap-1.5 text-rejected" data-testid="text-reset-error">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {failure}
        </p>
      )}
    </div>
  );
}
