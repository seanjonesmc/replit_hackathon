/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#f6f5f1",
      "foreground": "#171815",
      "border": "#dbdad7",
      "card": "#ffffff",
      "cardForeground": "#171815",
      "popover": "#ffffff",
      "popoverForeground": "#171815",
      "primary": "#171815",
      "primaryForeground": "#f6f5f1",
      "secondary": "#eceae4",
      "secondaryForeground": "#171815",
      "muted": "#eceae4",
      "mutedForeground": "#5d5f58",
      "accent": "#eef8c2",
      "accentForeground": "#171815",
      "destructive": "#c8372d",
      "destructiveForeground": "#ffffff",
      "input": "#dbdad7",
      "ring": "#171815",
      "chart1": "#171815",
      "chart2": "#dcf26e",
      "chart3": "#1d8a4a",
      "chart4": "#b86a00",
      "chart5": "#c8372d",
      "sidebar": "#eceae4",
      "sidebarForeground": "#171815",
      "sidebarBorder": "#dbdad7",
      "sidebarPrimary": "#171815",
      "sidebarPrimaryForeground": "#f6f5f1",
      "sidebarAccent": "#eef8c2",
      "sidebarAccentForeground": "#171815",
      "sidebarRing": "#171815"
    },
    "dark": {
      "background": "#191a17",
      "foreground": "#f1f0ea",
      "border": "#333430",
      "card": "#23241f",
      "cardForeground": "#f1f0ea",
      "popover": "#23241f",
      "popoverForeground": "#f1f0ea",
      "primary": "#f1f0ea",
      "primaryForeground": "#191a17",
      "secondary": "#10110f",
      "secondaryForeground": "#f1f0ea",
      "muted": "#10110f",
      "mutedForeground": "#a5a69d",
      "accent": "#2f3514",
      "accentForeground": "#f1f0ea",
      "destructive": "#ff8a7f",
      "destructiveForeground": "#23241f",
      "input": "#333430",
      "ring": "#f1f0ea",
      "chart1": "#f1f0ea",
      "chart2": "#dcf26e",
      "chart3": "#6fd294",
      "chart4": "#f2b552",
      "chart5": "#ff8a7f",
      "sidebar": "#10110f",
      "sidebarForeground": "#f1f0ea",
      "sidebarBorder": "#333430",
      "sidebarPrimary": "#f1f0ea",
      "sidebarPrimaryForeground": "#191a17",
      "sidebarAccent": "#2f3514",
      "sidebarAccentForeground": "#f1f0ea",
      "sidebarRing": "#f1f0ea"
    }
  },
  "fontFamily": {
    "sans": [
      "Geist",
      "sans-serif"
    ],
    "serif": [
      "Urbanist",
      "sans-serif"
    ],
    "mono": [
      "Geist Mono",
      "monospace"
    ]
  },
  "radius": "28px",
  "spacing": "0.25rem"
} as const;

export type Tokens = typeof tokens;
export default tokens;
