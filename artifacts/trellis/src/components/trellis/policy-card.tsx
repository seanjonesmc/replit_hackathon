import type { ReactNode } from 'react';
import { Ban, Gauge, Hand, Moon } from 'lucide-react';
import type { PolicyLine } from '@workspace/api-client-react';
import { cn } from '@/lib/utils';
import { motion } from './motion';

const lineMeta: Record<PolicyLine['kind'], { Icon: typeof Ban; cls: string; label: string }> = {
  block: { Icon: Ban, cls: 'bg-rejected-bg text-rejected', label: 'Blocked' },
  ask: { Icon: Hand, cls: 'bg-pending-bg text-pending', label: 'Needs an OK' },
  limit: { Icon: Gauge, cls: 'bg-tint text-primary', label: 'Limit' },
  time: { Icon: Moon, cls: 'bg-surface-alt text-ink', label: 'Time window' },
};

/** Icon circle for a policy line kind (shared with the rules builder's review card). */
export function PolicyLineIcon({ kind }: { kind: PolicyLine['kind'] }) {
  const m = lineMeta[kind];
  return (
    <span className={cn('grid size-8 shrink-0 place-items-center rounded-full', m.cls)}>
      <m.Icon className="size-4" aria-hidden="true" />
      <span className="sr-only">{m.label}:</span>
    </span>
  );
}

interface PolicyCardProps {
  title: string;
  lines: PolicyLine[];
  footer?: ReactNode;
  className?: string;
  /** Text of lines just added: they rise in on mount. */
  freshLines?: ReadonlySet<string>;
  /** While true, fresh lines carry a tint highlight that fades when it turns false. */
  highlightFresh?: boolean;
}

/** The current spending policy as short plain-English lines. */
export function PolicyCard({ title, lines, footer, className, freshLines, highlightFresh }: PolicyCardProps) {
  return (
    <article className={cn('rounded-card border bg-surface p-5', className)} data-testid="card-policy">
      <h3 key={title} className={cn('type-title', freshLines && freshLines.size > 0 && motion.itemIn)} data-testid="text-policy-name">
        {title}
      </h3>
      <ul className="mt-4 flex flex-col gap-1">
        {lines.map((l) => {
          const fresh = freshLines?.has(l.text) ?? false;
          return (
            <li
              key={`${l.kind}-${l.text}`}
              className={cn(
                '-mx-2 flex items-start gap-3 rounded-input px-2 py-1 transition-colors duration-900 ease-settle',
                fresh && motion.ruleIn,
                fresh && highlightFresh && 'bg-tint',
              )}
              data-testid={`policy-line-${l.kind}`}
            >
              <PolicyLineIcon kind={l.kind} />
              <p className="type-body-sm pt-1">{l.text}</p>
            </li>
          );
        })}
      </ul>
      {footer && <div className="mt-5 border-t pt-4">{footer}</div>}
    </article>
  );
}
