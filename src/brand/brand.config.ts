/**
 * THE single source of truth for the Trellis brand.
 * App name, logo paths, colors, fonts, radii, spacing, demo names and
 * brand copy all live here. Nothing else in the codebase hardcodes them.
 * See /DESIGN.md -> "How to rebrand".
 */

export interface BrandColors {
  signature: string;
  primary: string;
  primaryHover: string;
  tint: string;
  ink: string;
  inkMuted: string;
  surface: string;
  surfaceAlt: string;
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
  fonts: { heading: string; body: string; googleFontsUrl: string };
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
    signature: "#008cff", primary: "#0074de", primaryHover: "#005ba4", tint: "#deefff",
    ink: "#000000", inkMuted: "#2f3033",
    surface: "#ffffff", surfaceAlt: "#f1efea", hairline: "rgba(0,0,0,0.12)",
    approved: "#16A34A", approvedBg: "#DCFCE7",
    rejected: "#DC2626", rejectedBg: "#FEE2E2",
    pending: "#D97706", pendingBg: "#FEF3C7",
    chain: "#0074de", chainBg: "#deefff",
  },
  fonts: {
    heading: "Inter",
    body: "Inter",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  },
  radius: { pill: "1000px", card: "32px", cardSm: "24px", tag: "4px", input: "8px" },
  spacing: [4, 8, 12, 16, 24, 32, 48],
  demo: {
    familyName: "The Rivera Family",
    parent: "Maya", funders: ["Grandma Rose", "Carlos"], dependent: "Leo", dependentAge: 19,
    cardLast4: "4242",
    banks: ["Demo Bank", "Sample Credit Union", "Test Savings"],
  },
  copy: { verifiedLabel: "Verified on Monad", askParentLabel: "Ask Parent" },
};
