import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';
import { BRAND } from '../../src/brand/brand.config';
import { ASSET_MARKER, faviconSvg, logoMarkSvg, logoWordmarkSvg } from '../../src/brand/assets';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Generates /public/brand SVGs from BRAND and fills index.html metadata. */
export function brandPlugin(publicDir: string, base: string): Plugin {
  const writeAssets = () => {
    const files: [string, string][] = [
      [BRAND.logo.mark, logoMarkSvg()],
      [BRAND.logo.wordmark, logoWordmarkSvg()],
      [BRAND.favicon, faviconSvg()],
    ];
    for (const [rel, content] of files) {
      const target = path.join(publicDir, rel);
      if (fs.existsSync(target) && !fs.readFileSync(target, 'utf8').includes(ASSET_MARKER)) continue;
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
    }
  };
  const url = (p: string) => base.replace(/\/$/, '') + p;

  return {
    name: 'trellis-brand',
    buildStart() {
      writeAssets();
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html
          .replace(/%BRAND_TITLE%/g, esc(`${BRAND.appName} | ${BRAND.tagline}`))
          .replace(/%BRAND_NAME%/g, esc(BRAND.appName))
          .replace(/%BRAND_TAGLINE%/g, esc(BRAND.tagline))
          .replace(/%BRAND_FAVICON%/g, url(BRAND.favicon))
          .replace(/%BRAND_OG%/g, url(BRAND.ogImage))
          .replace(/%BRAND_THEME%/g, BRAND.colors.signature)
          .replace(/%BRAND_FONTS_URL%/g, esc(BRAND.fonts.googleFontsUrl));
      },
    },
  };
}
