import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body?: ReactNode;
  /** Optional next step, usually a PillButton. */
  action?: ReactNode;
  titleAs?: 'h1' | 'h2' | 'h3' | 'h4';
  className?: string;
  'data-testid'?: string;
}

/** Friendly placeholder for a list or screen with nothing in it yet. */
export function EmptyState({ icon: Icon, title, body, action, titleAs: Title = 'h3', className, 'data-testid': testId }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-10 text-center', className)} data-testid={testId}>
      <span className="grid size-14 place-items-center rounded-full bg-tint text-primary">
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <Title className="type-title mt-4">{title}</Title>
      {body && <p className="type-body-sm mt-2 max-w-xs text-ink-muted">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
