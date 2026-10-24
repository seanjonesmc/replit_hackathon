> Derived from /design/reference/venmo.DESIGN.md. Edit this file, not the reference. All values live in /src/brand/brand.config.ts.

# Product design guide

This is the editable design specification for the app. The visual starting
point is `design/reference/venmo.DESIGN.md`; that reference stays byte-for-byte
unchanged and is never imported by the application. This guide describes our
product, not Venmo's product or assets.

Values below are written as **token names** (such as `color.primary` or
`radius.card`). Current values are shown for readability only; `BRAND` in
`src/brand/brand.config.ts` is authoritative. If this file and `BRAND` ever
disagree, `BRAND` wins and this file should be updated.

## Scope and truthfulness

The product is a family-spending demo with parent guardrails on **Monad testnet
only**. Bank and card concepts are simulated. No real money, bank/card linking,
refunds, receipt uploads, recurring allowances, push notifications, or multiple
families are in scope.

- Label every sample collection as illustrative preview data.
- Status colors on samples describe component specimens, not actual approvals.
- Use “Preview, not on chain” for illustrative records. Never display a verified
  badge or an explorer link without a real confirmed transaction.

## Brand feel and principles

Calm, friendly and trustworthy: a family tool, not a trading app.

- **Atmospheric signature, quiet actions.** One saturated color sets the mood at
  the top of the screen and on the money objects (hero balance, virtual card).
  Actions use a darker, separate blue so they never blend into the atmosphere.
- **Flat and hard-edged.** Depth comes from white and warm sand surfaces meeting
  directly, and from hairline borders, not from shadows or soft fades.
- **Big, confident numbers.** Money is the hero of each screen: large display
  type, tabular numerals, explicit currency.
- **Plain English first.** Every decision explains itself in one everyday
  sentence; technical codes are secondary.
- **Honest by default.** Samples, simulations and pending chain states are
  labelled as such.

## Brand authority

`src/brand/brand.config.ts` exports the only authoritative `BRAND` object:

| Configuration | Usage |
| --- | --- |
| appName, tagline, copy | Product identity, metadata, reusable brand copy |
| logo, favicon, ogImage | Canonical asset URLs, relative to the app base path |
| colors | Signature, action, surface, text and semantic tokens |
| fonts | Heading/body families and font stylesheet |
| radius, spacing | Shared shape and spacing scales |
| demo | All illustrative family, person, bank and card identities |

Do not add a second theme or paste brand literals into feature components.
`src/brand/brand-css.ts` derives CSS variables and browser metadata from `BRAND`
at startup; `artifacts/trellis/src/index.css` maps Tailwind utilities to those
variables (its values are neutral placeholders, not another palette). The
separate design-system artifact derives its tokens from this same source. The
app keeps its own primitives for now; it is not migrated to that package.

## Tokens

### Color

| Token | CSS variable / utility | Current value | Use |
| --- | --- | --- | --- |
| `color.signature` | `--color-signature` · `bg-signature` | #008cff | Atmosphere only: header sky, hero balance card, virtual card |
| `color.primary` | `--color-primary` · `bg-primary` | #0074de | Button fills, links, progress, focus ring |
| `color.primaryHover` | `--color-primary-hover` | #005ba4 | Hover and pressed state of primary actions |
| `color.tint` | `--color-tint` | #deefff | Pale chips, tint buttons, icon circles |
| `color.ink` | `--color-ink` | #000000 | Headings and primary body text |
| `color.inkMuted` | `--color-ink-muted` | #2f3033 | Secondary text only |
| `color.surface` | `--color-surface` | #ffffff | Cards, phone column, on-color text |
| `color.surfaceAlt` | `--color-surface-alt` | #f1efea | Warm sand page background and bands |
| `color.hairline` | `--color-hairline` | rgba(0,0,0,0.12) | 1px borders and dividers |
| `color.approved` / `color.approvedBg` | `--color-approved(-bg)` | #16A34A on #DCFCE7 | Approved decisions |
| `color.rejected` / `color.rejectedBg` | `--color-rejected(-bg)` | #DC2626 on #FEE2E2 | Declined decisions |
| `color.pending` / `color.pendingBg` | `--color-pending(-bg)` | #D97706 on #FEF3C7 | Pending decisions, preview labels |
| `color.chain` / `color.chainBg` | `--color-chain(-bg)` | #0074de on #deefff | Chain badges |

### Typography

`font.heading` and `font.body` are both **Inter** (current value), loaded from
`BRAND.fonts.googleFontsUrl`. Type tokens are utilities in `index.css`:

