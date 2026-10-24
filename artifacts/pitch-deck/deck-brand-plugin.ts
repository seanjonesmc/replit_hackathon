import type { Plugin } from 'vite';

import { BRAND } from '../../src/brand/brand.config';

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());

/** Slides are composed on a 1920px-wide reference frame, so px tokens become vw. */
const pxToVw = (value: string) => {
  const px = parseFloat(value);
  return value.endsWith('px') && px < 1000 ? `${(px / 19.2).toFixed(4)}vw` : value;
};

/** Every deck CSS variable, derived from the root BRAND config. */
export function deckBrandVariables(): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [k, v] of Object.entries(BRAND.colors)) vars[`--brand-${kebab(k)}`] = v;
  for (const [k, v] of Object.entries(BRAND.radius)) vars[`--brand-radius-${kebab(k)}`] = pxToVw(v);
  vars['--brand-font-heading'] = `"${BRAND.fonts.heading}", ui-sans-serif, system-ui, sans-serif`;
  vars['--brand-font-body'] = `"${BRAND.fonts.body}", ui-sans-serif, system-ui, sans-serif`;
  return vars;
}

/**
 * Injects BRAND-driven theme variables, fonts, favicon and title into
 * index.html at build/dev time so the deck has no second brand source.
 */
export function deckBrandPlugin(basePath: string): Plugin {
  const withBase = (p: string) => basePath.replace(/\/$/, '') + p;
  const css = Object.entries(deckBrandVariables())
    .map(([k, v]) => `${k}:${v};`)
    .join('');
  const title = `${BRAND.appName} | Pitch deck`;

  return {
    name: 'deck-brand',
    transformIndexHtml() {
      return [
        { tag: 'title', children: title, injectTo: 'head' },
        { tag: 'meta', attrs: { name: 'description', content: BRAND.tagline }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:title', content: title }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:description', content: BRAND.tagline }, injectTo: 'head' },
        { tag: 'link', attrs: { rel: 'icon', type: 'image/svg+xml', href: withBase(BRAND.favicon) }, injectTo: 'head' },
        { tag: 'link', attrs: { rel: 'stylesheet', href: BRAND.fonts.googleFontsUrl }, injectTo: 'head' },
        { tag: 'style', attrs: { 'data-brand': '' }, children: `:root{${css}}`, injectTo: 'head' },
      ];
    },
  };
}
