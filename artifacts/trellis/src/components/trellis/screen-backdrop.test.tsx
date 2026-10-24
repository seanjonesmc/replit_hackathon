// @vitest-environment happy-dom
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { BRAND } from '@brand/brand.config';
import { AppShell } from '@/components/app-shell';
import { PhoneColumn } from '@/features/shell/layout';

let root: Root | null = null;
let host: HTMLElement;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  host?.remove();
  vi.unstubAllEnvs();
});

function render(ui: ReactNode, path = '/parent/home') {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  const { hook } = memoryLocation({ path, static: true });
  act(() => root!.render(<Router hook={hook}>{ui}</Router>));
}

const backdropImage = () => host.querySelector<HTMLElement>('[data-testid="shell-backdrop-image"]');

describe('screen background', () => {
  it.each([
    ['/', ''],
    ['/trellis/', '/trellis'],
  ])('the app shell draws BRAND.backgroundImage under BASE_URL %s', (base, prefix) => {
    vi.stubEnv('BASE_URL', base);
    render(<AppShell>screen</AppShell>);
    const shell = host.querySelector('[data-testid="app-shell"]');
    const image = backdropImage();
    expect(image).not.toBeNull();
    expect(shell?.contains(image)).toBe(true);
    expect(image!.style.backgroundImage).toBe(`url("${prefix}${BRAND.backgroundImage}")`);
    expect(Number(image!.style.opacity)).toBe(BRAND.backgroundImageOpacity);
    // Fixed to the viewport, so it stays put while the screen scrolls.
    expect(host.querySelector('[data-testid="shell-backdrop"]')?.className).toContain('fixed');
  });

  it('the signed-out column draws the same BRAND background', () => {
    vi.stubEnv('BASE_URL', '/trellis/');
    render(<PhoneColumn>welcome</PhoneColumn>);
    expect(backdropImage()?.style.backgroundImage).toBe(`url("/trellis${BRAND.backgroundImage}")`);
  });

  it('is not drawn outside the role tabs', () => {
    render(<AppShell>not found</AppShell>, '/nowhere');
    expect(backdropImage()).toBeNull();
  });
});
