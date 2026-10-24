import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** A pulsing placeholder block. Size and shape it with className. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-input bg-surface-alt motion-reduce:animate-none', className)} />;
}

/** Wraps skeletons so assistive tech hears one "Loading" instead of empty boxes. */
export function LoadingRegion({ label = 'Loading', className, children }: { label?: string; className?: string; children: ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      {children}
    </div>
  );
}

/** Placeholder shaped like the hero balance card. */
export function HeroBalanceCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-card bg-surface p-6 md:p-8', className)}>
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-6 h-12 w-48" />
      <Skeleton className="mt-3 h-3 w-40" />
    </div>
  );
}

/** Placeholder shaped like a bucket card. */
export function BucketCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-card-sm border bg-surface p-5', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-2 h-3 w-40" />
        </div>
      </div>
      <Skeleton className="mt-4 h-6 w-32" />
      <Skeleton className="mt-2 h-2 w-full rounded-pill" />
    </div>
  );
}

/** Placeholder shaped like an activity row. Renders an <li>. */
export function ActivityRowSkeleton() {
  return (
    <li className="flex gap-3 py-4">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex-1">
        <div className="flex justify-between gap-3">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-4 w-14" />
        </div>
        <Skeleton className="mt-3 h-6 w-28 rounded-pill" />
      </div>
    </li>
  );
}
