import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { getRole, type RoleId, type TabPath } from '@/lib/route-map';

interface TabBarProps {
  role: RoleId;
  /** The tab that is showing; marked as the current page. */
  activeTab?: TabPath;
  /** Optional count badges by tab, e.g. waiting approvals. Zero hides the badge. */
  badges?: Partial<Record<TabPath, number>>;
  className?: string;
}

const badgeText = (count: number) => (count > 9 ? '9+' : String(count));

/** Bottom tab bar for one role, driven by the route map. */
export function TabBar({ role, activeTab, badges, className }: TabBarProps) {
  const def = getRole(role);
  return (
    <nav aria-label={`${def.roleLabel} screens`} className={cn('border-t bg-surface pb-safe', className)} data-testid={`nav-tabs-${role}`}>
      <ul className="flex">
        {def.tabs.map((tab) => {
          const active = tab.path === activeTab;
          const count = badges?.[tab.path] ?? 0;
          const showBadge = Number.isInteger(count) && count > 0;
          return (
            <li key={tab.path} className="flex min-w-0 flex-1 basis-0">
              <Link
                href={tab.path}
                aria-current={active ? 'page' : undefined}
                aria-label={showBadge ? `${tab.label}, ${count} ${tab.badgeNoun ?? 'new'}` : undefined}
                className="group flex min-h-16 min-w-0 flex-1 flex-col items-center gap-1 rounded-card-sm px-1 pb-2 pt-2 text-center focus-visible:-outline-offset-2"
                data-testid={`link-tab-${tab.role}-${tab.id}`}
              >
                <span
                  className={cn(
                    'relative grid h-8 w-14 shrink-0 place-items-center rounded-pill transition-colors duration-200 ease-out',
                    active ? 'bg-tint text-primary' : 'text-ink-muted group-hover:bg-surface-alt group-hover:text-ink',
                  )}
                >
                  <tab.icon className="size-[22px]" strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
                  {showBadge && (
                    <span
                      aria-hidden="true"
                      className="tnum absolute -top-1 right-1 grid h-5 min-w-5 place-items-center rounded-pill bg-primary px-1 text-[11px] font-bold leading-none text-surface ring-2 ring-surface"
                      data-testid={`badge-tab-${tab.role}-${tab.id}`}
                    >
                      {badgeText(count)}
                    </span>
                  )}
                </span>
                <span className={cn('text-balance text-[12px] leading-tight', active ? 'font-bold text-ink' : 'font-medium text-ink-muted')}>
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
