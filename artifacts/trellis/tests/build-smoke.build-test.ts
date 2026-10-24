import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { BRAND } from '../../../src/brand/brand.config';

/**
 * Production build smoke check (opt-in: `pnpm test:build`).
 *
 * Runs the real `vite build` with the artifact's own config and a non-root
 * BASE_PATH, so config-level regressions (publicDir, base, plugin order) that
 * the isolated plugin tests cannot see are caught: brand files missing from the
 * output, or index.html links that ignore the base path.
 */

const artifactDir = path.resolve(import.meta.dirname, '..');
const workspaceRoot = path.resolve(artifactDir, '..', '..');
const canonicalPublic = path.join(workspaceRoot, 'public');
const outDir = path.join(workspaceRoot, 'generated-artifacts', 'trellis-build-smoke');
const viteBin = path.join(artifactDir, 'node_modules', '.bin', 'vite');

const BASE_PATH = '/smoke/sub-path/';
const prefix = BASE_PATH.replace(/\/$/, '');

const brandAssetPaths = [BRAND.logo.mark, BRAND.logo.wordmark, BRAND.favicon, BRAND.ogImage];

let html = '';
let bundledJs = '';

function attr(selector: RegExp): string {
  const match = html.match(selector);
  if (!match) throw new Error(`no match for ${selector} in built index.html`);
  return match[1];
}

beforeAll(() => {
  fs.rmSync(outDir, { recursive: true, force: true });
  execFileSync(viteBin, ['build', '--config', 'vite.config.ts', '--outDir', outDir, '--emptyOutDir', '--logLevel', 'warn'], {
    cwd: artifactDir,
    env: { ...process.env, NODE_ENV: 'production', BASE_PATH, PORT: '4173' },
    stdio: 'pipe',
  });
  html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
  const assetsDir = path.join(outDir, 'assets');
  bundledJs = fs
    .readdirSync(assetsDir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => fs.readFileSync(path.join(assetsDir, f), 'utf8'))
    .join('\n');
}, 180_000);

describe(`trellis production build under BASE_PATH=${BASE_PATH}`, () => {
  it('fills every brand placeholder', () => {
    expect(html).not.toMatch(/%BRAND_[A-Z_]+%/);
    expect(html).toContain(`<title>${BRAND.appName} | ${BRAND.tagline}</title>`);
  });

  it('prefixes the favicon link with the base path', () => {
    expect(attr(/<link rel="icon"[^>]*href="([^"]*)"/)).toBe(prefix + BRAND.favicon);
  });

  it('prefixes og:image with the base path', () => {
    expect(attr(/<meta property="og:image" content="([^"]*)"/)).toBe(prefix + BRAND.ogImage);
  });

  it('prefixes the bundled entry script with the base path', () => {
    expect(attr(/<script type="module"[^>]*src="([^"]*)"/).startsWith(`${BASE_PATH}assets/`)).toBe(true);
  });

  it('ships the /brand fallback but not the development-only preview or its samples', () => {
    // Test ids are kept as string literals, so they mark which code was bundled.
    expect(bundledJs).toContain('text-unavailable-title');
    for (const marker of ['banner-dev-preview', 'label-preview-data', 'card-hero-balance', 'card-virtual']) {
      expect(bundledJs, `${marker} leaked into the production bundle`).not.toContain(marker);
    }
  });

  it.each(brandAssetPaths)('ships %s from the canonical root public/ folder', (p) => {
    const built = path.join(outDir, p);
    expect(fs.existsSync(built), `${p} missing from build output`).toBe(true);
    const bytes = fs.readFileSync(built);
    expect(bytes.length).toBeGreaterThan(0);
    expect(bytes.equals(fs.readFileSync(path.join(canonicalPublic, p)))).toBe(true);
  });
});
