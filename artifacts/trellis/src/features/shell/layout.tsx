import type { ReactNode } from 'react';
import type { TabDef } from '@/lib/route-map';

/** A centred phone-width column for the signed-out screens; on desktop it sits on the sand background. */
export function PhoneColumn({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-surface-alt">
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-phone flex-col bg-surface md:border-x">{children}</div>
    </div>
  );
}

/** One tab's screen inside the app shell: padding plus a stable test id per tab. */
export function Screen({ tab, children }: { tab: TabDef; children: ReactNode }) {
  return (
    <section className="flex-1 px-4 pb-8 pt-5" data-testid={`screen-${tab.role}-${tab.id}`}>
      {children}
    </section>
  );
}

/** Screen heading used by every signed-in screen. */
export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className="mb-5">
      <h1 className="type-display-md" data-testid="text-screen-title">{title}</h1>
      {subtitle && <p className="type-body-sm mt-2 text-ink-muted">{subtitle}</p>}
    </div>
  );
}
