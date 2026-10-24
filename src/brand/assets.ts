import { BRAND } from "./brand.config";

/**
 * Build-time SVG generators. The Vite brand plugin writes these into
 * /public/brand on start. Files containing ASSET_MARKER are regenerated
 * from BRAND every run; files you replace by hand (without the marker) are
 * left untouched.
 */
export const ASSET_MARKER = "generated-from-brand-config";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * The "family sprout" mark on a 64×64 grid: a top leaf, two side leaves and
 * two stems. Exported so the app can draw the same glyph inline.
 */
export const SPROUT_PATHS = {
  topLeaf: "M32 10C37.5 12.5 41.5 16.5 41.5 21.5C41.5 26.5 37 30.5 32 33C27 30.5 22.5 26.5 22.5 21.5C22.5 16.5 26.5 12.5 32 10Z",
  sides: [
    "M30.5 47.5L30.5 40C30.5 33 25 27.5 17 26.5C14 26.1 11.5 26.2 10 26.6C8.8 27 8.3 28 8.4 29.5C8.9 38.5 13.5 46.5 22 47.8C25.5 48.3 28.5 48 30.5 47.5Z",
    "M33.5 47.5L33.5 40C33.5 33 39 27.5 47 26.5C50 26.1 52.5 26.2 54 26.6C55.2 27 55.7 28 55.6 29.5C55.1 38.5 50.5 46.5 42 47.8C38.5 48.3 35.5 48 33.5 47.5Z",
    "M27.5 44H30.5V54.5A1.5 1.5 0 0 1 27.5 54.5Z",
    "M33.5 44H36.5V54.5A1.5 1.5 0 0 1 33.5 54.5Z",
  ],
} as const;

const sprout = (leaf: string, body: string, transform = "") => `
  <g${transform ? ` transform="${transform}"` : ""}>
    <path d="${SPROUT_PATHS.topLeaf}" fill="${leaf}"/>
    ${SPROUT_PATHS.sides.map((d) => `<path d="${d}" fill="${body}"/>`).join("")}
  </g>`;

/** App icon: the sprout in one color on a signature tile. */
export function logoMarkSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><!-- ${ASSET_MARKER} -->
  <title>${esc(BRAND.logo.alt)}</title>
  <rect width="64" height="64" rx="18" fill="${BRAND.colors.signature}"/>${sprout(BRAND.colors.onSignature, BRAND.colors.onSignature, "translate(3.2 2.3) scale(0.9)")}
</svg>
`;
}

export function faviconSvg() {
  return logoMarkSvg();
}

/** Primary lockup: signature top leaf, ink side leaves, no tile, then the name. */
export function logoWordmarkSvg() {
  const width = 76 + BRAND.appName.length * 25;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 64" width="${width}" height="64"><!-- ${ASSET_MARKER} -->
  <title>${esc(BRAND.logo.alt)}</title>
  ${sprout(BRAND.colors.signature, BRAND.colors.ink, "translate(0 -4) scale(1.06)")}
  <text x="70" y="47" font-family="${esc(BRAND.fonts.heading)}, ui-sans-serif, system-ui, sans-serif" font-size="42" font-weight="700" letter-spacing="-1" fill="${BRAND.colors.ink}">${esc(BRAND.appName)}</text>
</svg>
`;
}
