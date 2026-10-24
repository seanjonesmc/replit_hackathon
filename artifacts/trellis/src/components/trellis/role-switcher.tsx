import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'wouter';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROLES, firstTabPath, getRole, type RoleId } from '@/lib/route-map';

interface RoleSwitcherProps {
  activeRole: RoleId;
  className?: string;
}

/** "Grandma Rose" → "GR", "Maya" → "M". */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('');
}

function Avatar({ name, size }: { name: string; size: 'sm' | 'md' }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-pill bg-tint font-bold text-on-signature',
        size === 'sm' ? 'size-9 text-[13px]' : 'size-11 text-[14px]',
      )}
    >
      {initials(name)}
    </span>
  );
}

/**
 * Demo role picker: one presenter switches between the family's views. A
 * compact pill beside the screen heading shows which role is being viewed; it
 * opens a list of the roles. Each role is a link to its first tab, so the switch is
 * instant and the URL always says which role is showing.
 *
 * Built as a disclosure of links (not an ARIA menu) because each option
 * navigates. The links stay in the DOM while closed but are `hidden`.
 */
export function RoleSwitcher({ activeRole, className }: RoleSwitcherProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const active = getRole(activeRole);

  // Switching role (or landing on another role's URL) closes the menu.
  useEffect(() => {
    setOpen(false);
  }, [activeRole]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <nav ref={rootRef} aria-label="Switch role" className={cn('relative', className)} data-testid="nav-role-switcher">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        aria-label={`Viewing as ${active.name}, ${active.roleLabel}. Switch role`}
        className="flex h-12 max-w-full items-center gap-2 rounded-pill bg-surface-alt py-1 pl-1 pr-3 text-left text-ink transition-colors duration-200 ease-out hover:bg-surface-ground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        data-testid="button-role-switcher"
      >
        <Avatar name={active.name} size="sm" />
        <span className="truncate text-[14px] font-bold leading-tight">{active.roleLabel}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn('size-4 shrink-0 transition-transform duration-200 ease-out', open && 'rotate-180')}
        />
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute right-0 top-full z-40 mt-2 w-[min(calc(100vw-2rem),320px)] rounded-card-sm border border-hairline bg-surface p-2"
        data-testid="panel-role-switcher"
      >
        <p className="px-3 pb-2 pt-2 text-[13px] font-medium text-ink-muted">Demo: view the app as</p>
        <ul className="flex flex-col gap-1">
          {ROLES.map((role) => {
            const current = role.id === activeRole;
            return (
              <li key={role.id}>
                <Link
                  href={firstTabPath(role.id)}
                  aria-current={current ? 'true' : undefined}
                  aria-label={`${role.name}, ${role.roleLabel}`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-input px-3 py-2.5 text-ink transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink',
                    current ? 'bg-surface-alt' : 'hover:bg-surface-alt',
                  )}
                  data-testid={`link-role-${role.id}`}
                >
                  <Avatar name={role.name} size="md" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[16px] font-bold leading-tight">{role.name}</span>
                    <span className="truncate text-[14px] leading-tight text-ink-muted">{role.roleLabel}</span>
                  </span>
                  {current && <Check aria-hidden="true" className="size-5 shrink-0" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
