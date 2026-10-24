/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#ffffff",
      "foreground": "#000000",
      "border": "#e0e0e0",
      "card": "#ffffff",
      "cardForeground": "#000000",
      "popover": "#ffffff",
      "popoverForeground": "#000000",
      "primary": "#0074de",
      "primaryForeground": "#ffffff",
      "secondary": "#f1efea",
      "secondaryForeground": "#000000",
      "muted": "#f1efea",
      "mutedForeground": "#2f3033",
      "accent": "#deefff",
      "accentForeground": "#000000",
      "destructive": "#DC2626",
      "destructiveForeground": "#ffffff",
      "input": "#e0e0e0",
      "ring": "#0074de",
      "chart1": "#0074de",
      "chart2": "#005ba4",
      "chart3": "#16A34A",
      "chart4": "#D97706",
      "chart5": "#DC2626",
      "sidebar": "#f1efea",
      "sidebarForeground": "#000000",
      "sidebarBorder": "#e0e0e0",
      "sidebarPrimary": "#0074de",
      "sidebarPrimaryForeground": "#ffffff",
      "sidebarAccent": "#deefff",
      "sidebarAccentForeground": "#000000",
      "sidebarRing": "#0074de"
    },
    "dark": {
      "background": "#111111",
      "foreground": "#ffffff",
      "border": "#424242",
      "card": "#1a1a1a",
      "cardForeground": "#ffffff",
      "popover": "#1a1a1a",
      "popoverForeground": "#ffffff",
      "primary": "#0074de",
      "primaryForeground": "#ffffff",
      "secondary": "#2f3033",
      "secondaryForeground": "#ffffff",
      "muted": "#2f3033",
      "mutedForeground": "#bfbfbf",
      "accent": "#002343",
      "accentForeground": "#ffffff",
      "destructive": "#DC2626",
      "destructiveForeground": "#ffffff",
      "input": "#666666",
      "ring": "#0074de",
      "chart1": "#0074de",
      "chart2": "#005ba4",
      "chart3": "#16A34A",
      "chart4": "#D97706",
      "chart5": "#DC2626",
      "sidebar": "#161616",
      "sidebarForeground": "#ffffff",
      "sidebarBorder": "#424242",
      "sidebarPrimary": "#0074de",
      "sidebarPrimaryForeground": "#ffffff",
      "sidebarAccent": "#002343",
      "sidebarAccentForeground": "#ffffff",
      "sidebarRing": "#0074de"
    }
  },
  "fontFamily": {
    "sans": [
      "Inter",
      "sans-serif"
    ],
    "serif": [
      "Inter",
      "sans-serif"
    ],
    "mono": [
      "monospace"
    ]
  },
  "radius": "32px",
  "spacing": "0.25rem"
} as const;

export type Tokens = typeof tokens;
export default tokens;
