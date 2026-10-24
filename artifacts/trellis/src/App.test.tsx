// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BRAND } from '@brand/brand.config';
import App from './App';
import { ALL_TABS } from './lib/route-map';

/** The session the app sees; each test can sign out by changing it. */
const session = vi.hoisted(() => ({
  isLoading: false,
  isAuthenticated: true,
  user: { id: 'presenter', email: null, firstName: 'Demo', lastName: null, profileImageUrl: null } as unknown,
  login: () => {},
  logout: () => {},
}));

vi.mock('@workspace/replit-auth-web', () => ({ useAuth: () => session }));

let root: Root | null = null;
let host: HTMLElement;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

beforeEach(() => {
  session.isLoading = false;
  session.isAuthenticated = true;
  // Screens stay in their loading state: these tests cover routing, not data.
  vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise<Response>(() => {}));
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
/** The tab screen showing, e.g. "parent-home". */
const screen = () => host.querySelector('[data-testid^="screen-"]')?.getAttribute('data-testid')?.replace(/^screen-/, '');
const click = (id: string) => act(() => byTestId(id)!.click());

describe('app shell routing', () => {
  it('opens the parent home at the root by default', () => {
    open('/');
    expect(window.location.pathname).toBe('/parent/home');
    expect(screen()).toBe('parent-home');
    expect(byTestId('link-role-parent')?.getAttribute('aria-current')).toBe('true');
    expect(byTestId('link-tab-parent-home')?.getAttribute('aria-current')).toBe('page');
  });

  it('opens the last-used role at the root', () => {
    window.localStorage.setItem('demo:last-role', 'dependent');
    open('/');
    expect(window.location.pathname).toBe('/dependent/wallet');
    expect(screen()).toBe('dependent-wallet');
  });

  it("keeps the role and tab on a deep link and remembers the role", () => {
    open('/funder/where-it-went');
    expect(screen()).toBe('funder-where-it-went');
    expect(byTestId('link-role-funder')?.getAttribute('aria-current')).toBe('true');
    expect(byTestId('link-tab-funder-where-it-went')?.getAttribute('aria-current')).toBe('page');
    expect(window.localStorage.getItem('demo:last-role')).toBe('funder');
  });

  it("switches role instantly and lands on that role's first tab", () => {
    open('/parent/settings');
    click('link-role-dependent');
    expect(window.location.pathname).toBe('/dependent/wallet');
    expect(screen()).toBe('dependent-wallet');
    expect(byTestId('nav-tabs-dependent')).not.toBeNull();
    expect(byTestId('nav-tabs-parent')).toBeNull();
  });

  it('moves between tabs and marks the active one', () => {
    open('/parent/home');
    click('link-tab-parent-approvals');
    expect(window.location.pathname).toBe('/parent/approvals');
    expect(screen()).toBe('parent-approvals');
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
    expect(screen()).toBe('funder-add-money');
    expect(byTestId('app-shell')).not.toBeNull();
  });

  it("opens the parent's Add money inside the shell, with Home marked in the tab bar", () => {
    open('/parent/add-money');
    expect(screen()).toBe('parent-add-money');
    expect(byTestId('app-shell')).not.toBeNull();
    expect(byTestId('link-tab-parent-home')?.getAttribute('aria-current')).toBe('page');
    expect(byTestId('link-back-home')?.getAttribute('href')).toBe('/parent/home');
    expect(window.localStorage.getItem('demo:last-role')).toBe('parent');
    click('link-back-home');
    expect(screen()).toBe('parent-home');
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

  it.each(ALL_TABS.map((t) => [t.path, `${t.role}-${t.id}`] as const))('%s shows its own screen inside the shell', (path, id) => {
    open(path);
    expect(screen()).toBe(id);
    expect(byTestId('app-shell')).not.toBeNull();
  });

  it('opens the swipe simulator on the swipe tab, not a placeholder', () => {
    open('/dependent/swipe');
    expect(screen()).toBe('dependent-swipe');
    expect(host.querySelector('[aria-label="Loading the shops"]')).not.toBeNull();
    expect(byTestId('empty-coming-soon')).toBeNull();
  });

  it('uses BRAND.demo names in the role switcher', () => {
    open('/parent/home');
    const names = [BRAND.demo.parent, BRAND.demo.funders[0], BRAND.demo.dependent];
    const text = byTestId('nav-role-switcher')?.textContent ?? '';
    for (const name of names) expect(text).toContain(name);
  });
});

describe('sign-in gate', () => {
  it('shows the welcome with a log in button, and no shell, when signed out', () => {
    session.isAuthenticated = false;
    open('/parent/home');
    expect(byTestId('button-login')).not.toBeNull();
    expect(byTestId('app-shell')).toBeNull();
    expect(host.textContent).not.toMatch(/replit/i);
  });

  it('lifts the welcome feature cards off the lime backdrop: solid surface, border and shadow', () => {
    session.isAuthenticated = false;
    open('/');
    const cards = host.querySelectorAll<HTMLElement>('[data-testid="card-signed-out-point"]');
    expect(cards).toHaveLength(3);
    for (const card of cards) {
      const cls = card.className.split(/\s+/);
      expect(cls).toContain('bg-surface');
      expect(cls).toContain('border');
      expect(cls.some((c) => c.startsWith('border-ink/'))).toBe(true);
      expect(cls.some((c) => c.startsWith('shadow-'))).toBe(true);
    }
  });

  it('shows "Powered by" and the partner logo from BRAND under the log in button', () => {
    session.isAuthenticated = false;
    open('/');
    const line = byTestId('text-powered-by');
    expect(line?.textContent).toContain(BRAND.copy.poweredByLabel);
    const logo = byTestId('img-partner-logo') as HTMLImageElement | null;
    expect(logo?.getAttribute('src')).toBe(BRAND.partnerLogo.src);
    expect(logo?.getAttribute('alt')).toBe(BRAND.partnerLogo.alt);
    expect(logo?.className.split(/\s+/)).toContain('h-[18px]');
    // The testnet line stays alongside it.
    expect(host.textContent).toContain('A testnet demo. No real money moves.');
  });

  it('resolves the partner logo under BASE_URL', () => {
    vi.stubEnv('BASE_URL', '/sub/path/');
    session.isAuthenticated = false;
    open('/sub/path/');
    expect(byTestId('img-partner-logo')?.getAttribute('src')).toBe('/sub/path' + BRAND.partnerLogo.src);
  });

  it('shows a loading state while the session is checked', () => {
    session.isLoading = true;
    open('/parent/home');
    expect(byTestId('state-session-loading')).not.toBeNull();
    expect(byTestId('app-shell')).toBeNull();
  });

  it('keeps the brand preview open without signing in', () => {
    session.isAuthenticated = false;
    open('/brand');
    expect(byTestId('button-login')).toBeNull();
    expect(byTestId('state-session-loading')).toBeNull();
    // The preview itself loads lazily; its loading state proves the route rendered.
    expect(host.querySelector('[aria-label="Loading preview"]')).not.toBeNull();
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
    expect(screen()).toBe('parent-activity');
  });
});
