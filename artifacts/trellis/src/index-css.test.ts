import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { brandCssVariables } from '@brand/brand-css';

/**
 * A var() that resolves to nothing voids its whole declaration (for example
 * the safe-area padding that keeps the role switcher clear of the notch), and
 * the DOM tests cannot see that. So every variable index.css reads must be
 * declared in index.css itself or set from BRAND at startup.
 */
const css = fs.readFileSync(path.join(import.meta.dirname, 'index.css'), 'utf8');

describe('index.css variables', () => {
  it('reads only variables that are defined or carry a fallback', () => {
    const declared = new Set([...css.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
    const fromBrand = new Set(Object.keys(brandCssVariables()));
    const undefinedVars = [...css.matchAll(/var\(\s*(--[a-z0-9-]+)\s*(,)?/g)]
      .filter(([, name, fallback]) => !fallback && !declared.has(name) && !fromBrand.has(name))
      .map(([, name]) => name);
    expect(undefinedVars).toEqual([]);
  });

  it('pads the top and bottom bars for the phone safe areas', () => {
    expect(css).toMatch(/\.pt-safe\s*\{[^}]*env\(safe-area-inset-top/);
    expect(css).toMatch(/\.pb-safe\s*\{[^}]*env\(safe-area-inset-bottom/);
  });
});
