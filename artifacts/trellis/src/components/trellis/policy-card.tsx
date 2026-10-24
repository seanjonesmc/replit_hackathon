import type { ReactNode } from 'react';
import { Ban, Gauge, Hand, Moon } from 'lucide-react';
import type { PolicyLine } from '@workspace/api-client-react';
import { cn } from '@/lib/utils';

const lineMeta: Record<PolicyLine['kind'], { Icon: typeof Ban; cls: string; label: string }> = {
  block: { Icon: Ban, cls: 'bg-rejected-bg text-rejected', label: 'Blocked' },
  ask: { Icon: Hand, cls: 'bg-pending-bg text-pending', label: 'Needs an OK' },
  limit: { Icon: Gauge, cls: 'bg-tint text-primary', label: 'Limit' },
  time: { Icon: Moon, cls: 'bg-surface text-ink', label: 'Time window' },
};

interface PolicyCardProps {
  title: string;
  lines: PolicyLine[];
  footer?: ReactNode;
  className?: string;
}

/** The current spending policy as short plain-English lines. */
export function PolicyCard({ title, lines, footer, className }: PolicyCardProps) {
  return (
    <article className={cn('rounded-card bg-surface-alt p-5', className)} data-testid="card-policy">
      <h3 className="type-title">{title}</h3>
      <ul className="mt-4 flex flex-col gap-3">
        {lines.map((l, i) => {
          const m = lineMeta[l.kind];
          return (
            <li key={`${l.kind}-${i}`} className="flex items-start gap-3">
              <span className={cn('grid size-8 shrink-0 place-items-center rounded-full', m.cls)}>
                <m.Icon className="size-4" aria-hidden="true" />
                <span className="sr-only">{m.label}:</span>
              </span>
              <p className="type-body-sm pt-1">{l.text}</p>
            </li>
          );
        })}
      </ul>
      {footer && <div className="mt-5 border-t pt-4">{footer}</div>}
    </article>
  );
}