| Token | Utility | Size / weight / line height / tracking | Use |
| --- | --- | --- | --- |
| `type.displayXxl` | `.type-display-xxl` | 63 / 500 / 1.0 / -1.89px | Rare hero moments |
| `type.displayXl` | `.type-display-xl` | 51 / 500 / 1.05 / -1.02px | Balances, decision amounts, app name |
| `type.displayMd` | `.type-display-md` | 33 / 500 / 1.05 / -0.67px | Screen titles, onboarding questions |
| `type.title` | `.type-title` | 22 / 600 / 1.2 / -0.44px | Section titles |
| `type.bodyLg` | `.type-body-lg` | 22 / 400 / 1.4 | Lead copy |
| `type.bodyMd` | `.type-body-md` | 18 / 400 / 1.4 | Default prose, decision reasons |
| `type.bodyLead` | `.type-body-lead` | 18 / 500 / 1.4 | Emphasised lead paragraph |
| `type.bodySm` | `.type-body-sm` | 16 / 400 / 1.4 | Row text |
| `type.linkMd` | `.type-link-md` | 18 / 700 / 1.33 | Card titles, strong labels |
| `type.linkSm` | `.type-link-sm` | 16 / 700 / 1.38 | Inline actions, amounts in rows |
| `type.caption` | `.type-caption` | 14 / 400 / 1.43 | Metadata, timestamps, reason codes |
| `type.label` | `.type-label` | 12 / 600 / 1.3 / +0.06em, uppercase | Eyebrows and small labels |

### Spacing

`space.1`–`space.7` = 4, 8, 12, 16, 24, 32, 48 px (`--space-1` … `--space-7`).
Base unit 8px. Card padding is `space.5`–`space.6` (24–32px); 16px between rows
inside a card; 8px between a label and its value.

### Radius

| Token | Utility | Current value | Use |
| --- | --- | --- | --- |
| `radius.pill` | `rounded-pill` | 1000px | Every button, status pill, answer pill |
| `radius.card` | `rounded-card` | 32px | Main cards: hero balance, virtual card, panels |
| `radius.cardSm` | `rounded-card-sm` | 24px | Bucket cards and secondary cards |
| `radius.tag` | `rounded-tag` | 4px | Tags and small labels |
| `radius.input` | `rounded-input` | 8px | Inputs and small blocks |

### Elevation

| Token | Treatment |
| --- | --- |
| `elevation.flat` | Default: no shadow |
| `elevation.hairline` | 1px `color.hairline` border |
| `elevation.band` | `color.surface` meeting `color.surfaceAlt` with a hard edge |

The header sky (`.header-sky`) is the one soft gradient. Shadows are not used.

## Key rules from the reference

- `color.signature` is atmospheric only: the header gradient, the hero balance
  card and the virtual card. It is **never a button fill**.
- Buttons are `color.primary` pills: `radius.pill` (1000px, never 9999px),
  48px tall, padding 12px 34px, `color.primaryHover` on hover and press.
- Surfaces are white `color.surface` and warm sand `color.surfaceAlt`, meeting
  with hard edges. No soft fades between bands.
- Hairline borders instead of shadows.
- `radius.card` (32px) is the main card radius.
- Headings use one weight (500 for display) with negative letter-spacing that
  grows with size. Body text keeps normal tracking.
- `color.ink` for primary text; `color.inkMuted` only for secondary text.

## Components

### Primitives (`components/trellis/primitives.tsx`)

| Component | Required review states |
| --- | --- |
| LogoMark / Wordmark | Canonical mark, wordmark, readable on light and on signature |
| PillButton | Primary, outline, tint, on-dark; default, hover, pressed, focus, disabled, loading |
| StatusPill | Approved, declined, pending; icon plus text |
| VerifiedBadge / ChainBadge | Preview and confirming specimens; verified only with a real explorer link |
| Tag | Chain, rejected, neutral |
| InitialAvatar | Identities derived from BRAND.demo |
| SectionTitle | Section hierarchy with optional supporting action |

Forced hover/pressed/focus styles are visual specimens, not persistent app
state. Disabled and loading controls must not execute an action. All actionable
controls need visible keyboard focus and an accessible name.

## App layer

Everything the reference does not cover.

### Fonts

Venmo's fonts are not available. Use Inter (Google Fonts, 400/500/600/700)
with the reference's sizes, weights, line heights and negative heading
letter-spacing (see Typography). Money always uses tabular numbers (`.tnum`)
and explicit currency formatting.

### Decision colors

| Decision | Text / icon | Background | Icon | Label |
| --- | --- | --- | --- | --- |
| Approved | `color.approved` #16A34A | `color.approvedBg` #DCFCE7 | check circle | “Approved” |
| Declined | `color.rejected` #DC2626 | `color.rejectedBg` #FEE2E2 | x circle | “Declined” |
| Pending | `color.pending` #D97706 | `color.pendingBg` #FEF3C7 | clock | “Pending” |

Decision colors are **always paired with an icon and a label**, never color alone.

### Layout

- Mobile-first, designed at **390px** wide.
- On wider screens, center the app in a **430px** phone-width column
  (`max-w-phone`) on the `color.surfaceAlt` sand background.
- Full-screen components (onboarding step, decision result) fill their column.
- At narrow widths, stack compositions and wrap pills. Avoid horizontal page
  overflow.

### App components

Built components live in `artifacts/trellis/src/components/trellis/`, take data
through props, and never import preview samples.

