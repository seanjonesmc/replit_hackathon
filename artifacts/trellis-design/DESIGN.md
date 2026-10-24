---
version: alpha
name: Trellis
description: >-
  Trellis is a testnet-only family spending app: a parent sets guardrails, family funders add money to spending buckets, and a dependent spends on a simulated card while every decision is explained in plain English and can be recorded on Monad. The visual language comes from the Trellis app mockup (design/reference/trellis-app-mockup.html at the workspace root). Lime `#dcf26e` marks money and actions (hero balance, header band, top bar) and always carries dark lime-ink `#1c2008` text; the virtual debit card has its own dark charcoal card face (`#3a3c36` to `#121310`) with off-white `#f6f5f1` text. Sky `#d3e7ee` with sky-ink `#12313b` marks anything recorded on Monad. Primary buttons are near-black `#171815` pills with off-white `#f6f5f1` text on a warm stone ground `#eceae4`. Headings are Urbanist at weight 600 with tight tracking, body text is Geist, and codes are Geist Mono. Corners are soft (999px pills, 28px cards, 22px secondary cards, 14px items), surfaces layer stone, screen and white card without shadows (only the virtual card and the signed-out feature cards carry a soft ink shadow), and motion only happens when money moves, a decision lands, Monad confirms, or a request or state changes on a demo screen.
seo:
  title: "Trellis Design System: lime for money, sky for Monad"
  metaDescription: "Trellis tokens and components: lime money cards with lime-ink text, sky chain badges, near-black pills on warm stone, Urbanist + Geist + Geist Mono."
  highlights:
    - "Lime means money — `#dcf26e` carries the hero balance, header band and top bar, always with `#1c2008` lime-ink text, never white"
    - "A real-looking debit card — charcoal `#3a3c36` to `#121310` card face, `#f6f5f1` text, `#d8c38e` EMV chip, last four only"
    - "Sky means recorded on Monad — `#d3e7ee` badges with `#12313b` sky-ink text, used for nothing else"
    - "Near-black actions — `#171815` pills with `#f6f5f1` text and a `#31332d` hover step"
    - "Three warm layers — stone ground `#eceae4`, screen `#f6f5f1`, white cards, no drop shadows"
    - "Urbanist 600 headings, Geist body, Geist Mono for codes and reason codes"
    - "Motion with a reason — one curve, 350/600/900ms, nothing loops, reduced motion respected"

colors:
  signature: "#dcf26e"
  on-signature: "#1c2008"
  primary: "#171815"
  primary-hover: "#31332d"
  on-primary: "#f6f5f1"
  tint: "#eef8c2"
  ink: "#171815"
  ink-mute: "#5d5f58"
  surface: "#ffffff"
  surface-screen: "#f6f5f1"
  surface-ground: "#eceae4"
  hairline: "rgba(23,24,21,0.10)"
  approved: "#1d8a4a"
  approved-bg: "#dff3e6"
  rejected: "#c8372d"
  rejected-bg: "#fbe3e0"
  pending: "#b86a00"
  pending-bg: "#fcefd6"
  chain: "#12313b"
  chain-bg: "#d3e7ee"
  card-face: "#3a3c36"
  card-face-end: "#121310"
  on-card-face: "#f6f5f1"
  card-chip: "#d8c38e"
  dark-surface-ground: "#10110f"
  dark-surface-screen: "#191a17"
  dark-surface: "#23241f"
  dark-ink: "#f1f0ea"
  dark-ink-mute: "#a5a69d"
  dark-primary: "#f1f0ea"
  dark-primary-hover: "#d9d8d0"
  dark-on-primary: "#191a17"
  dark-tint: "#2f3514"
  dark-hairline: "rgba(241,240,234,0.12)"
  dark-approved: "#6fd294"
  dark-approved-bg: "#1d3526"
  dark-rejected: "#ff8a7f"
  dark-rejected-bg: "#3d1f1c"
  dark-pending: "#f2b552"
  dark-pending-bg: "#3a2c12"
  dark-chain: "#e2f2f7"
  dark-chain-bg: "#284753"

