import type { ReactNode } from 'react';
import type { TabDef } from '@/lib/route-map';
import { useInlineRoleSwitcher } from '@/components/trellis/role-switcher-slot';

/** A centred phone-width column for the signed-out screens; on desktop it sits on the sand background. */
export function PhoneColumn({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-surface-ground">
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-phone flex-col bg-surface md:border-x">{children}</div>
    </div>
  );
}

/** One tab's (or sub-screen's) screen inside the app shell: padding plus a stable test id. */
export function Screen({ tab, children }: { tab: Pick<TabDef, 'role' | 'id'>; children: ReactNode }) {
  return (
    <section className="flex-1 px-4 pb-8 pt-5" data-testid={`screen-${tab.role}-${tab.id}`}>
      {children}
    </section>
  );
}

/** Screen heading used by every signed-in screen; the role switcher sits on its line. */
export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  const switcher = useInlineRoleSwitcher();
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="type-display-md min-w-0" data-testid="text-screen-title">{title}</h1>
        {switcher && <div className="shrink-0">{switcher}</div>}
      </div>
      {subtitle && <p className="type-body-sm mt-2 text-ink-muted">{subtitle}</p>}
    </div>
  );
}
