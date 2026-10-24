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

const lattice = (stroke: string) => `
  <g fill="none" stroke="${stroke}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M32 52V22"/>
    <path d="M18 42l14-12 14 12"/>
    <path d="M22 30l10-8 10 8"/>
  </g>
  <path d="M32 21c0-6 4-9.5 9.5-9.5 0 5.5-3.5 9.5-9.5 9.5z" fill="${stroke}"/>`;

export function logoMarkSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><!-- ${ASSET_MARKER} -->
  <title>${esc(BRAND.logo.alt)}</title>
  <rect width="64" height="64" rx="18" fill="${BRAND.colors.signature}"/>${lattice(BRAND.colors.onSignature)}
</svg>
`;
}

export function faviconSvg() {
  return logoMarkSvg();
}

export function logoWordmarkSvg() {
  const width = 84 + BRAND.appName.length * 25;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 64" width="${width}" height="64"><!-- ${ASSET_MARKER} -->
  <title>${esc(BRAND.logo.alt)}</title>
  <rect width="64" height="64" rx="18" fill="${BRAND.colors.signature}"/>${lattice(BRAND.colors.onSignature)}
  <text x="78" y="44" font-family="${esc(BRAND.fonts.heading)}, ui-sans-serif, system-ui, sans-serif" font-size="38" font-weight="600" letter-spacing="-1.2" fill="${BRAND.colors.ink}">${esc(BRAND.appName)}</text>
</svg>
`;
}