| Component | Status | Notes |
| --- | --- | --- |
| Hero balance card | Built | `color.signature`, lattice texture, `type.displayXl` amount |
| Virtual card visual | Built | `color.signature`, app wordmark, holder name, last four only, “Simulated card” |
| Bucket card | Built | Icon, amount left of total, progress bar, held amount, who funds it |
| Activity feed row | Built | Plain-English sentence, signed amount, status pill, optional steps and chain badge |
| “Verified on Monad” badge | Built | Pale-blue `color.chainBg` pill with `BRAND.copy.verifiedLabel`, links to the explorer; real confirmed transactions only |
| Onboarding step layout | Built | Back button, progress dots, one question, single-tap pill answers, large continue button, “Skip to demo” |
| Full-screen decision result card | Built | Icon + label, amount, merchant, plain-English reason, reason code in small text, decision time, chain status; `BRAND.copy.askParentLabel` button for declined and pending |
| Empty states | Built | Tint icon circle, title, one sentence, optional action |
| Loading skeletons | Built | Shapes match hero, bucket and activity row; announced once as “Loading” |
| Role switcher | Planned | Pill segmented control pinned at the top |
| Bottom tab bar per role | Planned | Not linked to /brand |
| Swipe-simulator merchant grid | Planned | Later phase |
| Policy card | Planned | Later phase |

### Motion

- 150–250ms, ease-out, for every transition.
- The decision result card scales in from 0.95 (200ms).
- The virtual card animates in on “Accept card” (rise and scale, 250ms).
- One subtle celebration when a funder adds money. Nothing else celebrates.
- Respect reduced-motion settings: show the final state without animating.

### Copy

- Short, friendly, plain English. Say what happened and why in one sentence.
- Use names from `BRAND.demo`, never “the user” or role codes.
- Reason codes appear only in small text under the plain-English reason.
- Never show raw transaction hashes as main text; they live only behind the
  “Verified on Monad” link.
- Preview-only interactions say so (“preview only, nothing was sent or saved”).

## Do's and don'ts

**Do**
- Keep `color.signature` for atmosphere and money objects.
- Use `color.primary` pills for every action.
- Separate content with surface changes and hairlines.
- Pair every decision color with an icon and a label.
- Read every brand value from `BRAND` (or its CSS variables).

**Don't**
- Fill a button with `color.signature`.
- Add drop shadows or soft fades between white and sand.
- Use `color.inkMuted` for primary body text.
- Show a verified badge, explorer link or transaction hash without a real
  confirmed transaction.
- Hardcode app names, colors, fonts, radii, logo paths, demo names or bank names
  outside `BRAND` and this file.

## Brand preview at /brand

The development-only preview lives at the hidden **/brand** route (no tab bar or
link points to it). It is composed in `artifacts/trellis/src/features/branding`
from the shared components above and shows: logo, app name and tagline; color
swatches with values; the type scale; spacing and radii; buttons in every state;
status pills, badges, tags and avatars; the hero balance card, virtual card,
bucket cards and activity rows; an onboarding step and the decision result card
in phone-sized frames (with replay controls); empty-state and loading samples.

All samples are labelled as preview data and do not call APIs or persist
anything. Production builds do not include the preview; /brand shows an honest
“not available” message there. Until the app shell lands, the root shows a
minimal branded holding screen (logo, app name, tagline, no sample data).

## Canonical assets

`public/brand/` is the sole public asset directory. The Vite brand plugin
regenerates SVG files that contain `generated-from-brand-config` from `BRAND`
at startup and build; files you replace by hand (without that marker) are left
alone. Do not duplicate assets into an artifact-local public directory.

The Open Graph image is raster art: changing a name in configuration does not
repaint text inside the PNG. Replace it deliberately when rebranding.

## How to rebrand

1. Edit `/src/brand/brand.config.ts` (names, tagline, logo alt text, colors,
   fonts, radii, spacing, demo identities, reusable copy).
2. Replace files in `/public/brand/`, keeping the same filenames. Generated SVGs
   update themselves; replace `og.png` by hand.
3. Add the new app name, demo names, bank names and fonts to
   `/src/brand/brand-history.ts`, keeping the old ones. `pnpm test` lists any
   that are missing, and keeps flagging the old values if a screen still
   hardcodes them.
4. Optionally update `/DESIGN.md` so the token values shown here match.
5. Restart the Trellis workflow and open **/brand** to verify. No other file
   should need changes.

Before shipping a rebrand, also check page title, description, theme color,
favicon and OG tags, run `pnpm run typecheck`, `pnpm test` and
`pnpm test:build`. If you maintain the design-system artifact, use its brand
sync command rather than editing its generated tokens.

## Phase gate

Before later product phases, verify /brand on mobile (390px) and desktop,
keyboard focus and disabled/loading states, asset loading, and centralized
rebranding. Confirm the reference and canonical assets remain unchanged for a
preview-only change. A component preview is not proof that any banking or
blockchain flow works.
