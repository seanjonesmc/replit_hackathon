import { BRAND } from "./brand.config";

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());

/**
 * Every CSS variable the app uses, generated from BRAND. Light palette only:
 * BRAND.darkColors feeds the design-system tokens, not the app.
 */
export function brandCssVariables(): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [k, v] of Object.entries(BRAND.colors)) vars[`--color-${kebab(k)}`] = v;
  for (const [k, v] of Object.entries(BRAND.radius)) vars[`--radius-${kebab(k)}`] = v;
  BRAND.spacing.forEach((n, i) => (vars[`--space-${i + 1}`] = `${n}px`));
  vars["--font-heading"] = `"${BRAND.fonts.heading}", ui-sans-serif, system-ui, sans-serif`;
  vars["--font-body"] = `"${BRAND.fonts.body}", ui-sans-serif, system-ui, sans-serif`;
  vars["--font-mono"] = `"${BRAND.fonts.mono}", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  return vars;
}

function upsert(selector: string, create: () => HTMLElement, set: (el: HTMLElement) => void) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  set(el);
}

// Literal `import.meta.env` so Vite (build) and Vitest (stubEnv) both see it.
const withBase = (p: string) => import.meta.env.BASE_URL.replace(/\/$/, "") + p;

/** Called once at startup: writes CSS variables + metadata from BRAND. */
export function applyBrand() {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(brandCssVariables())) root.style.setProperty(k, v);

  document.title = `${BRAND.appName} | ${BRAND.tagline}`;
  const meta = (attr: "name" | "property", key: string, content: string) =>
    upsert(`meta[${attr}="${key}"]`, () => {
      const m = document.createElement("meta");
      m.setAttribute(attr, key);
      return m;
    }, (m) => m.setAttribute("content", content));

  meta("name", "description", BRAND.tagline);
  meta("name", "theme-color", BRAND.colors.signature);
  meta("property", "og:title", BRAND.appName);
  meta("property", "og:description", BRAND.tagline);
  meta("property", "og:image", withBase(BRAND.ogImage));
  meta("name", "twitter:title", BRAND.appName);
  meta("name", "twitter:description", BRAND.tagline);

  upsert('link[rel="icon"]', () => {
    const l = document.createElement("link");
    l.setAttribute("rel", "icon");
    return l;
  }, (l) => {
    l.setAttribute("type", "image/svg+xml");
    l.setAttribute("href", withBase(BRAND.favicon));
  });

  upsert('link[data-brand-fonts]', () => {
    const l = document.createElement("link");
    l.setAttribute("rel", "stylesheet");
    l.setAttribute("data-brand-fonts", "");
    return l;
  }, (l) => l.setAttribute("href", BRAND.fonts.googleFontsUrl));
}
