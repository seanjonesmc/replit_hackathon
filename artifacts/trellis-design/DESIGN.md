---
version: alpha
name: Venmo
website: "https://venmo.com"
description: >-
  Venmo's marketing canvas is the social-payments counterpoint to enterprise fintech — a sand-and-white catalogue carrying Athletics at weight 500 from a 33px section opener up to a 63px hero ("Pay friends.") with `letterSpacing: -1.89px`, paired with Scto Grotesk A at weight 400 for every body row. The brand's signature blue `#008cff` lives in the page header gradient and the rotating hero card rather than as a button fill — buttons render as a 1000px pill at `#0074de` or as a `#000000` outline pill. Surfaces alternate `#ffffff` and a warm sand `#f1efea`, photography of friends holding phones replaces typographic muscle, and the 32px corner radius carries every product tile in the "Venmo everything" grid.
seo:
  title: "Venmo Design System: Venmo Blue and Athletics Headlines"
  metaDescription: "Sand-and-white pages, signature blue #008cff in the header gradient, Athletics 500 and Scto Grotesk A: Venmo as a DESIGN.md for React and AI tools."
  highlights:
    - "Single voltage blue — `#008cff` carries the header gradient and rotating hero card, never the primary CTA fill"
    - "Athletics 500 across every heading — 33px section opener up to a 63px hero with `letterSpacing: -1.89px`"
    - "Pill geometry at 1000px — the explicit value Venmo ships, not the conventional 9999px shortcut"
    - "Sand-and-white band rhythm — `#f1efea` warm sand alternating against `#ffffff` photography rows, no gradient transitions"
    - "Two-typeface stack — Athletics for display, Scto Grotesk A for body, PayPal Open scoped to the legal-footer chrome only"
  tags:
    - "Banking & Payments"
  lastUpdated: "2026-05-13"
  author:
    name: "Dov Azencot"
    url: "https://x.com/dovazencot"
  opening: |
    Venmo's marketing canvas is what happens when a peer-to-peer payments brand decides photography of friends does the warmth typography would otherwise carry. The page opens on the header gradient `#008cff` — the brand's signature electric blue — fading down to the white hero where "Pay friends." renders in Athletics at 63px / weight 500 with `letterSpacing: -1.89px`. Below the fold the page alternates two structural surfaces: white `#ffffff` for photography catalogue rows ("Venmo everything online and in-store", "Venmo your friends", "Grow a business") and warm sand `#f1efea` for the rotating Stash-card hero band. The primary button is a pill at radius `1000px` — the literal value Venmo ships — filled `#0074de` with white text. The signature blue `#008cff` is reserved for the page-top gradient and the rotating hero card mockup rather than the button itself. Body text runs Scto Grotesk A at 16/22.4 or 17.86/25 at weight 400, with weight 700 reserved for inline link emphasis on a small set of anchor rows.

    This page packages the Venmo marketing canvas into a single DESIGN.md file built on the Google Labs DESIGN.md specification. Inside the spec: 20 color tokens grouped into brand, link, ink, surface, and hairline roles; 12 typography tokens spanning a 63px Athletics hero down to a 14px PayPal Open footer caption; six radius tokens including the load-bearing `1000px` pill and the 32px product-tile corner that appears 12 times across the page; nine spacing tokens climbing from 4px through a 53px section band; and 18 component tokens covering the gradient header, both pill button variants, the rotating hero card, the four photography-led product rows, the Venmo Debit / Check Out / Credit Card tile triad, the FAQ-style link rows, and the regulatory footer. Every hex is quoted; every Athletics weight (500) and Scto Grotesk A weight (400 / 500 / 700) is reproducible.

    A working React or Next.js developer drops the file into Claude, Cursor, or GitHub Copilot and the agent reproduces Venmo's social-payments rhythm rather than a generic neobank or wallet template. Tokens map onto Tailwind config or CSS variables, and components reference each other by name so `card-product-tile` resolves through `{colors.surface-sand}` and `{rounded.lg}` to the actual `#f1efea` and `32px`. The system is worth studying for one disciplined choice that mirrors Airbnb's restraint with Rausch and Monzo's restraint with Hot Coral: a famous brand colour treated as the page's atmospheric voltage — the colour of the header sky, the colour of the rotating card — rather than the colour of the click. Where most payments brands paint the CTA in their brand blue, Venmo paints the weather.
  related:
    - href: "/design"
      title: "Browse all design systems"
      description: "The full directory of DESIGN.md files on shadcn.io, with live mockups for each."
    - href: "https://venmo.com"
      title: "Venmo — official site"
      description: "The peer-to-peer payments marketing canvas — source of every hex, font, and radius in this spec."
    - href: "https://github.com/google-labs-code/design.md"
      title: "The DESIGN.md specification"
      description: "Google Labs' open spec for machine-readable design system files — the format this page is built on."
  questions:
    - id: "primary-color"
      title: "What is Venmo's primary brand color and how is it used?"
      answer: "Venmo's signature is `#008cff` — a fully-saturated electric blue that sits brighter than PayPal's corporate navy and warmer than typical fintech indigo. The structural rule on the marketing canvas: `#008cff` is an atmospheric colour, not a CTA colour. It fills the top-of-page header gradient (count 4 in extraction, all as gradient stops) and the rotating hero card mockup behind the phone photography. The primary button is a pill at `#0074de` (a one-step-darker blue) with white text — `#008cff` never fills a button on the marketing surface. A deeper hover step `#005ba4` and an older navy `#0070ba` round out the structural blue ladder."
    - id: "typography"
      title: "What typography does Venmo use, and what should I use if Athletics isn't available?"
      answer: "Venmo runs three families: Athletics at the single weight 500 for every heading (33px to 63px) with negative tracking from `-0.67px` up to `-1.89px`; Scto Grotesk A at weights 400 (body), 500 (lead paragraphs), and 700 (inline link emphasis) for every reading row; and PayPal Open Regular at weights 400/500/600 scoped to the legal footer and a single small button label. Display sizes use `letterSpacing` negative across every tier — the inverse of Mercury's positive-tracking signature. When Athletics is unavailable, Söhne Display or Inter Display at weight 500 with `letterSpacing: -1.5px` to `-2px` is the closest open-source path. Scto Grotesk A's substitute is Inter or Söhne at weights 400/500/700."
    - id: "pill-geometry"
      title: "Why does Venmo use a 1000px pill radius instead of 9999px?"
      answer: "Every primary and secondary button on the marketing canvas ships at `borderRadius: 1000px` — the literal value the brand declares, even though `9999px` would clip to the same visual result. The explicit `1000px` reads in the stylesheet as a deliberate maximal-pill commitment rather than the customary infinity-radius shortcut. Content surfaces use `32px` (count 12 — by far the dominant radius on the page) for product tiles in the 'Venmo everything' triad and for the rotating hero card. A `24px` step (count 2) fills the mid-size feature cards. The micro corner is `4px` (count 3) on inline tags. Avoid `16px` and `20px` — neither appears anywhere in the extracted radius set."
    - id: "sand-and-white-rhythm"
      title: "What is the sand-and-white band rhythm and how strict is it?"
      answer: "The marketing canvas alternates two structural background colours in full-bleed bands: white `#ffffff` for photography catalogue rows (the 'Venmo your friends' grid, the 'Grow a business' showcase, the FAQ-style link list) and warm sand `#f1efea` for the rotating Stash card band. The two switch directly with no gradient transitions — the boundary between bands is a hard edge, with the header gradient `#008cff` as the only soft fade and only at the very top of the page. Inside white bands, photography of friends holding phones carries the warmth that on Stripe or Mercury would come from typography or gradient mesh. A pale `#deefff` (count 2 — used as bg) appears as a tertiary surface step on a single info chip set."
    - id: "use-in-project"
      title: "Can I use this DESIGN.md to build my own React payments app?"
      answer: "Yes — the file is structured to feed into Claude, Cursor, or any AI coding tool that reads structured design tokens. The agent reproduces Venmo's sand-and-white photography rhythm, scarce-blue-on-CTA discipline, and Athletics weight-500 heading stack rather than a generic wallet or neobank theme. You can also reference the tokens directly: every colour is a quoted hex (or rgba string for alpha tokens), every radius and padding is a quoted pixel string, and the 18 component definitions reference each other by token name so `header-gradient` resolves through `{colors.brand}` to the actual `#008cff` atmospheric sky."
    - id: "known-gaps"
      title: "What's missing from this DESIGN.md spec?"
      answer: "A few items, documented in the Known Gaps section: precise hover and pressed states across both pill variants are not captured — only the base CTA tokens are documented. The logged-in app surfaces (the social transaction feed, splits, the debit-card account view, Crypto, Stash investing) are out of scope; only the public marketing canvas at venmo.com is in this spec. The Stash-card rotating hero illustration palette (the gradients on each card variant, the sage-green Stash card fill) appears as raster art rather than CSS-rendered colour and is not enumerated as design tokens. Mobile-app screenshot art direction inside the photography rows is described in prose but not tokenized. Semantic palettes (success / warning / danger / info) live inside the authenticated product and are not declared on the marketing surface."

