import { useState } from 'react';
import { Router, useLocation } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import { ComingSoonScreen } from '@/components/trellis/coming-soon-screen';
import { RoleSwitcher } from '@/components/trellis/role-switcher';
import { RoleSwitcherSlot } from '@/components/trellis/role-switcher-slot';
import { TabBar } from '@/components/trellis/tab-bar';
import { ROLES, firstTabPath, matchTab, type RoleId, type TabPath } from '@/lib/route-map';
import { PhoneFrame, PreviewSection, SampleLabel, Specimen } from './preview-kit';

const SAMPLE_BADGE = 3;

/** The shell inside the frame. It reads the frame's own in-memory address. */
function ShellSample() {
  const [location] = useLocation();
  const tab = matchTab(location);
  if (!tab) return null;
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col overflow-y-auto">
        <RoleSwitcherSlot activeRole={tab.role} fallback={() => null}>
          <ComingSoonScreen tab={tab} body={`Preview only. In the app this tab lives at ${tab.path}.`} />
        </RoleSwitcherSlot>
      </div>
      <TabBar role={tab.role} activeTab={tab.path} badges={{ '/parent/approvals': SAMPLE_BADGE }} />
    </div>
  );
}

const specimens: { role: RoleId; active: TabPath; badges?: Partial<Record<TabPath, number>>; note: string }[] = [
  { role: 'parent', active: '/parent/home', badges: { '/parent/approvals': 12 }, note: 'Parent, Home active, badge over 9' },
  { role: 'funder', active: '/funder/where-it-went', note: 'Grandparent, second tab active' },
  { role: 'dependent', active: '/dependent/swipe', note: 'Dependent, second tab active' },
];

/** Role switcher and per-role tab bar samples. */
export function ShellSection() {
  // The frame keeps its own address, so clicking here never leaves /brand.
  const [frame] = useState(() => memoryLocation({ path: firstTabPath('parent') }));

  return (
    <PreviewSection id="shell" title="Role switcher & tab bars" note={<SampleLabel />}>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className="type-label px-1 text-ink-muted">App shell</h3>
          <p className="type-caption min-h-10 px-1 text-ink-muted">
            Switch roles and tabs. The approvals count ({SAMPLE_BADGE}) is sample data. Clicks stay inside this frame.
          </p>
          <PhoneFrame label="Sample app shell">
            <Router hook={frame.hook}>
              <ShellSample />
            </Router>
          </PhoneFrame>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="type-label px-1 text-ink-muted">Tab bar per role</h3>
          <p className="type-caption min-h-10 px-1 text-ink-muted">Static specimens, one per role. They do not respond to clicks.</p>
          <ul className="flex flex-col gap-4">
            {specimens.map((s) => (
              <li key={s.role} className="flex flex-col gap-2">
                <div inert className="mx-auto w-full max-w-[390px] overflow-hidden rounded-card-sm border" data-testid={`specimen-tabbar-${s.role}`}>
                  <TabBar role={s.role} activeTab={s.active} badges={s.badges} />
                </div>
                <Specimen>{s.note}</Specimen>
              </li>
            ))}
          </ul>

          <h3 className="type-label mt-4 px-1 text-ink-muted">Role switcher, each role active</h3>
          <ul className="flex flex-col gap-2">
            {ROLES.map((role) => (
              <li key={role.id} inert className="mx-auto flex w-full max-w-[390px] justify-end rounded-card-sm border px-4 py-3" data-testid={`specimen-switcher-${role.id}`}>
                <RoleSwitcher activeRole={role.id} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PreviewSection>
  );
}
