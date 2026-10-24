/**
 * Every brand value this project has used, current and past. The workspace
 * brand-values test searches application source for all of them, so after a
 * rebrand an old app name, demo identity, bank name or font left behind in a
 * screen is still caught.
 *
 * When you rebrand, add the new values here (the test lists any that are
 * missing). Never remove entries. The app reads brand values from BRAND only;
 * do not import this file from application code.
 *
 * Hex colors are not listed: every hex color outside src/brand/ is flagged.
 */

export interface BrandHistory {
  appNames: string[];
  /** Family name, parent, funders and dependent. */
  demoNames: string[];
  bankNames: string[];
  /** Font family names and font stylesheet URLs. */
  fonts: string[];
  /** BRAND colors (light and dark) written in a non-hex notation, such as rgba(). */
  colors: string[];
}

export const BRAND_HISTORY: BrandHistory = {
  appNames: ["Trellis"],
  demoNames: ["The Rivera Family", "Maya", "Grandma Rose", "Carlos", "Leo"],
  bankNames: ["Demo Bank", "Sample Credit Union", "Test Savings"],
  fonts: [
    "Inter",
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
    "Urbanist",
    "Geist",
    "Geist Mono",
    "https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap",
  ],
  colors: ["rgba(0,0,0,0.12)", "rgba(23,24,21,0.10)", "rgba(241,240,234,0.12)"],
};