colors:
  brand: "#008cff"
  brand-link: "#0074de"
  brand-link-hover: "#005ba4"
  brand-legacy: "#0070ba"
  brand-pale: "#deefff"
  brand-header-deep: "#012169"
  ink: "#000000"
  ink-mute: "#2f3033"
  on-brand: "#ffffff"
  on-ink: "#ffffff"
  canvas-light: "#ffffff"
  surface-sand: "#f1efea"
  surface-pale-blue: "#deefff"
  hairline-light: "rgba(0,0,0,0.12)"
  hairline-mute: "rgba(47,48,51,0.16)"
  divider-soft: "rgba(0,0,0,0.06)"
  scrim: "rgba(0,0,0,0.5)"
  brand-glow: "rgba(0,140,255,0.16)"
  ink-overlay: "rgba(0,0,0,0.04)"
  on-dark-mute: "rgba(255,255,255,0.72)"

typography:
  display-xxl:
    fontFamily: "Athletics, \"Century Gothic\", Helvetica, Arial, sans-serif"
    fontSize: 63px
    fontWeight: 500
    lineHeight: 1.0
    letterSpacing: "-1.89px"
  display-xl:
    fontFamily: "Athletics, \"Century Gothic\", Helvetica, Arial, sans-serif"
    fontSize: 51px
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-1.02px"
  display-md:
    fontFamily: "Athletics, \"Century Gothic\", Helvetica, Arial, sans-serif"
    fontSize: 33px
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-0.67px"
  body-lg:
    fontFamily: "\"Scto Grotesk A\", Helvetica, Arial, sans-serif"
    fontSize: 22px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  body-lg-strong:
    fontFamily: "\"Scto Grotesk A\", Helvetica, Arial, sans-serif"
    fontSize: 22px
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: 0
  body-md:
    fontFamily: "\"Scto Grotesk A\", Helvetica, Arial, sans-serif"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  body-md-lead:
    fontFamily: "\"Scto Grotesk A\", Helvetica, Arial, sans-serif"
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  body-sm:
    fontFamily: "\"Scto Grotesk A\", Helvetica, Arial, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  link-md:
    fontFamily: "\"Scto Grotesk A\", Helvetica, Arial, sans-serif"
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.33
    letterSpacing: 0
  link-sm:
    fontFamily: "\"Scto Grotesk A\", Helvetica, Arial, sans-serif"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.38
    letterSpacing: 0
  footer-label:
    fontFamily: "PayPalOpen-Regular, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.71
    letterSpacing: 0
  footer-body:
    fontFamily: "PayPalOpen-Regular, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: 0

