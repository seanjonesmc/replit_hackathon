/**
 * THE single source of truth for the Trellis brand.
 * App name, logo paths, colors, fonts, radii, spacing, demo names and
 * brand copy all live here. Nothing else in the codebase hardcodes them.
 * See /DESIGN.md -> "How to rebrand".
 */

export interface BrandColors {
  /** Money and actions: hero balance, virtual card, top bar. */
  signature: string;
  /** Text and icons on signature fills. */
  onSignature: string;
  /** Primary button fills. */
  primary: string;
  primaryHover: string;
  /** Text and icons on primary fills. */
  onPrimary: string;
  /** Pale signature for chips, tint buttons and the active tab. */
  tint: string;
  ink: string;
  inkMuted: string;
  /** Cards. */
  surface: string;
  /** The screen behind cards. */
  surfaceAlt: string;
  /** The page ground around the phone-width column. */
  surfaceGround: string;
  hairline: string;
  approved: string;
  approvedBg: string;
  rejected: string;
  rejectedBg: string;
  pending: string;
  pendingBg: string;
  chain: string;
  chainBg: string;
}

export interface BrandConfig {
  appName: string;
  tagline: string;
  logo: { mark: string; wordmark: string; alt: string };
  favicon: string;
  ogImage: string;
  colors: BrandColors;
  /**
   * Optional dark palette. Used by the design-system tokens and docs only; the
   * app has no dark mode yet.
   */
  darkColors?: BrandColors;
  fonts: { heading: string; body: string; mono: string; googleFontsUrl: string };
  radius: { pill: string; card: string; cardSm: string; tag: string; input: string };
  spacing: number[];
  demo: {
    familyName: string;
    parent: string;
    funders: string[];
    dependent: string;
    dependentAge: number;
    cardLast4: string;
    banks: string[];
  };
  copy: { verifiedLabel: string; askParentLabel: string };
}

export const BRAND: BrandConfig = {
  appName: "Trellis",
  tagline: "Family money, with guardrails.",
  logo: { mark: "/brand/logo-mark.svg", wordmark: "/brand/logo-wordmark.svg", alt: "Trellis logo" },
  favicon: "/brand/favicon.svg",
  ogImage: "/brand/og.png",
  colors: {
    signature: "#dcf26e", onSignature: "#1c2008",
    primary: "#171815", primaryHover: "#31332d", onPrimary: "#f6f5f1",
    tint: "#eef8c2",
    ink: "#171815", inkMuted: "#5d5f58",
    surface: "#ffffff", surfaceAlt: "#f6f5f1", surfaceGround: "#eceae4", hairline: "rgba(23,24,21,0.10)",
    approved: "#1d8a4a", approvedBg: "#dff3e6",
    rejected: "#c8372d", rejectedBg: "#fbe3e0",
    pending: "#b86a00", pendingBg: "#fcefd6",
    chain: "#12313b", chainBg: "#d3e7ee",
  },
  darkColors: {
    signature: "#dcf26e", onSignature: "#1c2008",
    primary: "#f1f0ea", primaryHover: "#d9d8d0", onPrimary: "#191a17",
    tint: "#2f3514",
    ink: "#f1f0ea", inkMuted: "#a5a69d",
    surface: "#23241f", surfaceAlt: "#191a17", surfaceGround: "#10110f", hairline: "rgba(241,240,234,0.12)",
    approved: "#6fd294", approvedBg: "#1d3526",
    rejected: "#ff8a7f", rejectedBg: "#3d1f1c",
    pending: "#f2b552", pendingBg: "#3a2c12",
    chain: "#e2f2f7", chainBg: "#284753",
  },
  fonts: {
    heading: "Urbanist",
    body: "Geist",
    mono: "Geist Mono",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap",
  },
  radius: { pill: "999px", card: "28px", cardSm: "22px", tag: "8px", input: "14px" },
  spacing: [4, 8, 12, 16, 24, 32, 48],
  demo: {
    familyName: "The Rivera Family",
    parent: "Maya", funders: ["Grandma Rose", "Carlos"], dependent: "Leo", dependentAge: 19,
    cardLast4: "4242",
    banks: ["Demo Bank", "Sample Credit Union", "Test Savings"],
  },
  copy: { verifiedLabel: "Verified on Monad", askParentLabel: "Ask Parent" },
};