typography:
  display-xxl:
    fontFamily: "Urbanist, ui-sans-serif, system-ui, sans-serif"
    fontSize: 63px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-2.2px"
  display-xl:
    fontFamily: "Urbanist, ui-sans-serif, system-ui, sans-serif"
    fontSize: 51px
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-1.6px"
  display-md:
    fontFamily: "Urbanist, ui-sans-serif, system-ui, sans-serif"
    fontSize: 33px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.9px"
  title:
    fontFamily: "Urbanist, ui-sans-serif, system-ui, sans-serif"
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.5px"
  body-lg:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: 22px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  body-md:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  body-md-lead:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  body-sm:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  link-md:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.33
    letterSpacing: 0
  link-sm:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.38
    letterSpacing: 0
  caption:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: 0
  code:
    fontFamily: "\"Geist Mono\", ui-monospace, monospace"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  none: "0px"
  tag: "8px"
  input: "14px"
  card-sm: "22px"
  card: "28px"
  circle: "50%"
  full: "999px"

spacing:
  xxs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
  section: "53px"

components:
  header-gradient:
    backgroundColor: "{colors.signature}"
    textColor: "{colors.on-signature}"
    typography: "{typography.link-sm}"
    rounded: "{rounded.none}"
    padding: "16px 24px"
    height: "64px"
  top-nav:
    backgroundColor: "{colors.surface-screen}"
    textColor: "{colors.ink}"
    typography: "{typography.link-sm}"
    rounded: "{rounded.none}"
    padding: "16px 24px"
    height: "64px"
  nav-link:
    backgroundColor: "{colors.surface-screen}"
    textColor: "{colors.ink}"
    typography: "{typography.link-sm}"
    rounded: "{rounded.none}"
    padding: "0"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.link-md}"
    rounded: "{rounded.full}"
    padding: "12px 34px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
    typography: "{typography.link-md}"
    rounded: "{rounded.full}"
    padding: "12px 34px"
    height: "48px"
  button-outline:
    backgroundColor: "{colors.surface-screen}"
    textColor: "{colors.ink}"
    typography: "{typography.link-md}"
    rounded: "{rounded.full}"
    padding: "12px 34px"
    height: "48px"
  hero-band-light:
    backgroundColor: "{colors.surface-screen}"
    textColor: "{colors.ink}"
    typography: "{typography.display-xxl}"
    rounded: "{rounded.none}"
    padding: "53px 24px"
  hero-band-stone:
    backgroundColor: "{colors.surface-ground}"
    textColor: "{colors.ink}"
    typography: "{typography.display-md}"
    rounded: "{rounded.none}"
    padding: "53px 24px"
  card-hero:
    backgroundColor: "{colors.signature}"
    textColor: "{colors.on-signature}"
    typography: "{typography.display-md}"
    rounded: "{rounded.card}"
    padding: "32px"
  card-product:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.card}"
    padding: "32px"
  card-photography:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.card}"
    padding: "24px"
  card-feature:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.card-sm}"
    padding: "24px"
  link-inline:
    textColor: "{colors.primary}"
    typography: "{typography.link-md}"
  link-row:
    textColor: "{colors.primary}"
    typography: "{typography.link-md}"
    padding: "16px 0"
  badge:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.primary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.tag}"
    padding: "4px 8px"
  chain-badge:
    backgroundColor: "{colors.chain-bg}"
    textColor: "{colors.chain}"
    typography: "{typography.link-sm}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  status-approved:
    backgroundColor: "{colors.approved-bg}"
    textColor: "{colors.approved}"
    typography: "{typography.link-sm}"
    rounded: "{rounded.full}"
  status-declined:
    backgroundColor: "{colors.rejected-bg}"
    textColor: "{colors.rejected}"
    typography: "{typography.link-sm}"
    rounded: "{rounded.full}"
  status-waiting:
    backgroundColor: "{colors.pending-bg}"
    textColor: "{colors.pending}"
    typography: "{typography.link-sm}"
    rounded: "{rounded.full}"
  footer:
    backgroundColor: "{colors.surface-screen}"
    textColor: "{colors.ink-mute}"
    typography: "{typography.caption}"
    rounded: "{rounded.none}"
    padding: "48px 24px"
  download-pill:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.link-sm}"
    rounded: "{rounded.full}"
    padding: "12px 24px"
    height: "44px"
---

> Generated values come from the root `BRAND` (`src/brand/brand.config.ts`) through `scripts/sync-brand.mjs`. The hex values in this file are a readable snapshot; if they disagree with `BRAND`, `BRAND` wins. Current visual source: `design/reference/trellis-app-mockup.html`. The earlier `design/reference/venmo.DESIGN.md` is kept as a historical reference only.

## Overview

Trellis is a family money tool, not a trading app. The design should feel calm,
warm and certain: big confident numbers, plain-English explanations, and a very
small set of colors that each mean one thing.

- **Lime = money and actions.** The hero balance, the header band and the top
  bar. Text on lime is always lime ink.
- **Charcoal = the card.** The virtual debit card has its own dark card face so
  it never looks like the lime hero balance beside it.
