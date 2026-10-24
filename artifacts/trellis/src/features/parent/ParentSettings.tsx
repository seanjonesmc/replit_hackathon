import { ArrowRight, LogOut } from 'lucide-react';
import { InitialAvatar, PillButton, SectionTitle, Tag } from '@/components/trellis/primitives';
import { ScreenHeader } from '@/features/shell/layout';
import { useSession } from '@/features/shell/session';
import { DemoResetControl } from './DemoResetControl';

const productionMap = [
  { demo: 'Simulated bank', production: 'Plaid / ACH' },
  { demo: 'Test dollars', production: 'Fiat balance' },
  { demo: 'Card issuing', production: 'Stripe Issuing' },
  { demo: 'Authorization', production: 'Real-time authorization webhook' },
  { demo: 'Capture', production: 'Settlement' },
];

const roadmap = ['Receipt requirements', 'Recurring allowances', 'Real bank linking'];

export default function ParentSettings() {
  const { user, logout } = useSession();
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Signed in';
  return (
    <>
      <ScreenHeader title="Settings" />

      <section aria-labelledby="account-title">
        <SectionTitle>
          <span id="account-title">Account</span>
        </SectionTitle>
        <div className="flex items-center gap-3 rounded-card-sm border bg-surface p-4">
          <InitialAvatar name={displayName} className="bg-surface-alt" />
          <div className="min-w-0 flex-1">
            <p className="type-link-sm truncate" data-testid="text-user-name">{displayName}</p>
            {user?.email && displayName !== user.email && <p className="type-caption truncate text-ink-muted">{user.email}</p>}
          </div>
          <PillButton size="sm" variant="outline" onClick={logout} icon={<LogOut className="size-4" aria-hidden="true" />} data-testid="button-logout">
            Log out
          </PillButton>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="production-title">
        <SectionTitle>
          <span id="production-title">How this maps to production</span>
        </SectionTitle>
        <div className="rounded-card-sm border bg-surface p-4">
          <p className="type-caption text-ink-muted">This demo simulates the money rails. In a real launch, each piece becomes:</p>
          <ul className="mt-3 flex flex-col divide-y" data-testid="list-production-map">
            {productionMap.map((row) => (
              <li key={row.demo} className="flex items-center gap-2 py-3">
                <span className="type-body-sm min-w-0 flex-1">{row.demo}</span>
                <ArrowRight className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                <span className="type-link-sm min-w-0 flex-1 text-right">{row.production}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="roadmap-title">
        <SectionTitle>
          <span id="roadmap-title">Coming soon</span>
        </SectionTitle>
        <ul className="flex flex-col gap-2 opacity-50" aria-label="Roadmap, not available yet" data-testid="list-roadmap">
          {roadmap.map((item) => (
            <li key={item} className="flex items-center justify-between gap-3 rounded-card-sm border bg-surface p-4">
              <span className="type-body-sm">{item}</span>
              <Tag tone="neutral">Soon</Tag>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8" aria-labelledby="demo-title">
        <SectionTitle>
          <span id="demo-title">Demo</span>
        </SectionTitle>
        <DemoResetControl />
      </section>
    </>
  );
}
