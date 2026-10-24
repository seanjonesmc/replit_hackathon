// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BRAND } from '@brand/brand.config';
import { ALL_TABS, ROLES, firstTabPath, getRole, matchTab, readLastRole, saveLastRole } from './route-map';

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('route map', () => {
  it('lists the three demo roles with names from BRAND.demo', () => {
    expect(ROLES.map((r) => [r.id, r.roleLabel, r.name])).toEqual([
      ['parent', 'Parent', BRAND.demo.parent],
      ['funder', 'Grandparent', BRAND.demo.funders[0]],
      ['dependent', 'Dependent', BRAND.demo.dependent],
    ]);
  });

  it('gives each role its tabs in order', () => {
    expect(getRole('parent').tabs.map((t) => t.label)).toEqual(['Home', 'Approvals', 'Activity', 'Card & policy', 'Settings']);
    expect(getRole('funder').tabs.map((t) => t.label)).toEqual(['Add money', 'Where my money went']);
    expect(getRole('dependent').tabs.map((t) => t.label)).toEqual(['Wallet', 'Swipe']);
  });

  it('gives every tab its own /<role>/<tab> URL', () => {
    const paths = ALL_TABS.map((t) => t.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const tab of ALL_TABS) expect(tab.path).toBe(`/${tab.role}/${tab.id}`);
  });

  it("lands a role switch on that role's first tab", () => {
    expect(firstTabPath('parent')).toBe('/parent/home');
    expect(firstTabPath('funder')).toBe('/funder/add-money');
    expect(firstTabPath('dependent')).toBe('/dependent/wallet');
  });

  it('matches tab URLs like the router: trailing slash and case do not matter', () => {
    expect(matchTab('/parent/approvals')?.label).toBe('Approvals');
    expect(matchTab('/parent/approvals/')?.label).toBe('Approvals');
    expect(matchTab('/Dependent/Swipe')?.label).toBe('Swipe');
    for (const miss of ['/', '/parent', '/brand', '/parent/nope', '/parent/home/extra', '~/elsewhere']) {
      expect(matchTab(miss), miss).toBeNull();
    }
  });
});

describe('last-used role', () => {
  it('defaults to the parent', () => {
    expect(readLastRole()).toBe('parent');
  });

  it('remembers the last role', () => {
    saveLastRole('dependent');
    expect(readLastRole()).toBe('dependent');
  });

  it('ignores a stored value that is not a role', () => {
    window.localStorage.setItem('demo:last-role', 'admin');
    expect(readLastRole()).toBe('parent');
  });

  it('falls back to the parent when storage is blocked', () => {
    window.localStorage.setItem('demo:last-role', 'funder');
    // Browsers that block storage throw on access to window.localStorage itself.
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    expect(() => saveLastRole('dependent')).not.toThrow();
    expect(readLastRole()).toBe('parent');
  });
});