rounded:
  none: "0px"
  xs: "4px"
  sm: "8px"
  md: "24px"
  lg: "32px"
  circle: "50%"
  full: "1000px"

spacing:
  xxs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
  section: "53px"
  band: "79px"

components:
  header-gradient:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    typography: "{typography.link-sm}"
    rounded: "{rounded.none}"
    padding: "16px 24px"
    height: "64px"
  top-nav:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.ink}"
    typography: "{typography.link-sm}"
    rounded: "{rounded.none}"
    padding: "16px 24px"
    height: "64px"
  nav-link:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.ink}"
    typography: "{typography.link-sm}"
    rounded: "{rounded.none}"
    padding: "0"
  button-primary:
    backgroundColor: "{colors.brand-link}"
    textColor: "{colors.on-brand}"
    typography: "{typography.link-md}"
    rounded: "{rounded.full}"
    padding: "12px 34px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.brand-link-hover}"
    textColor: "{colors.on-brand}"
    typography: "{typography.link-md}"
    rounded: "{rounded.full}"
    padding: "12px 34px"
    height: "48px"
  button-outline-dark:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.ink}"
    typography: "{typography.link-md}"
    rounded: "{rounded.full}"
    padding: "12px 34px"
    height: "48px"
    border: "1px solid {colors.ink}"
  hero-band-light:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.ink}"
    typography: "{typography.display-xxl}"
    rounded: "{rounded.none}"
    padding: "53px 24px"
  hero-band-sand:
    backgroundColor: "{colors.surface-sand}"
    textColor: "{colors.ink}"
    typography: "{typography.display-md}"
    rounded: "{rounded.none}"
    padding: "53px 24px"
  card-rotating-hero:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    typography: "{typography.display-md}"
    rounded: "{rounded.lg}"
    padding: "32px"
  card-product-tile:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md-lead}"
    rounded: "{rounded.lg}"
    padding: "32px"
    border: "1px solid {colors.hairline-light}"
  card-photography-row:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.ink}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.lg}"
    padding: "24px"
  card-feature-pale:
    backgroundColor: "{colors.surface-pale-blue}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "24px"
  link-list-row:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.brand-link}"
    typography: "{typography.link-md}"
    rounded: "{rounded.none}"
    padding: "16px 0px"
    border: "1px solid {colors.hairline-light}"
  inline-link:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.brand-link}"
    typography: "{typography.body-lg-strong}"
    rounded: "{rounded.none}"
    padding: "0"
  badge-tag:
    backgroundColor: "{colors.surface-pale-blue}"
    textColor: "{colors.brand-link}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xs}"
    padding: "4px 8px"
  footer-light:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.ink-mute}"
    typography: "{typography.footer-body}"
    rounded: "{rounded.none}"
    padding: "48px 24px"
    border: "1px solid {colors.hairline-light}"
  footer-link:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.ink-mute}"
    typography: "{typography.footer-label}"
    rounded: "{rounded.none}"
    padding: "0"
  app-download-pill:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    typography: "{typography.link-sm}"
    rounded: "{rounded.full}"
    padding: "12px 24px"
    height: "44px"
