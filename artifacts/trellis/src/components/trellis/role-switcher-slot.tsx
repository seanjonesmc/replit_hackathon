import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from 'react';
import type { RoleId } from '@/lib/route-map';
import { RoleSwitcher } from './role-switcher';

interface SlotValue {
  activeRole: RoleId;
  claim: () => () => void;
}

const RoleSwitcherSlotContext = createContext<SlotValue | null>(null);

/**
 * Lets a screen's heading host the role switcher on its own line. The shell
 * provides the active role; a heading that renders `useInlineRoleSwitcher()`
 * claims the switcher. While nothing claims it (a screen that is loading or
 * failed to load), `fallback` renders it on a row of its own, so the
 * presenter can always change role.
 */
export function RoleSwitcherSlot({
  activeRole,
  children,
  fallback,
}: {
  activeRole: RoleId;
  children: ReactNode;
  fallback: (switcher: ReactNode) => ReactNode;
}) {
  const [claims, setClaims] = useState(0);
  const [value] = useState<Omit<SlotValue, 'activeRole'>>(() => ({
    claim: () => {
      setClaims((n) => n + 1);
      return () => setClaims((n) => n - 1);
    },
  }));
  return (
    <RoleSwitcherSlotContext.Provider value={{ ...value, activeRole }}>
      {claims === 0 && fallback(<RoleSwitcher activeRole={activeRole} />)}
      {children}
    </RoleSwitcherSlotContext.Provider>
  );
}

/** The role switcher for a screen heading, or null outside the app shell. */
export function useInlineRoleSwitcher(): ReactNode {
  const slot = useContext(RoleSwitcherSlotContext);
  const claim = slot?.claim;
  useLayoutEffect(() => claim?.(), [claim]);
  return slot ? <RoleSwitcher activeRole={slot.activeRole} /> : null;
}
