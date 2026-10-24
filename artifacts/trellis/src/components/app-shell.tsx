import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { RoleSwitcher } from '@/components/trellis/role-switcher';
import { TabBar } from '@/components/trellis/tab-bar';
import { matchTab, saveLastRole, type TabDef, type TabPath } from '@/lib/route-map';

/**
 * Wraps the router. On a role tab URL it draws the phone-width shell: the role
 * switcher pinned at the top, the screen, and that role's tab bar pinned at
 * the bottom. Any other URL (/brand, not found) renders on its own.
 */
interface AppShellProps {
  children: ReactNode;
  /** Count badges for the tab bars, e.g. approvals waiting. */
  badges?: Partial<Record<TabPath, number>>;
}

export function AppShell({ children, badges }: AppShellProps) {
  const [location] = useLocation();
  const tab = matchTab(location);
  if (!tab) return <>{children}</>;
  return (
    <ShellLayout tab={tab} badges={badges}>
      {children}
    </ShellLayout>
  );
}

function ShellLayout({ tab, badges, children }: { tab: TabDef; badges?: AppShellProps['badges']; children: ReactNode }) {
  // Effect bodies stay in braces: newer browsers return a Promise from
  // scrollTo, and React would call any returned value as a cleanup.
  useEffect(() => {
    saveLastRole(tab.role);
  }, [tab.role]);

  // A new tab starts at the top, like a new screen.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab.path]);

  return (
    <div className="min-h-[100dvh] bg-surface-ground">
      {/* Sticky bars stay in the column's flow, so at the end of a scroll nothing is hidden behind them. */}
      <div className="mx-auto flex min-h-[100dvh] max-w-phone flex-col bg-surface" data-testid="app-shell">
        <header className="pt-safe sticky top-0 z-30 bg-signature px-4 pb-3">
          <RoleSwitcher activeRole={tab.role} />
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
        <TabBar role={tab.role} activeTab={tab.path} badges={badges} className="sticky bottom-0 z-30" />
      </div>
    </div>
  );
}
