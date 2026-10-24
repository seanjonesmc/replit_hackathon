import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AnimatedCents } from './animated-cents';

interface HeroBalanceCardProps {
  /** Small uppercase label above the amount, e.g. the family name. */
  eyebrow: string;
  amountCents: number;
  /** One short line under the amount. */
  caption?: ReactNode;
  /** Optional marker in the top-right corner, e.g. a sample tag. */
  badge?: ReactNode;
  /** Extra content under the caption, e.g. member avatars. */
  children?: ReactNode;
  className?: string;
  'data-testid'?: string;
}

/**
 * The hero balance card. One of the surfaces allowed to use the signature
 * color (with the header band and the top bar). The virtual card has its own
 * dark card face so the two never look alike. The amount counts to its new
 * value when it changes.
 */
export function HeroBalanceCard({ eyebrow, amountCents, caption, badge, children, className, 'data-testid': testId }: HeroBalanceCardProps) {
  return (
    <article className={cn('lattice relative overflow-hidden rounded-card bg-signature p-6 text-on-signature md:p-8', className)} data-testid={testId}>
      <div className="flex items-start justify-between gap-3">
        <p className="type-label">{eyebrow}</p>
        {badge}
      </div>
      <p className="type-display-xl tnum mt-6 break-words" data-testid="text-hero-balance">
        <AnimatedCents cents={amountCents} />
      </p>
      {caption && <p className="type-caption mt-1">{caption}</p>}
      {children && <div className="mt-6">{children}</div>}
    </article>
  );
}
