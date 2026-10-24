// BRAND remains the authoring source; DTCG is a generated interchange format.
import { BRAND } from "../../../src/brand/brand.config.ts";
import { readFileSync, writeFileSync } from "node:fs";
const url = new URL("../tokens.json", import.meta.url);
const t = JSON.parse(readFileSync(url, "utf8"));
const c = BRAND.colors;
const blend = (a, b, weight) => "#" + [0, 2, 4].map(i =>
  Math.round(parseInt(a.slice(i + 1, i + 3), 16) * (1 - weight) + parseInt(b.slice(i + 1, i + 3), 16) * weight).toString(16).padStart(2, "0")).join("");
const light = {
  background:c.surface, foreground:c.ink, border:blend(c.surface,c.ink,.12),
  card:c.surface,cardForeground:c.ink,popover:c.surface,popoverForeground:c.ink,
  primary:c.primary,primaryForeground:c.surface,secondary:c.surfaceAlt,secondaryForeground:c.ink,
  muted:c.surfaceAlt,mutedForeground:c.inkMuted,accent:c.tint,accentForeground:c.ink,
  destructive:c.rejected,destructiveForeground:c.surface,input:blend(c.surface,c.ink,.12),ring:c.primary,
  chart1:c.primary,chart2:c.primaryHover,chart3:c.approved,chart4:c.pending,chart5:c.rejected,
  sidebar:c.surfaceAlt,sidebarForeground:c.ink,sidebarBorder:blend(c.surface,c.ink,.12),
  sidebarPrimary:c.primary,sidebarPrimaryForeground:c.surface,sidebarAccent:c.tint,sidebarAccentForeground:c.ink,sidebarRing:c.primary
};
const dark = {...light,background:blend(c.ink,c.surface,.065),foreground:c.surface,
  card:blend(c.ink,c.surface,.1),cardForeground:c.surface,popover:blend(c.ink,c.surface,.1),popoverForeground:c.surface,
  border:blend(c.ink,c.surface,.26),input:blend(c.ink,c.surface,.4),secondary:c.inkMuted,secondaryForeground:c.surface,
  muted:c.inkMuted,mutedForeground:blend(c.ink,c.surface,.75),accent:blend(c.ink,c.primary,.3),accentForeground:c.surface,
  sidebar:blend(c.ink,c.surface,.085),sidebarForeground:c.surface,sidebarBorder:blend(c.ink,c.surface,.26),
  sidebarAccent:blend(c.ink,c.primary,.3),sidebarAccentForeground:c.surface};
for (const [mode, values] of Object.entries({light,dark}))
  t.color[mode] = Object.fromEntries(Object.entries(values).map(([k,v])=>[k,{$value:v}]));
t.$description = "Generated from root BRAND by scripts/sync-brand.mjs. Dark mode is a derived app extension, not a Venmo reference mode.";
t.typography.fontFamily.sans.$value = [BRAND.fonts.body,"sans-serif"];
t.typography.fontFamily.serif.$value = [BRAND.fonts.heading,"sans-serif"];
t.typography.fontFamily.mono.$value = ["monospace"];
t.radius.base.$value = BRAND.radius.card;
const htmlUrl = new URL("../index.html", import.meta.url);
writeFileSync(htmlUrl, readFileSync(htmlUrl,"utf8").replace(/https:\/\/fonts\.googleapis\.com\/css2[^"]+/g,BRAND.fonts.googleFontsUrl));
writeFileSync(url,JSON.stringify(t,null,2)+"\n");
writeFileSync(new URL("../src/brand-snapshot.tsx",import.meta.url),
  "// Generated from root BRAND. Do not edit.\nexport const brand = "+JSON.stringify({name:BRAND.appName,tagline:BRAND.tagline,colors:c,radius:BRAND.radius,fonts:BRAND.fonts},null,2)+" as const;\n");
writeFileSync(new URL("../src/brand-vars.css",import.meta.url),
  "/* Generated from root BRAND. */\n:root {"+Object.entries(c).map(([k,v])=>`--brand-${k}: ${v};`).join("")+Object.entries(BRAND.radius).map(([k,v])=>`--brand-radius-${k}: ${v};`).join("")+"}\n");
