import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { BRAND } from '../../src/brand/brand.config';
import { ASSET_MARKER } from '../../src/brand/assets';
import { brandPlugin } from './vite-brand-plugin';

const workspaceRoot = path.resolve(import.meta.dirname, '..', '..');
const canonicalPublic = path.join(workspaceRoot, 'public');
const indexHtml = fs.readFileSync(path.join(import.meta.dirname, 'index.html'), 'utf8');

// Every brand asset path the app references, read from the single BRAND source.
const brandAssetPaths = [BRAND.logo.mark, BRAND.logo.wordmark, BRAND.favicon, BRAND.ogImage];

/** Runs the plugin's index.html transform the way Vite would. */
function transform(base: string, html = indexHtml): string {
  const hook = brandPlugin(canonicalPublic, base).transformIndexHtml;
  if (!hook || typeof hook === 'function') throw new Error('expected an ordered transformIndexHtml hook');
  return (hook.handler as unknown as (html: string) => string)(html);
}

function attr(html: string, selector: RegExp): string {
  const match = html.match(selector);
  if (!match) throw new Error(`no match for ${selector}`);
  return match[1];
}

const faviconHref = (html: string) => attr(html, /<link rel="icon"[^>]*href="([^"]*)"/);
const ogImage = (html: string) => attr(html, /<meta property="og:image" content="([^"]*)"/);

describe('BRAND asset paths', () => {
  it.each(brandAssetPaths)('%s is root-relative so it can be prefixed with a base path', (p) => {
    expect(p.startsWith('/')).toBe(true);
    expect(p.startsWith('//')).toBe(false);
  });

  it.each(brandAssetPaths)('%s exists in the canonical root public/ folder', (p) => {
    expect(fs.existsSync(path.join(canonicalPublic, p))).toBe(true);
  });

  it('are not duplicated into the artifact public folder', () => {
    for (const p of brandAssetPaths) {
      expect(fs.existsSync(path.join(import.meta.dirname, 'public', p))).toBe(false);
    }
  });
});

describe('index.html brand metadata', () => {
  it('fills every placeholder from BRAND', () => {
    const html = transform('/');
    expect(html).not.toMatch(/%BRAND_[A-Z_]+%/);
    expect(html).toContain(`content="${BRAND.colors.signature}"`);
  });

  it.each([
    ['/', ''],
    ['/trellis/', '/trellis'],
    ['/nested/app/', '/nested/app'],
    ['/no-trailing', '/no-trailing'],
  ])('prefixes favicon and og:image with base %s', (base, prefix) => {
    const html = transform(base);
    expect(faviconHref(html)).toBe(`${prefix}${BRAND.favicon}`);
    expect(ogImage(html)).toBe(`${prefix}${BRAND.ogImage}`);
    expect(faviconHref(html)).not.toContain('//');
  });

  it('escapes brand text inserted into HTML', () => {
    const html = transform('/', '<title>%BRAND_NAME%</title><meta content="%BRAND_TAGLINE%">');
    const escape = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    expect(html).toBe(`<title>${escape(BRAND.appName)}</title><meta content="${escape(BRAND.tagline)}">`);
  });
});

describe('generated brand SVGs', () => {
  const tempDirs: string[] = [];
  const makePublicDir = () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trellis-brand-'));
    tempDirs.push(dir);
    return dir;
  };
  const runBuildStart = (publicDir: string) => {
    const hook = brandPlugin(publicDir, '/').buildStart;
    const fn = typeof hook === 'function' ? hook : hook?.handler;
    if (!fn) throw new Error('expected a buildStart hook');
    (fn as unknown as () => void)();
  };

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
  });

  it('writes logo, wordmark, and favicon at the BRAND paths', () => {
    const publicDir = makePublicDir();
    runBuildStart(publicDir);
    for (const p of [BRAND.logo.mark, BRAND.logo.wordmark, BRAND.favicon]) {
      const svg = fs.readFileSync(path.join(publicDir, p), 'utf8');
      expect(svg).toContain(ASSET_MARKER);
      expect(svg).toContain(BRAND.colors.signature);
    }
  });

  it('leaves hand-replaced assets (without the marker) untouched', () => {
    const publicDir = makePublicDir();
    const custom = '<svg><!-- designer supplied --></svg>';
    const target = path.join(publicDir, BRAND.logo.mark);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, custom);
    runBuildStart(publicDir);
    expect(fs.readFileSync(target, 'utf8')).toBe(custom);
  });
});
