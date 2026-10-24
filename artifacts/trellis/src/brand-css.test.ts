// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BRAND } from '@brand/brand.config';
import { applyBrand, brandCssVariables } from '@brand/brand-css';

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());

// Expected CSS variables, derived independently from BRAND.
const expectedVars: [string, string][] = [
  ...Object.entries(BRAND.colors).map(([k, v]): [string, string] => [`--color-${kebab(k)}`, v]),
  ...Object.entries(BRAND.radius).map(([k, v]): [string, string] => [`--radius-${kebab(k)}`, v]),
  ...BRAND.spacing.map((n, i): [string, string] => [`--space-${i + 1}`, `${n}px`]),
];

const head = () => document.head;
const content = (selector: string) => head().querySelector(selector)?.getAttribute('content');

beforeEach(() => {
  document.head.innerHTML = '';
  document.documentElement.removeAttribute('style');
  document.title = '';
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('brandCssVariables', () => {
  it.each(expectedVars)('maps BRAND to %s', (name, value) => {
    expect(brandCssVariables()[name]).toBe(value);
  });

  it('includes every BRAND color, radius and spacing step', () => {
    const vars = brandCssVariables();
    for (const [name] of expectedVars) expect(vars).toHaveProperty([name]);
    expect(Object.keys(BRAND.colors).length + Object.keys(BRAND.radius).length + BRAND.spacing.length).toBe(
      expectedVars.length,
    );
  });

  it('uses the BRAND heading and body fonts', () => {
    const vars = brandCssVariables();
    expect(vars['--font-heading']).toContain(`"${BRAND.fonts.heading}"`);
    expect(vars['--font-body']).toContain(`"${BRAND.fonts.body}"`);
  });
});

describe('applyBrand', () => {
  it('writes every CSS variable onto the document root', () => {
    applyBrand();
    const style = document.documentElement.style;
    for (const [name, value] of Object.entries(brandCssVariables())) {
      expect(style.getPropertyValue(name)).toBe(value);
    }
  });

  it.each([
    ['/', ''],
    ['/trellis/', '/trellis'],
    ['/nested/app/', '/nested/app'],
  ])('writes title, meta tags, favicon and fonts under BASE_URL %s', (base, prefix) => {
    vi.stubEnv('BASE_URL', base);
    applyBrand();

    expect(document.title).toBe(`${BRAND.appName} | ${BRAND.tagline}`);
    expect(content('meta[name="description"]')).toBe(BRAND.tagline);
    expect(content('meta[name="theme-color"]')).toBe(BRAND.colors.signature);
    expect(content('meta[property="og:title"]')).toBe(BRAND.appName);
    expect(content('meta[property="og:description"]')).toBe(BRAND.tagline);
    expect(content('meta[property="og:image"]')).toBe(prefix + BRAND.ogImage);
    expect(content('meta[name="twitter:title"]')).toBe(BRAND.appName);
    expect(content('meta[name="twitter:description"]')).toBe(BRAND.tagline);

    const icon = head().querySelector('link[rel="icon"]');
    expect(icon?.getAttribute('href')).toBe(prefix + BRAND.favicon);
    expect(icon?.getAttribute('type')).toBe('image/svg+xml');

    const fonts = head().querySelector('link[data-brand-fonts]');
    expect(fonts?.getAttribute('rel')).toBe('stylesheet');
    expect(fonts?.getAttribute('href')).toBe(BRAND.fonts.googleFontsUrl);
  });

  it('updates existing index.html tags instead of duplicating them', () => {
    vi.stubEnv('BASE_URL', '/trellis/');
    // Tags as the build-time index.html would already contain them.
    head().innerHTML =
      '<meta property="og:image" content="/stale.png">' + '<link rel="icon" href="/stale.svg">';

    applyBrand();
    applyBrand();

    const selectors = [
      'title',
      'meta[name="description"]',
      'meta[name="theme-color"]',
      'meta[property="og:title"]',
      'meta[property="og:description"]',
      'meta[property="og:image"]',
      'meta[name="twitter:title"]',
      'meta[name="twitter:description"]',
      'link[rel="icon"]',
      'link[data-brand-fonts]',
    ];
    for (const selector of selectors) {
      expect(head().querySelectorAll(selector), selector).toHaveLength(1);
    }
    expect(head().children).toHaveLength(selectors.length);
    expect(content('meta[property="og:image"]')).toBe('/trellis' + BRAND.ogImage);
    expect(head().querySelector('link[rel="icon"]')?.getAttribute('href')).toBe('/trellis' + BRAND.favicon);
  });
});
