import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { RoleSwitcherSlot } from '@/components/trellis/role-switcher-slot';
import { TabBar } from '@/components/trellis/tab-bar';
import { Wordmark } from '@/components/trellis/primitives';
import { matchScreen, saveLastRole, type ShellScreen, type TabPath } from '@/lib/route-map';

/**
 * Wraps the router. On a role tab URL (or a sub-screen opened from a tab) it
 * draws the phone-width shell: the screen, with the role switcher on its
 * heading's line, and that role's tab bar pinned at the bottom. Any other URL
 * (/brand, not found) renders on its own.
 */
interface AppShellProps {
  children: ReactNode;
  /** Count badges for the tab bars, e.g. approvals waiting. */
  badges?: Partial<Record<TabPath, number>>;
}

export function AppShell({ children, badges }: AppShellProps) {
  const [location] = useLocation();
  const screen = matchScreen(location);
  if (!screen) return <>{children}</>;
  return (
    <ShellLayout screen={screen} badges={badges}>
      {children}
    </ShellLayout>
  );
}

function ShellLayout({ screen, badges, children }: { screen: ShellScreen; badges?: AppShellProps['badges']; children: ReactNode }) {
  const { tab } = screen;
  // Effect bodies stay in braces: newer browsers return a Promise from
  // scrollTo, and React would call any returned value as a cleanup.
  useEffect(() => {
    saveLastRole(tab.role);
  }, [tab.role]);

  // A new tab or sub-screen starts at the top, like a new screen.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen.path]);

  return (
    <div className="min-h-[100dvh] bg-surface-ground">
      {/* Sticky bars stay in the column's flow, so at the end of a scroll nothing is hidden behind them. */}
      <div className="mx-auto flex min-h-[100dvh] max-w-phone flex-col bg-surface" data-testid="app-shell">
        <header className="pt-safe px-4">
          <Wordmark className="mt-2" />
        </header>
        <main className="flex flex-1 flex-col">
          <RoleSwitcherSlot
            activeRole={tab.role}
            fallback={(switcher) => <div className="flex justify-end px-4 pt-5">{switcher}</div>}
          >
            {children}
          </RoleSwitcherSlot>
        </main>
        <TabBar role={tab.role} activeTab={tab.path} badges={badges} className="sticky bottom-0 z-30" />
      </div>
    </div>
  );
}
