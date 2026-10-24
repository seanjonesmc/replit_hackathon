import type { ReactNode } from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PillButton } from './primitives';

/** A query failed: say so plainly and offer a retry. */
export function ErrorState({ onRetry, retrying }: { onRetry: () => void; retrying?: boolean }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-card bg-rejected-bg px-6 py-8 text-center" data-testid="state-error">
      <AlertCircle className="size-6 text-rejected" aria-hidden="true" />
      <h3 className="type-link-md mt-3">Couldn't load this</h3>
      <p className="type-caption mt-1 text-ink-muted">Check your connection and try again.</p>
      <PillButton size="sm" variant="outline" className="mt-4" onClick={onRetry} loading={retrying} data-testid="button-retry">
        Try again
      </PillButton>
    </div>
  );
}

/** Caption under a disabled later-phase control, so it never looks broken or faked. */
export function ComingSoonNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('type-caption flex items-center gap-1.5 text-ink-muted', className)}>
      <Clock className="size-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
