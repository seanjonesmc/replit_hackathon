// @vitest-environment happy-dom
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { BRAND } from '@brand/brand.config';
import { RoleSwitcher } from './role-switcher';
import { RoleSwitcherSlot } from './role-switcher-slot';
import { ScreenHeader } from '@/features/shell/layout';
import { TabBar } from './tab-bar';

let root: Root | null = null;
let host: HTMLElement;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  host?.remove();
});

function render(ui: ReactNode, base = '') {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  const { hook } = memoryLocation({ path: '/parent/home', static: true });
  act(() =>
    root!.render(
      <Router hook={hook} base={base}>
        {ui}
      </Router>,
    ),
  );
  return host;
}

const links = (nav: string) => [...host.querySelectorAll<HTMLAnchorElement>(`nav[aria-label="${nav}"] a`)];

describe('RoleSwitcher', () => {
  it('names each role with its BRAND.demo name and links to its first tab', () => {
    render(<RoleSwitcher activeRole="funder" />);
    expect(links('Switch role').map((a) => [a.getAttribute('aria-label'), a.getAttribute('href')])).toEqual([
      [`${BRAND.demo.parent}, Parent`, '/parent/home'],
      [`${BRAND.demo.funders[0]}, Grandparent`, '/funder/add-money'],
      [`${BRAND.demo.dependent}, Dependent`, '/dependent/wallet'],
    ]);
  });

  it('marks only the active role', () => {
    render(<RoleSwitcher activeRole="dependent" />);
    expect(links('Switch role').map((a) => a.getAttribute('aria-current'))).toEqual([null, null, 'true']);
  });

  it('keeps links under the base path', () => {
    render(<RoleSwitcher activeRole="parent" />, '/sub/path');
    expect(links('Switch role')[2].getAttribute('href')).toBe('/sub/path/dependent/wallet');
  });

  it('shows who is being viewed and opens and closes the role list', () => {
    render(<RoleSwitcher activeRole="funder" />);
    const button = host.querySelector<HTMLButtonElement>('[data-testid="button-role-switcher"]')!;
    const panel = host.querySelector<HTMLElement>('[data-testid="panel-role-switcher"]')!;
    expect(button.getAttribute('aria-label')).toBe(`Viewing as ${BRAND.demo.funders[0]}, Grandparent. Switch role`);
    expect(button.textContent).toContain('Grandparent');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(panel.hidden).toBe(true);

    act(() => button.click());
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(panel.hidden).toBe(false);

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(panel.hidden).toBe(true);
    expect(document.activeElement).toBe(button);

    act(() => button.click());
    act(() => {
      document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    });
    expect(panel.hidden).toBe(true);
  });
});

describe('RoleSwitcherSlot', () => {
  const switchers = () => host.querySelectorAll('[data-testid="nav-role-switcher"]');
  const slot = (ui: ReactNode) => (
    <RoleSwitcherSlot activeRole="parent" fallback={(switcher) => <div data-testid="fallback-row">{switcher}</div>}>
      {ui}
    </RoleSwitcherSlot>
  );

  it('puts the switcher on the screen heading line, once', () => {
    render(slot(<ScreenHeader title="Hi" />));
    expect(switchers()).toHaveLength(1);
    expect(host.querySelector('[data-testid="fallback-row"]')).toBeNull();
    expect(switchers()[0].parentElement?.parentElement?.contains(host.querySelector('h1'))).toBe(true);
  });

  it('keeps a switcher on screen while no heading is shown (loading or error)', () => {
    render(slot(<p>Loading</p>));
    expect(switchers()).toHaveLength(1);
    expect(host.querySelector('[data-testid="fallback-row"]')).not.toBeNull();
  });
});

describe('TabBar', () => {
  it("shows the role's tabs and marks the current page", () => {
    render(<TabBar role="parent" activeTab="/parent/activity" />);
    const tabs = links('Parent screens');
    expect(tabs.map((a) => a.textContent)).toEqual(['Home', 'Approvals', 'Activity', 'Card & policy', 'Settings']);
    expect(tabs.map((a) => a.getAttribute('aria-current'))).toEqual([null, null, 'page', null, null]);
  });

  it('has no badge unless a count is given', () => {
    render(<TabBar role="parent" activeTab="/parent/home" badges={{ '/parent/approvals': 0 }} />);
    expect(host.querySelector('[data-testid="badge-tab-parent-approvals"]')).toBeNull();
    expect(links('Parent screens')[1].getAttribute('aria-label')).toBeNull();
  });

  it.each([
    [3, '3'],
    [12, '9+'],
  ])('shows an approvals count of %i as "%s" and reads the exact number', (count, shown) => {
    render(<TabBar role="parent" activeTab="/parent/home" badges={{ '/parent/approvals': count }} />);
    expect(host.querySelector('[data-testid="badge-tab-parent-approvals"]')?.textContent).toBe(shown);
    expect(links('Parent screens')[1].getAttribute('aria-label')).toBe(`Approvals, ${count} waiting`);
  });

  it('labels each role bar by role', () => {
    render(<TabBar role="funder" />);
    expect(links('Grandparent screens').map((a) => a.textContent)).toEqual(['Add money', 'Where my money went']);
  });
});
