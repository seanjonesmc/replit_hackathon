import { afterEach, describe, expect, it, vi } from 'vitest';
import { BRAND } from '@brand/brand.config';
import { brandAsset } from './primitives';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('brandAsset', () => {
  it.each([
    ['/', ''],
    ['/trellis/', '/trellis'],
    ['/nested/app/', '/nested/app'],
  ])('resolves BRAND asset paths under BASE_URL %s', (base, prefix) => {
    vi.stubEnv('BASE_URL', base);
    expect(brandAsset(BRAND.logo.mark)).toBe(`${prefix}${BRAND.logo.mark}`);
    expect(brandAsset(BRAND.logo.wordmark)).toBe(`${prefix}${BRAND.logo.wordmark}`);
    expect(brandAsset(BRAND.favicon)).not.toContain('//');
  });
});