---

## Overview

Venmo's marketing canvas is two structural surfaces — white `#ffffff` and warm sand `#f1efea` — alternating in full-bleed bands, with the signature blue `#008cff` reserved for the atmospheric weather above the page rather than the click below it. The page opens on a `#008cff` header gradient fading into the white hero where "Pay friends." sits in Athletics at 63px / weight 500 with `letterSpacing: -1.89px`. Below it, photography of friends holding phones — never typography — carries the warmth across rows. The primary CTA on every band is a pill `#0074de` with white text at radius `1000px` — the brand's explicit pill value, not the customary `9999px` shortcut.

**Atmospheric blue as signature**: Venmo treats `{colors.brand}` (#008cff) the way Airbnb treats Rausch and Monzo treats Hot Coral — as a material, not a CTA. The header gradient is `#008cff`. The rotating Stash card mockup is `#008cff`. The button is `#0074de` (one step darker). Where most payments brands paint the CTA in their brand colour, Venmo paints the weather above it.

Display type is Athletics at the single weight `500` across every tier from a 33px section opener up to a 63px hero with `lineHeight: 1.0` and `letterSpacing` ranging `-0.67px` to `-1.89px`. There is no thin display alternative and no weight 700 variant. Body type is Scto Grotesk A at weight 400 for prose, weight 500 for lead paragraphs, and weight 700 for inline link emphasis. PayPal Open Regular is scoped to the regulatory footer at 14px and never appears above the fold — a structural reminder that Venmo is a PayPal subsidiary, but the brand voice on the marketing canvas is its own.

**Key Characteristics:**
- Two-mode band rhythm — `{colors.canvas-light}` (white) for photography catalogue rows, `{colors.surface-sand}` (#f1efea) for the rotating-card band, switched in full-bleed with no soft transitions.
- Signature `{colors.brand}` (#008cff) is the colour of the header sky and the rotating hero card — never the colour of a CTA button.
- The primary CTA is `{components.button-primary}` — a `{colors.brand-link}` (#0074de) pill with white text, `{rounded.full}` (1000px) radius, `{spacing.sm} 34px` padding, 48px tall.
- Display is **Athletics at weight 500 exclusively** — 33px to 63px, with `letterSpacing` from `-0.67px` to `-1.89px` and `lineHeight: 1.0` on the hero.
- The pill radius is the literal value `1000px` rather than the customary `9999px` — a deliberate maximal-pill commitment that survives in production CSS.
- Cards lean on one corner: 32px on every product tile in the "Venmo everything" triad and on the rotating hero card. The 32px radius appears 12 times — by far the dominant value on the page.

## Colors

> **Source pages:** home (`/`).

### Brand
- **Venmo Blue** (`{colors.brand}` — `#008cff`): frequency 4. Used as gradient (4). The signature electric blue — a fully-saturated voltage that fills the header gradient at the top of the page and the rotating Stash card mockup. Rare on the marketing canvas (under 5% of total chromatic load); reserved as an atmospheric colour. Where most fintech brands push their primary into CTA fills, Venmo holds it back to the weather above and the object on the page.
- **Brand Link** (`{colors.brand-link}` — `#0074de`): frequency 19. Used as text (11), border (8). One step darker than the signature — fills the primary pill button, anchors text on link-list rows, and renders inside the Venmo Debit Card / Credit Card tile labels. The actual interactive blue on the page.
- **Brand Link Hover** (`{colors.brand-link-hover}` — `#005ba4`): frequency 2. Used as text (1), border (1). Two steps darker than `#0074de` — used on pressed/hover states for primary CTAs and on a single body-text emphasis row.
- **Brand Legacy** (`{colors.brand-legacy}` — `#0070ba`): frequency 6. Used as text (3), border (3). A slightly older PayPal-leaning blue captured by the extractor — appears on a small number of legacy elements (the "Discover" rail label, one footer link). Reserved for transitional UI.
- **Brand Pale** (`{colors.brand-pale}` — `#deefff`): frequency 2. Used as bg (2). The pale-cyan tint that fills a single info chip set and the soft surface behind tertiary callouts. The brand's tertiary tint.
- **Brand Header Deep** (`{colors.brand-header-deep}` — `#012169`): the `themeColor` declared in the brand's manifest at `<meta name="theme-color">` — a deep navy that drives the browser-chrome colour on iOS Safari and Chrome. It does not paint any pixel on the rendered page, but it is the declared brand voltage at the manifest level. Reserved for browser chrome and PWA install surfaces.

### Ink
- **Ink** (`{colors.ink}` — `#000000`): frequency 314. Used as text (156), border (155), shadow (3). The brand's load-bearing dark — pure black on every heading and most body prose on white. Not a navy or near-black; Venmo paints body type with true `#000000`, which inverts the Monzo / Mercury convention of using a deep navy for warmth.
- **Ink Mute** (`{colors.ink-mute}` — `#2f3033`): frequency 148. Used as text (74), border (74). A very dark gray with a faint blue tint — fills secondary body prose, the bodyText `<p>` rows under section headings, and footer-light copy in PayPal Open. The brand's "second ink" colour.

### Surface
- **Canvas Light** (`{colors.canvas-light}` — `#ffffff`): frequency 18. Used as bg (13), gradient (4), border (1). Default page background; carries the photography catalogue bands, the FAQ-style link-list rows, the Venmo Debit / Check Out / Credit Card tile triad, and the footer.
- **Surface Sand** (`{colors.surface-sand}` — `#f1efea`): frequency 1. Used as bg (1). The warm off-white sand band — fills the rotating Stash card hero strip. The single non-white structural surface on the page; reads as warmth without leaving the neutral spectrum.
- **Surface Pale Blue** (`{colors.surface-pale-blue}` — `#deefff`): the same hex as `{colors.brand-pale}`, doubling as a tertiary tinted surface for chips and soft callouts. Scoped to chip backgrounds only.

### On-color
- **On Brand** (`{colors.on-brand}` — `#ffffff`): white text and iconography on `{colors.brand}` and `{colors.brand-link}` surfaces — the only legible-foreground colour over saturated blue.
- **On Ink** (`{colors.on-ink}` — `#ffffff`): the same hex as `on-brand`, scoped to dark-fill app-download pills.

### Hairline & Scrim
- **Hairline Light** (`{colors.hairline-light}` — `rgba(0,0,0,0.12)`): 12%-alpha black — 1px borders between link-list rows and the footer-top divider.
- **Hairline Mute** (`{colors.hairline-mute}` — `rgba(47,48,51,0.16)`): 16%-alpha ink-mute — 1px borders inside FAQ-style accordions.
- **Divider Soft** (`{colors.divider-soft}` — `rgba(0,0,0,0.06)`): 6%-alpha black — micro-dividers on dense legal-footer rows.
- **Scrim** (`{colors.scrim}` — `rgba(0,0,0,0.5)`): 50%-alpha black — image overlay on photography rows where text needs contrast against a busy background.
- **Brand Glow** (`{colors.brand-glow}` — `rgba(0,140,255,0.16)`): 16%-alpha signature blue — used as a faint atmospheric wash on the rotating hero card edge.
- **Ink Overlay** (`{colors.ink-overlay}` — `rgba(0,0,0,0.04)`): 4%-alpha black — the lightest hover wash on outline pill buttons.
- **On Dark Mute** (`{colors.on-dark-mute}` — `rgba(255,255,255,0.72)`): 72%-alpha white — secondary copy on the `#008cff` header gradient and on rotating card sub-labels.

### Semantic
The marketing canvas does not declare a separate semantic palette (success / warning / danger / info). Error states live inside the authenticated app product (transaction failures, splits, the social feed) and are out of scope here.

## Typography

### Font Family

Three families, with one scoped exception:

- **Athletics** at the single weight `500` — every heading tier from `{typography.display-md}` (33px) up to `{typography.display-xxl}` (63px) renders in this one weight. There is no thin display alternative; there is no weight 700 variant.
- **Scto Grotesk A** at weights `400` (body prose), `500` (lead paragraphs), and `700` (inline link emphasis and anchor labels). Body sizes are 16px (caption), 18px (default), and 22px (lead).
- **PayPal Open Regular** at weights `400/500/600` — scoped exclusively to the regulatory footer at 14px. Never appears above the fold.

Athletics is proprietary to Venmo's display licensing; Scto Grotesk A is by Schick Toikka; PayPal Open is the parent company's UI sans. When Athletics cannot be licensed, Söhne Display or Inter Display at weight 500 with `letterSpacing: -1.5px` to `-2px` is the closest open-source path. Scto Grotesk A's substitute is Inter or Söhne at weights 400/500/700 — the brand's grotesque silhouette matches both.

### Hierarchy

| Token | Size | Weight | Line Height | Tracking | Use |
|---|---|---|---|---|---|
| `{typography.display-xxl}` | 63px | 500 | 1.0 | -1.89px | Hero ("Pay friends.") |
| `{typography.display-xl}` | 51px | 500 | 1.05 | -1.02px | "Meet Venmo" section opener |
| `{typography.display-md}` | 33px | 500 | 1.05 | -0.67px | Product tile h3 ("The Venmo Debit Card") |
| `{typography.body-lg}` | 22px | 400 | 1.4 | 0 | Hero supporting paragraph |
| `{typography.body-lg-strong}` | 22px | 700 | 1.4 | 0 | Inline strong emphasis inside lead paragraphs |
| `{typography.body-md}` | 18px | 400 | 1.4 | 0 | Default prose body |
| `{typography.body-md-lead}` | 18px | 500 | 1.4 | 0 | Product tile description, lead paragraph variant |
| `{typography.body-sm}` | 16px | 400 | 1.4 | 0 | Nav link prose, caption rows |
| `{typography.link-md}` | 18px | 700 | 1.33 | 0 | "Learn more" / "Sign up" anchor labels |
| `{typography.link-sm}` | 16px | 700 | 1.38 | 0 | Top-nav link labels |
| `{typography.footer-label}` | 14px | 600 | 1.71 | 0 | App-download pill label, footer column heading |
| `{typography.footer-body}` | 14px | 400 | 1.43 | 0 | Footer legal copy, FCA / FDIC disclosure rows |

### Principles
- **Single display weight is the brand.** Athletics never appears below weight 500 in the marketing system. Drop to Scto Grotesk A only when the size is below 24px and the role is body or lead.
- **Negative tracking scales with size.** Athletics tracks `-0.67px` at 33px, `-1.02px` at 51px, and `-1.89px` at 63px — the larger the type, the tighter the letters. Scto Grotesk A keeps `letterSpacing: normal` at every size.
- **Line-height collapses on the hero.** `display-xxl` at 63px uses `lineHeight: 1.0`. Every other display token uses `1.05`; every body token uses `1.4`.
- **PayPal Open is footer-only.** The parent-company UI sans is structurally walled off to legal chrome — never use it above the fold or inside product-tile copy.

### Note on Font Substitutes
Athletics and Scto Grotesk A are both proprietary. **Söhne Display** at weight 500 (display) plus **Inter Variable** at weights 400/500/700 (body) is the closest open-source pairing. Avoid Helvetica or Roboto — both are too geometric for Athletics's slightly humanist display silhouette.

## Layout

### Spacing System
- **Base unit**: 8px (with 4 / 12 / 16 sub-tokens).
- **Tokens**: `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 53px · `{spacing.band}` 79px.
- **Section padding**: 48–79px on marketing surfaces; 24px on mobile.
- **Card internal padding**: 32px on product tiles and the rotating hero card, 24px on photography rows, 24px on pale-blue feature cards.
- **Button padding**: `12px 34px` on every pill variant — the same value across primary, hover, and outline.

### Grid & Container
The page centers in a ~1100px column on desktop; the rotating hero card extends to the column edge with the photography rows clamping the grid to a 3-up tile triad in the "Venmo everything" row. The "Venmo your friends" and "Grow a business" rows use a 2-up split with one photography pane and one product copy pane. Section gaps tend toward 53px with the rotating-card band breathing at 79px.

### Whitespace Philosophy
Bands have generous vertical breathing room (53–79px section padding) and the column width holds at ~1100px even on wide screens — the brand chooses readable rhythm over edge-to-edge density. Inside cards the rhythm tightens: 16px between body rows, 8px on adjacent label-and-value pairs.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 | Flat | Default surface — most cards have no shadow at all |
| 1 | Photography fill | The rotating card lifts off the sand band via image content, not shadow |
| 2 | `1px solid rgba(0,0,0,0.12)` hairline | Product tiles, link-list rows, footer top divider |
| 3 | Band switch — white slams against `#f1efea` sand | The brand's primary depth medium |

### Decorative Depth
Venmo's depth system is structural: the alternation between `{colors.canvas-light}` and `{colors.surface-sand}` is the visual lift, not a shadow ladder. Drop shadows do not appear on any extracted component — the page registers depth through hairline borders and band switches. The header gradient `#008cff` at the very top of the page is the one soft transition; below it every band edge is hard.

## Shapes

### Border Radius Scale

| Token | Value | Count | Use |
|---|---|---|---|
| `{rounded.none}` | 0px | — | Hero bands, footer, nav, FAQ-style row borders |
| `{rounded.xs}` | 4px | 3 | Inline tags, small badges |
| `{rounded.sm}` | 8px | 2 | Form inputs, small surfaces |
| `{rounded.md}` | 24px | 2 | Mid-size feature cards |
| `{rounded.lg}` | 32px | 12 | Product tiles, rotating hero card — the dominant page radius |
| `{rounded.circle}` | 50% | 1 | Avatar circles, profile photos |
| `{rounded.full}` | 1000px | 4 | All pill buttons and app-download pills |

### Pill Geometry
The `1000px` value is the actual radius Venmo ships — not the customary `9999px` infinity-radius shortcut. The literal `1000px` reads in the stylesheet as a maximal-pill commitment rather than a "round it off to whatever" convention. Every button across primary, hover, and outline variants uses this same radius, with `12px 34px` padding and a 48px height. The `32px` product-tile corner is the page's load-bearing decorative geometry — it appears 12 times across the rotating hero card and the "Venmo everything" tile grid, three times more than the next-most-common value.

## Components

### Headers & Navigation

**`header-gradient`** — the brand-blue page-top gradient strip.
- Background `{colors.brand}` (#008cff), text `{colors.on-brand}` (#ffffff) via `{typography.link-sm}`, height 64px, padding `16px 24px`. The single atmospheric blue surface on the page; fades into the white hero immediately below.

**`top-nav`** — the page header underneath the gradient.
- Background `{colors.canvas-light}`, text `{colors.ink}` weight 700 via `{typography.link-sm}`. Logo wordmark on the left, primary nav center, sign-in + filled `button-primary` on the right.

**`nav-link`** — inline nav anchor.
- Background `{colors.canvas-light}`, text `{colors.ink}` weight 700 via `{typography.link-sm}`. No underline default; no hover colour shift documented.

### Buttons

**`button-primary`** — the dominant CTA system-wide.
- Background `{colors.brand-link}` (#0074de), text `{colors.on-brand}` (#ffffff), type `{typography.link-md}`, padding `12px 34px`, rounded `{rounded.full}` 1000px, height 48px.
- Used on every marketing band as the single filled pill. `{colors.brand}` (#008cff) never fills this button.

**`button-primary-hover`** — the pressed/hover variant.
- Background `{colors.brand-link-hover}` (#005ba4), inherits the rest from `button-primary`. Two steps darker than the base — a luminance step, not a chromatic shift.

**`button-outline-dark`** — 1px ink border on white.
- Background `{colors.canvas-light}`, text `{colors.ink}`, `1px solid {colors.ink}` border, same pill geometry, height 48px. Appears as the secondary CTA on rows where the filled blue pill anchors the primary action.

### Hero & Bands

**`hero-band-light`** — the white hero carrying "Pay friends."
- Background `{colors.canvas-light}`, text `{colors.ink}`, type `{typography.display-xxl}` (63px / 500 / `letterSpacing: -1.89px`), padding `53px 24px`. The brand's tightest display tracking and largest type tier live here.

**`hero-band-sand`** — the warm sand band carrying the rotating Stash card.
- Background `{colors.surface-sand}` (#f1efea), text `{colors.ink}`, type `{typography.display-md}` (33px / 500), padding `53px 24px`. The single non-white structural band on the page.

### Cards

**`card-rotating-hero`** — the signature-blue Stash card mockup.
- Background `{colors.brand}` (#008cff), text `{colors.on-brand}` (#ffffff), padding 32px, rounded `{rounded.lg}` 32px. Hosts the rotating "Venmo everything" hero illustration on the sand band — the single component where `{colors.brand}` fills the surface.

**`card-product-tile`** — the "Venmo Debit / Check Out / Credit Card" triad.
- Background `{colors.canvas-light}`, text `{colors.ink}`, type `{typography.body-md-lead}`, padding 32px, rounded `{rounded.lg}` 32px, 1px `{colors.hairline-light}` border. The dominant card geometry on the page — three tiles render in this exact spec.

**`card-photography-row`** — the "Venmo your friends" and "Grow a business" rows.
- Background `{colors.canvas-light}`, text `{colors.ink}`, type `{typography.body-lg}`, padding 24px, rounded `{rounded.lg}` 32px. Pairs photography of friends holding phones with a single product copy block per row.

**`card-feature-pale`** — soft pale-blue interlude.
- Background `{colors.surface-pale-blue}` (#deefff), text `{colors.ink}`, padding 24px, rounded `{rounded.md}` 24px.

### Rows & Lists

**`link-list-row`** — the FAQ-style anchor row.
- Background `{colors.canvas-light}`, text `{colors.brand-link}` (#0074de) via `{typography.link-md}` weight 700. Padding `16px 0px`, 1px `{colors.hairline-light}` border between rows. The single place blue text appears as the row's anchor colour.

**`inline-link`** — body-prose inline link.
- Background `{colors.canvas-light}`, text `{colors.brand-link}` via `{typography.body-lg-strong}` weight 700. No padding, no border — pure anchor text inside paragraphs.

**`badge-tag`** — small pale-blue chip.
- Background `{colors.surface-pale-blue}` (#deefff), text `{colors.brand-link}`, type `{typography.body-sm}`, padding `4px 8px`, rounded `{rounded.xs}` 4px. The sharpest-cornered geometry in the system.

### Tiles & Footer

**`app-download-pill`** — dark-fill app-store pill.
- Background `{colors.ink}` (#000000), text `{colors.on-ink}` (#ffffff), padding `12px 24px`, rounded `{rounded.full}` 1000px, height 44px. The single ink-filled pill on the page; reserved for App Store / Google Play download CTAs.

**`footer-light`** — the regulatory footer.
- Background `{colors.canvas-light}`, text `{colors.ink-mute}` (#2f3033) via `{typography.footer-body}`, padding `48px 24px`, 1px `{colors.hairline-light}` top border. Holds 4 columns of link groups, social icons, and the FDIC / Synchrony Bank disclosure row.

**`footer-link`** — footer anchor row.
- Background `{colors.canvas-light}`, text `{colors.ink-mute}` via `{typography.footer-label}` weight 600. PayPal Open Regular renders here and only here on the page.

## Do's and Don'ts

### Do
- Reserve `{colors.brand}` (#008cff) for atmospheric surfaces — the header gradient and the rotating hero card. The signature blue fills `header-gradient` and `card-rotating-hero` and no other component.
- Use `{colors.brand-link}` (#0074de) as the primary CTA fill across every band — the one-step-darker blue is the brand's CTA voltage, not the signature `#008cff`.
- Render every heading in Athletics at weight 500 with negative letter-spacing scaling to size. Drop to Scto Grotesk A only when the type tier is `{typography.body-lg}` (22px) or smaller.
- Use literal `1000px` for pill radius — not `9999px`. The brand ships the explicit value.
- Switch background colour in full-bleed bands from `#ffffff` to `#f1efea` sand directly, never with gradient transitions — the slam is the depth system.
- Scope PayPal Open Regular to the footer at 14px. The parent-company UI sans is structurally walled off from every above-the-fold surface.

### Don't
- Don't fill a CTA with `{colors.brand}` (#008cff) — the brand assigns the signature blue to atmosphere (header gradient, card mockup), not to actions. A `#008cff` filled button breaks the disciplined-scarcity rule that gives the colour its voltage and reads as a child of the gradient strip above.
- Don't bump Athletics below weight 500 — the single-weight-500 commitment is the brand's editorial signature. Lighter display weights collapse Athletics's slightly humanist silhouette into a generic display sans.
- Don't apply positive letter-spacing to Athletics display tokens — every Athletics token sits at negative tracking from `-0.67px` to `-1.89px`. Positive tracking inverts the brand's typographic signature and reads as generic editorial.
- Don't substitute `9999px` for `{rounded.full}` (1000px) on buttons. The visual result clips identically, but the literal `1000px` carries the brand's stylesheet voice.
- Don't use `#2f3033` for primary body text — it is the brand's `ink-mute` (frequency 148, used as secondary text and footer-light copy). The primary body ink is `{colors.ink}` (#000000); reserve `#2f3033` for secondary rows under section headings and footer prose.
- Don't soft-fade between `{colors.canvas-light}` and `{colors.surface-sand}` band boundaries — the hard slam is the brand's structural depth medium; a gradient transition removes the catalogue rhythm that lets photography do the warmth.
- Don't use PayPal Open Regular above the fold. The font is licensed for the parent-company chrome at the footer; using it on a hero or product tile breaks the brand-voice boundary the marketing canvas keeps strict.

## Known Gaps

- **Hover and pressed states** are not fully captured across button variants — only the base `button-primary` and the `button-primary-hover` luminance step are documented. The brand likely applies a subtle opacity lift on `button-outline-dark` hover, but no precise value is extractable.
- **Focus rings** rely on browser-default outline behaviour; no token captures the focus colour or stroke width.
- **Logged-in app surfaces** (the social transaction feed, splits, the debit-card account view, Crypto holdings, Stash investing dashboards) are out of scope. Only the public marketing canvas at venmo.com is in this spec.
- **Rotating hero illustration palette** inside `card-rotating-hero` (the gradients on each rotating Stash card variant, the sage-green Stash card fill, the Credit Card metallic mockup) appears as raster art rather than CSS-rendered colour and is not enumerated as design tokens.
- **Mobile-app screenshot art direction** inside the "Venmo your friends" and "Grow a business" photography rows is described in prose but not tokenized — the photography is treated as content, not as a design token.
- **Semantic palette** (success, warning, danger, info) is not declared on the marketing canvas — error states live inside the authenticated app product and are out of scope here.
- **Browser theme color** `#012169` from `<meta name="theme-color">` does not paint any pixel on the rendered page; it is captured here as `{colors.brand-header-deep}` for completeness but is reserved for browser-chrome PWA install surfaces.