- **Sky = recorded on Monad.** Chain badges, tags and records only.
- **Near-black = do something.** Primary buttons and selected pills.
- **Wait / ok / no.** Amber, green and red pairs for decisions, always with an
  icon and a label.

Everything is testnet only. Samples are labelled as samples; nothing shows a
verified state without a real confirmed transaction.

## Colors

### Signature

`signature` (#dcf26e) is the lime that marks money. It fills the hero balance
card, the app's top bar and the header band. `on-signature`
(#1c2008) is the only text and icon color allowed on it (13.5:1). `tint`
(#eef8c2) is the pale lime for chips, feature cards and the active tab.

### Card face

The app's virtual debit card is drawn on its own face, never on lime:
`card-face` (#3a3c36) easing diagonally to `card-face-end` (#121310), with a
light sheen of `on-card-face` at 10% or less. `on-card-face` (#f6f5f1) is the
text and icon color on it (10.2:1 on `card-face`, 17.1:1 on `card-face-end`,
7.5:1 under the sheen; secondary labels at 80% opacity stay above 5:1).
`card-chip` (#d8c38e) fills the EMV chip. These four come from
`BRAND.colors` (`cardFace`, `cardFaceEnd`, `onCardFace`, `cardChip`) and are
the same in both modes; the generated tokens carry them as `cardFace`,
`cardFaceEnd`, `onCardFace` and `cardChip`.

### Ink

`ink` (#171815) for headings and body, `ink-mute` (#5d5f58) for secondary text
only (5.4:1 or better on every light surface).

### Surface

Three warm layers, lightest on top: `surface-ground` (#eceae4, stone page
ground), `surface-screen` (#f6f5f1, the screen) and `surface` (#ffffff, cards).
In the design-system theme these map to `secondary`/`sidebar`, `background` and
`card` respectively.

### On-color

`on-primary` (#f6f5f1) on `primary` (16.3:1) and `primary-hover` (11.7:1).
`on-signature` on lime. Never put white text on lime.

### Hairline

`hairline` is 10% ink. Generated theme borders use its opaque equivalent on the
screen color.

### Semantic

| State | Text | Background | Ratio |
| --- | --- | --- | --- |
| Approved (ok) | `approved` | `approved-bg` | 3.8:1 |
| Declined (no) | `rejected` | `rejected-bg` | 4.3:1 |
| Waiting | `pending` | `pending-bg` | 3.6:1 |
| Recorded on Monad | `chain` | `chain-bg` | 10.8:1 |

The decision pairs are the mockup's values and are below 4.5:1 for small text,
so they are always bold and paired with an icon and a label. The mockup's mid
sky (#1f6f8b) reaches only 4.4:1 on the sky background, so `chain` uses the
darker sky ink.

### Dark palette

Dark mode in this design system uses the mockup's explicit dark palette
(`BRAND.darkColors`, the `dark-*` colors above), not a blend of the light one.
Lime and lime ink stay the same in both modes; primary flips to off-white with
dark text. The app itself has no dark mode yet.

## Typography

### Font Family

- **Urbanist** for headings and display numbers (`--app-font-serif` slot in
  the generated theme, `font-heading` in the app).
- **Geist** for body text and UI (`--app-font-sans`).
- **Geist Mono** for codes, reason codes and anything in `<code>`
  (`--app-font-mono`).

All three load from one Google Fonts stylesheet in `BRAND.fonts.googleFontsUrl`.

### Hierarchy

| Token | Size / weight / line height / tracking | Use |
| --- | --- | --- |
| display-xxl | 63 / 600 / 1.0 / -2.2px | Rare hero moments |
| display-xl | 51 / 600 / 1.02 / -1.6px | Balances, decision amounts |
| display-md | 33 / 600 / 1.05 / -0.9px | Screen and section titles |
| title | 22 / 600 / 1.2 / -0.5px | Card titles |
| body-lg | 22 / 400 / 1.4 | Lead copy |
| body-md | 18 / 400 / 1.4 | Default prose |
| body-sm | 16 / 400 / 1.4 | Rows |
| link-md / link-sm | 18 or 16 / 700 | Actions and strong labels |
| caption | 14 / 400 / 1.43 | Metadata |
| code | 13 / 500 Geist Mono | Reason codes |

### Principles

- Headings are semibold Urbanist with tracking around -0.03em; body keeps
  normal tracking.
- Money always uses tabular numbers and explicit currency.
- Codes are secondary: small mono text under a plain-English sentence.

## Layout

### Spacing System

4 · 8 · 12 · 16 · 24 · 32 · 48px, base unit 8px. Cards pad 24–32px.

### Grid & Container

App screens are designed at 390px and centered in a 430px column on the stone
ground. This documentation browser is wider.

### Whitespace Philosophy

One idea per card, generous padding, short sentences.

## Elevation & Depth

Flat. Depth comes from the ground → screen → card layering and 1px hairlines.
No drop shadows or glows, with two exceptions in the app: the virtual debit
card (a physical object, `shadow-ink/20`) and the signed-out feature cards,
which sit over the lime header band and backdrop (solid white, `border-ink/15`,
`shadow-ink/10`).

### Decorative Depth

The only texture is the lattice on lime cards: a fine diagonal hatch in
`on-signature` at low opacity, like the mockup's striped bars. Never a white
overlay. The header band is a solid lime easing into the screen color.

## Shapes

### Border Radius Scale

| Token | Value | Use |
| --- | --- | --- |
| full | 999px | Buttons, status pills, chain badges, download pill |
| card | 28px | Main cards |
| card-sm | 22px | Secondary and feature cards |
| input | 14px | Inputs and list items |
| tag | 8px | Tags and badges |

### Pill Geometry

Buttons are 48px tall pills with 12px × 34px padding; the download pill is 44px.

## Motion

Motion only when money moves, a decision lands, Monad confirms, or a request
or state changes on a demo screen.

- One easing curve: cubic-bezier(0.2, 0.8, 0.2, 1).
- Three durations: 350ms (quick), 600ms (base), 900ms (slow).
- Short distances (a few pixels of rise, scale from 0.97 at most), no overshoot.
- Nothing loops.
- Presets (app `components/trellis/motion.ts`): staggered rise-in for
  sequences (90ms gap), decision badge and step-trace lines one by one, a
  slight press on tappable tiles, fade-and-collapse for answered requests,
  balances counting to their new value (900ms), bars easing to a new width
  (900ms), overlays and changed chain badges fading.
- Scope: demo screens only (sign-in, Add money, Swipe, Approvals, parent home
  and settlement, wallet balances, card freeze). Never delay a decision or a
  button.
- Respect `prefers-reduced-motion`: show the final state.

## Components

### Headers & Navigation

- **HeaderGradient:** lime band with lime-ink text, easing to a lighter lime.
- **TopNav / Link:** screen background, ink text; inline and row links in
  `primary` (near-black), underlined on hover.

### Buttons

- **Primary:** near-black pill, off-white text, `primary-hover` on hover.
- **Outline:** screen background with an ink border.
- Disabled at 45% opacity; visible focus ring in `primary`.

### Hero & Bands

- **Light** on the screen color with display-xxl, **stone** on the ground color
  with display-md. Hard edges between bands.

### Cards

- **Hero:** lime with lime-ink text, 28px corners.
- **Virtual debit card** (app): charcoal card-face gradient with
  `on-card-face` text, 28px corners, 1.586 aspect. EMV chip with contact lines,
  contactless symbol, masked `•••• •••• •••• 1234` number (last four only),
  holder name, “Valid thru MM/YY”, a “Debit” label and the “Simulated card”
  tag. No card network logo. Frozen: dimmed face with a white “Frozen” pill.
- **Product / photography:** white card on the screen, hairline border.
- **Feature:** pale lime tint, 22px corners.

### Badges

- **Badge:** pale lime tint with near-black text, 8px corners.
- **Chain badge** (app): sky background with sky-ink text, pill.

### Tiles & Footer

- **Footer:** screen background, muted ink, top hairline.
- **DownloadPill:** near-black pill with off-white text.

## Do's and Don'ts

### Do

- Use lime for money objects only, with lime-ink text.
- Use near-black pills for primary actions.
- Use sky only for things recorded on Monad.
- Pair every decision color with an icon and a label.
- Read every value from BRAND through the generated tokens.

### Don't

- Put white text on lime.
- Use sky decoratively.
- Add shadows (beyond the virtual card and signed-out feature cards), glows or
  looping animation.
- Put the virtual card on lime or give it a card network logo.
- Hand-edit `tokens.json`, `src/index.css` or `src/generated/tokens.tsx`.

## Known Gaps

- The mockup's Sprig guide mark, dark pill dock, hatched spending bars, savings
  meter and record feed are not components here yet (listed as Planned in the
  root DESIGN.md).
- The decision color pairs are below 4.5:1 for small text (see Semantic).
- The component reference notes under `docs/references/` still cite the Venmo
  reference for structure and measurements; colors and type now come from the
  mockup through BRAND.
