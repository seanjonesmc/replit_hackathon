import { CreditCard, HandCoins, House, Inbox, Nfc, PiggyBank, ReceiptText, Settings, Wallet, type LucideIcon } from 'lucide-react';
import { BRAND } from '@brand/brand.config';

/**
 * The one route map for the app shell: roles, their bottom tabs and the URL of
 * every tab. The role switcher, the tab bars and the router all read it.
 * Every tab URL is `/<role>/<tab>`. Names come from BRAND.demo.
 */
const ROLE_DEFS = [
  {
    id: 'parent',
    roleLabel: 'Parent',
    name: BRAND.demo.parent,
    tabs: [
      { id: 'home', label: 'Home', icon: House },
      { id: 'approvals', label: 'Approvals', icon: Inbox, badgeNoun: 'waiting' },
      { id: 'activity', label: 'Activity', icon: ReceiptText },
      { id: 'card', label: 'Card & policy', icon: CreditCard },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
  {
    id: 'funder',
    roleLabel: 'Grandparent',
    // The demo's grandparent is the first funder.
    name: BRAND.demo.funders[0] ?? 'Grandparent',
    tabs: [
      { id: 'add-money', label: 'Add money', icon: PiggyBank },
      { id: 'where-it-went', label: 'Where my money went', icon: HandCoins },
    ],
  },
  {
    id: 'dependent',
    roleLabel: 'Dependent',
    name: BRAND.demo.dependent,
    tabs: [
      { id: 'wallet', label: 'Wallet', icon: Wallet },
      { id: 'swipe', label: 'Swipe', icon: Nfc },
    ],
  },
] as const;

type RoleDefInput = (typeof ROLE_DEFS)[number];

export type RoleId = RoleDefInput['id'];

/** Every tab URL, e.g. `/parent/approvals`. */
export type TabPath = { [R in RoleDefInput as R['id']]: `/${R['id']}/${R['tabs'][number]['id']}` }[RoleId];

export interface TabDef {
  role: RoleId;
  id: string;
  path: TabPath;
  label: string;
  icon: LucideIcon;
  /** Read after a count badge's number, e.g. "Approvals, 3 waiting". */
  badgeNoun?: string;
}

export interface RoleDef {
  id: RoleId;
  /** What the person is in the family, e.g. "Parent". */
  roleLabel: string;
  /** Their demo name from BRAND.demo. */
  name: string;
  tabs: readonly TabDef[];
}

export const ROLES: readonly RoleDef[] = ROLE_DEFS.map((role) => ({
  id: role.id,
  roleLabel: role.roleLabel,
  name: role.name,
  tabs: role.tabs.map((tab) => ({
    ...tab,
    role: role.id,
    path: `/${role.id}/${tab.id}` as TabPath,
  })),
}));

export const ALL_TABS: readonly TabDef[] = ROLES.flatMap((role) => role.tabs);

export const DEFAULT_ROLE: RoleId = 'parent';

export function isRoleId(value: unknown): value is RoleId {
  return ROLES.some((role) => role.id === value);
}

export function getRole(id: RoleId): RoleDef {
  const role = ROLES.find((r) => r.id === id);
  if (!role) throw new Error(`Unknown role: ${id}`);
  return role;
}

export function getTab(path: TabPath): TabDef {
  const tab = ALL_TABS.find((t) => t.path === path);
  if (!tab) throw new Error(`Unknown tab: ${path}`);
  return tab;
}

/** Where switching to a role lands: its first tab. */
export function firstTabPath(id: RoleId): TabPath {
  return getRole(id).tabs[0].path;
}

/**
 * The tab a router location (relative to the base path) points at, or null.
 * Matches like the router does: case-insensitive, optional trailing slash.
 */
export function matchTab(location: string): TabDef | null {
  const path = location.toLowerCase().replace(/(.)\/$/, '$1');
  return ALL_TABS.find((tab) => tab.path === path) ?? null;
}

/* ---------- Last-used role ---------- */

const LAST_ROLE_KEY = 'demo:last-role';

/** The role the root opens: the last one used on this device, else the parent. */
export function readLastRole(): RoleId {
  try {
    const stored = window.localStorage.getItem(LAST_ROLE_KEY);
    if (isRoleId(stored)) return stored;
  } catch {
    // Storage can be blocked (private mode, disabled cookies): use the default.
  }
  return DEFAULT_ROLE;
}

export function saveLastRole(id: RoleId): void {
  try {
    window.localStorage.setItem(LAST_ROLE_KEY, id);
  } catch {
    // Not remembering the role is harmless: the root falls back to the parent.
  }
}
