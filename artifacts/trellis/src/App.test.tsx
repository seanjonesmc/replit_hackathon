// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { BRAND } from '@brand/brand.config';
import App from './App';
import { ALL_TABS } from './lib/route-map';

let root: Root | null = null;
let host: HTMLElement;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  act(() => root?.unmount());
  vi.restoreAllMocks();
  root = null;
  host?.remove();
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
  vi.unstubAllEnvs();
});

/** Opens the app at a URL, as a refresh or deep link would. */
function open(url: string) {
  window.history.replaceState(null, '', url);
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(<App />));
}

const byTestId = (id: string) => host.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const title = () => byTestId('text-screen-title')?.textContent;
const click = (id: string) => act(() => byTestId(id)!.click());

describe('app shell routing', () => {
  it('opens the parent home at the root by default', () => {
    open('/');
    expect(window.location.pathname).toBe('/parent/home');
    expect(title()).toBe('Home');
    expect(byTestId('link-role-parent')?.getAttribute('aria-current')).toBe('true');
    expect(byTestId('link-tab-parent-home')?.getAttribute('aria-current')).toBe('page');
  });

  it('opens the last-used role at the root', () => {
    window.localStorage.setItem('demo:last-role', 'dependent');
    open('/');
    expect(window.location.pathname).toBe('/dependent/wallet');
    expect(title()).toBe('Wallet');
  });

  it("keeps the role and tab on a deep link and remembers the role", () => {
    open('/funder/where-it-went');
    expect(title()).toBe('Where my money went');
    expect(byTestId('empty-coming-soon')?.textContent).toContain("You'll see every purchase your money covers, right here.");
    expect(byTestId('link-role-funder')?.getAttribute('aria-current')).toBe('true');
    expect(byTestId('link-tab-funder-where-it-went')?.getAttribute('aria-current')).toBe('page');
    expect(window.localStorage.getItem('demo:last-role')).toBe('funder');
  });

  it("switches role instantly and lands on that role's first tab", () => {
    open('/parent/settings');
    click('link-role-dependent');
    expect(window.location.pathname).toBe('/dependent/wallet');
    expect(title()).toBe('Wallet');
    expect(byTestId('nav-tabs-dependent')).not.toBeNull();
    expect(byTestId('nav-tabs-parent')).toBeNull();
  });

  it('moves between tabs and marks the active one', () => {
    open('/parent/home');
    click('link-tab-parent-approvals');
    expect(window.location.pathname).toBe('/parent/approvals');
    expect(title()).toBe('Approvals');
    expect(byTestId('link-tab-parent-approvals')?.getAttribute('aria-current')).toBe('page');
    expect(byTestId('link-tab-parent-home')?.getAttribute('aria-current')).toBeNull();
  });

  it('keeps working when scrollTo returns a Promise, as in current Chrome', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => Promise.resolve() as unknown as void);
    open('/parent/home');
    click('link-tab-parent-approvals');
    click('link-tab-parent-activity');
    click('link-role-funder');
    expect(window.location.pathname).toBe('/funder/add-money');
    expect(title()).toBe('Add money');
    expect(byTestId('app-shell')).not.toBeNull();
  });

  it("sends a bare role URL to that role's first tab", () => {
    open('/funder');
    expect(window.location.pathname).toBe('/funder/add-money');
  });

  it.each(['/nope', '/parent/nope', '/funder/home'])('shows the not-found page without the shell for %s', (url) => {
    open(url);
    expect(byTestId('page-not-found')).not.toBeNull();
    expect(byTestId('app-shell')).toBeNull();
  });

  it.each(ALL_TABS.map((t) => [t.path, t.label] as const))('%s shows its title, a coming-soon state and no money or actions', (path, label) => {
    open(path);
    expect(title()).toBe(label);
    const screen = byTestId('empty-coming-soon')!;
    expect(screen.textContent).toContain('Coming soon');
    expect(screen.querySelector('button, a')).toBeNull();
    expect(host.querySelector('main')?.textContent).not.toMatch(/\$\s?\d/);
  });

  it('uses BRAND.demo names in the role switcher', () => {
    open('/parent/home');
    const names = [BRAND.demo.parent, BRAND.demo.funders[0], BRAND.demo.dependent];
    const text = byTestId('nav-role-switcher')?.textContent ?? '';
    for (const name of names) expect(text).toContain(name);
  });
});

describe('app shell under a sub-path', () => {
  it('routes and links under BASE_URL', () => {
    vi.stubEnv('BASE_URL', '/sub/path/');
    open('/sub/path/');
    expect(window.location.pathname).toBe('/sub/path/parent/home');
    expect(byTestId('link-role-funder')?.getAttribute('href')).toBe('/sub/path/funder/add-money');
    click('link-tab-parent-activity');
    expect(window.location.pathname).toBe('/sub/path/parent/activity');
    expect(title()).toBe('Activity');
  });
});
