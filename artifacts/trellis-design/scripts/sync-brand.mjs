// BRAND remains the authoring source; DTCG is a generated interchange format.
import { BRAND } from "../../../src/brand/brand.config.ts";
import { readFileSync, writeFileSync } from "node:fs";
const url = new URL("../tokens.json", import.meta.url);
const t = JSON.parse(readFileSync(url, "utf8"));
const c = BRAND.colors;
const d = BRAND.darkColors;
if (!d) throw new Error("sync-brand: BRAND.darkColors is required for the design-system dark mode.");
// Opaque equivalent of a translucent hairline, since tokens are hex.
const blend = (a, b, weight) => "#" + [0, 2, 4].map(i =>
  Math.round(parseInt(a.slice(i + 1, i + 3), 16) * (1 - weight) + parseInt(b.slice(i + 1, i + 3), 16) * weight).toString(16).padStart(2, "0")).join("");
// Surface layering: page = surfaceAlt (screen), cards = surface, bands/sidebar = surfaceGround (stone).
const roles = (p) => {
  const line = blend(p.surfaceAlt, p.ink, .12);
  return {
    background:p.surfaceAlt, foreground:p.ink, border:line,
    card:p.surface,cardForeground:p.ink,popover:p.surface,popoverForeground:p.ink,
    primary:p.primary,primaryForeground:p.onPrimary,secondary:p.surfaceGround,secondaryForeground:p.ink,
    muted:p.surfaceGround,mutedForeground:p.inkMuted,accent:p.tint,accentForeground:p.ink,
    destructive:p.rejected,destructiveForeground:p.surface,input:line,ring:p.primary,
    chart1:p.primary,chart2:p.signature,chart3:p.approved,chart4:p.pending,chart5:p.rejected,
    sidebar:p.surfaceGround,sidebarForeground:p.ink,sidebarBorder:line,
    sidebarPrimary:p.primary,sidebarPrimaryForeground:p.onPrimary,sidebarAccent:p.tint,sidebarAccentForeground:p.ink,sidebarRing:p.primary,
    // App-layer virtual debit card face (gradient stops, text on face, EMV chip).
    cardFace:p.cardFace,cardFaceEnd:p.cardFaceEnd,onCardFace:p.onCardFace,cardChip:p.cardChip
  };
};
for (const [mode, values] of Object.entries({light:roles(c),dark:roles(d)}))
  t.color[mode] = Object.fromEntries(Object.entries(values).map(([k,v])=>[k,{$value:v}]));
t.$description = "Generated from root BRAND by scripts/sync-brand.mjs. Light mode maps BRAND.colors; dark mode maps the explicit BRAND.darkColors palette from the app mockup.";
t.typography.fontFamily.sans.$value = [BRAND.fonts.body,"sans-serif"];
t.typography.fontFamily.serif.$value = [BRAND.fonts.heading,"sans-serif"];
t.typography.fontFamily.mono.$value = [BRAND.fonts.mono,"monospace"];
t.radius.base.$value = BRAND.radius.card;
const htmlUrl = new URL("../index.html", import.meta.url);
const escHtml = (s) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const dsName = escHtml(`${BRAND.appName} Design System`);
writeFileSync(htmlUrl, readFileSync(htmlUrl,"utf8")
  .replace(/https:\/\/fonts\.googleapis\.com\/css2[^"]+/g,BRAND.fonts.googleFontsUrl)
  .replace(/<title>[^<]*<\/title>/,`<title>${dsName}</title>`)
  .replace(/(<meta name="description" content=")[^"]*(")/,`$1${dsName} — design system preview built on Replit.$2`));
writeFileSync(url,JSON.stringify(t,null,2)+"\n");
writeFileSync(new URL("../src/brand-snapshot.tsx",import.meta.url),
  "// Generated from root BRAND. Do not edit.\nexport const brand = "+JSON.stringify({name:BRAND.appName,tagline:BRAND.tagline,colors:c,darkColors:d,radius:BRAND.radius,fonts:BRAND.fonts},null,2)+" as const;\n");
const vars = (p) => Object.entries(p).map(([k,v])=>`--brand-${k}: ${v};`).join("");
writeFileSync(new URL("../src/brand-vars.css",import.meta.url),
  "/* Generated from root BRAND. */\n:root {"+vars(c)+Object.entries(BRAND.radius).map(([k,v])=>`--brand-radius-${k}: ${v};`).join("")+"}\n.dark {"+vars(d)+"}\n");
