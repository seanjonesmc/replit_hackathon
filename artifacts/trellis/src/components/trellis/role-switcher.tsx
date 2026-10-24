import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { ROLES, firstTabPath, type RoleId } from '@/lib/route-map';

interface RoleSwitcherProps {
  activeRole: RoleId;
  className?: string;
}

/**
 * Pill segmented control for the demo: one person switches between the
 * family's views. Each segment is a link to that role's first tab, so the
 * switch is instant and the URL always says which role is showing.
 * Designed to sit on the signature-colored top bar.
 */
export function RoleSwitcher({ activeRole, className }: RoleSwitcherProps) {
  return (
    <nav aria-label="Switch role" className={className} data-testid="nav-role-switcher">
      <ul className="flex gap-1 rounded-pill bg-surface p-1">
        {ROLES.map((role) => {
          const active = role.id === activeRole;
          return (
            <li key={role.id} className="flex min-w-0 flex-auto">
              <Link
                href={firstTabPath(role.id)}
                aria-current={active ? 'true' : undefined}
                aria-label={`${role.name}, ${role.roleLabel}`}
                className={cn(
                  'flex h-12 min-w-0 flex-1 flex-col items-center justify-center rounded-pill px-2 text-center transition-colors duration-200 ease-out',
                  active ? 'bg-primary text-on-primary' : 'text-ink hover:bg-surface-alt',
                )}
                data-testid={`link-role-${role.id}`}
              >
                <span className="w-full truncate text-[14px] font-bold leading-tight">{role.name}</span>
                <span className={cn('w-full truncate text-[11px] font-medium leading-tight', active ? 'text-on-primary' : 'text-ink-muted')}>
                  {role.roleLabel}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
