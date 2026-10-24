import { type ReactNode } from 'react';
import { EmptyState } from '@/components/trellis/empty-state';
import type { TabDef } from '@/lib/route-map';

interface ComingSoonScreenProps {
  tab: TabDef;
  /** One honest sentence about what this screen will show. */
  body: ReactNode;
}

/**
 * Placeholder for a tab whose real screen is not built yet: its title and an
 * empty state saying it is coming. No sample balances, no actions.
 */
export function ComingSoonScreen({ tab, body }: ComingSoonScreenProps) {
  return (
    <section aria-labelledby="screen-title" className="flex flex-1 flex-col" data-testid={`screen-${tab.role}-${tab.id}`}>
      <div className="header-sky px-6 pb-16 pt-4">
        <h1 id="screen-title" className="type-display-md text-surface" data-testid="text-screen-title">
          {tab.label}
        </h1>
      </div>
      <div className="-mt-8 px-4 pb-8">
        <div className="rounded-card border bg-surface">
          <EmptyState icon={tab.icon} title="Coming soon" titleAs="h2" body={body} data-testid="empty-coming-soon" />
        </div>
      </div>
    </section>
  );
}
