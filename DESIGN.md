> Derived from /design/reference/trellis-app-mockup.html (current visual source; the earlier /design/reference/venmo.DESIGN.md is kept as history). Edit this file, not the references. All values live in /src/brand/brand.config.ts.

# Product design guide

This is the editable design specification for the app. The current visual
source is the app mockup, `design/reference/trellis-app-mockup.html`. The
first starting point, `design/reference/venmo.DESIGN.md`, is kept as a
historical reference. Both references stay byte-for-byte unchanged and are
never imported by the application (`scripts/tests/design-reference.test.ts`
checks this).

Values below are written as **token names** (such as `color.primary` or
`radius.card`). Current values are shown for readability only; `BRAND` in
`src/brand/brand.config.ts` is authoritative. If this file and `BRAND` ever
disagree, `BRAND` wins and this file should be updated.

## Scope and truthfulness

The product is a family-spending demo with parent guardrails on **Monad testnet
only**. Bank and card concepts are simulated. No real money, bank/card linking,
refunds, receipt uploads, recurring allowances, push notifications, or multiple
families are in scope. Phase 1 adds sign-in and read-only role screens over the
seeded demo family; purchases, decisions, policy editing, funding and blockchain
transactions arrive in later phases.

- Label every sample collection as illustrative preview data.
- Status colors on samples describe component specimens, not actual approvals.
- Use “Preview, not on chain” for illustrative records and “Not on chain yet”
  for real records that have not been written on chain. Never display a
  verified badge or an explorer link without a real confirmed transaction.

## Brand feel and principles

Calm, friendly and trustworthy: a family tool, not a trading app.

- **Lime means money.** `color.signature` marks money and the things that move
  it: the hero balance, the virtual card and the top bar. Text on lime is dark
  lime ink (`color.onSignature`), never white.
- **Sky means recorded on Monad.** `color.chainBg` / `color.chain` appear only
  on things that are, or will be, written on chain.
- **Quiet, dark actions.** Primary buttons are near-black pills
  (`color.primary`) with off-white text (`color.onPrimary`) on a warm stone
  ground. They never compete with the lime money objects.
- **Soft and layered, not shadowed.** Depth comes from stone ground, warm
  screen and white cards stepping up, plus hairlines, not from drop shadows.
- **Big, confident numbers.** Money is the hero of each screen: semibold
  Urbanist display type, tabular numerals, explicit currency.
- **Plain English first.** Every decision explains itself in one everyday
  sentence; codes are secondary, in small mono text.
- **Honest by default.** Samples, simulations and pending chain states are
  labelled as such.

## Brand authority

`src/brand/brand.config.ts` exports the only authoritative `BRAND` object:

| Configuration | Usage |
| --- | --- |
| appName, tagline, copy | Product identity, metadata, reusable brand copy |
| logo, favicon, ogImage, backgroundImage | Canonical asset URLs, relative to the app base path |
| backgroundImageOpacity | How strongly the screen background image shows over the plain surface (0 to 1) |
| colors | Signature, on-colors, action, surface, text and semantic tokens (light) |
| darkColors | Optional explicit dark palette; design-system tokens and docs only, the app has no dark mode |
| fonts | Heading, body and mono families and the font stylesheet |
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
| `color.signature` | `--color-signature` · `bg-signature` | #dcf26e | Money and actions: top bar, hero balance card, virtual card, header band |
| `color.onSignature` | `--color-on-signature` · `text-on-signature` | #1c2008 | Text, icons and lattice hatching on signature fills |
| `color.primary` | `--color-primary` · `bg-primary` | #171815 | Primary button fills, selected pills, focus ring |
| `color.primaryHover` | `--color-primary-hover` | #31332d | Hover and pressed state of primary actions |
| `color.onPrimary` | `--color-on-primary` · `text-on-primary` | #f6f5f1 | Text and icons on primary fills |
| `color.tint` | `--color-tint` | #eef8c2 | Pale lime chips, tint buttons, icon circles, active tab |
| `color.ink` | `--color-ink` | #171815 | Headings and primary body text |
| `color.inkMuted` | `--color-ink-muted` | #5d5f58 | Secondary text only |
| `color.surface` | `--color-surface` | #ffffff | Cards (and, for now, the phone column) |
| `color.surfaceAlt` | `--color-surface-alt` | #f6f5f1 | The warm screen behind cards |
| `color.surfaceGround` | `--color-surface-ground` | #eceae4 | Stone page ground around the phone column |
| `color.hairline` | `--color-hairline` | rgba(23,24,21,0.10) | 1px borders and dividers |
| `color.approved` / `color.approvedBg` | `--color-approved(-bg)` | #1d8a4a on #dff3e6 | Approved ("ok") decisions |
| `color.rejected` / `color.rejectedBg` | `--color-rejected(-bg)` | #c8372d on #fbe3e0 | Declined ("no") decisions |
| `color.pending` / `color.pendingBg` | `--color-pending(-bg)` | #b86a00 on #fcefd6 | Waiting decisions, preview labels |
| `color.chain` / `color.chainBg` | `--color-chain(-bg)` | #12313b on #d3e7ee | Recorded on Monad: chain badges and tags |

The mockup's mid sky (#1f6f8b) is too light for small text on the sky
background (4.4:1), so `color.chain` uses the mockup's darker sky ink.

#### Contrast

| Pair | Ratio |
| --- | --- |
| `onSignature` on `signature` | 13.5:1 |
| `onPrimary` on `primary` | 16.3:1 (11.7:1 on `primaryHover`) |
| `chain` on `chainBg` | 10.8:1 |
| `ink` on `tint` | 16.3:1 |
| `inkMuted` on `surface` / `surfaceAlt` / `surfaceGround` | 6.5 / 5.9 / 5.4:1 |
| `approved` / `rejected` / `pending` on their backgrounds | 3.8 / 4.3 / 3.6:1 |

The decision pairs are the mockup's values and sit below 4.5:1 for small text.
Keep them bold and always paired with an icon and a label; never rely on the
color alone.

#### Dark palette (design system only)

`BRAND.darkColors` holds the mockup's explicit dark palette. It feeds the
design-system tokens and preview; the app does not have a dark mode.

| Token | Dark value |
| --- | --- |
| `surfaceGround` / `surfaceAlt` / `surface` | #10110f / #191a17 / #23241f |
| `ink` / `inkMuted` | #f1f0ea / #a5a69d |
| `primary` / `primaryHover` / `onPrimary` | #f1f0ea / #d9d8d0 / #191a17 |
| `signature` / `onSignature` / `tint` | #dcf26e / #1c2008 / #2f3514 |
| `hairline` | rgba(241,240,234,0.12) |
| `approved` / `rejected` / `pending` (text on bg) | #6fd294 on #1d3526 · #ff8a7f on #3d1f1c · #f2b552 on #3a2c12 |
| `chain` / `chainBg` | #e2f2f7 on #284753 |

### Typography

`font.heading` is **Urbanist**, `font.body` is **Geist** and `font.mono` is
**Geist Mono** (current values), loaded together from
`BRAND.fonts.googleFontsUrl`. Headings use `font-heading` through the type
utilities; codes, reason codes and anything in `<code>` use `font-mono`.
Type tokens are utilities in `index.css`:

| Token | Utility | Size / weight / line height / tracking | Use |
| --- | --- | --- | --- |
| `type.displayXxl` | `.type-display-xxl` | 63 / 600 / 1.0 / -2.2px | Rare hero moments |
| `type.displayXl` | `.type-display-xl` | 51 / 600 / 1.02 / -1.6px | Balances, decision amounts, app name |
| `type.displayMd` | `.type-display-md` | 33 / 600 / 1.05 / -0.9px | Screen titles, onboarding questions |
| `type.title` | `.type-title` | 22 / 600 / 1.2 / -0.5px | Section titles |
| `type.bodyLg` | `.type-body-lg` | 22 / 400 / 1.4 | Lead copy |
| `type.bodyMd` | `.type-body-md` | 18 / 400 / 1.4 | Default prose, decision reasons |
| `type.bodyLead` | `.type-body-lead` | 18 / 500 / 1.4 | Emphasised lead paragraph |
| `type.bodySm` | `.type-body-sm` | 16 / 400 / 1.4 | Row text |
| `type.linkMd` | `.type-link-md` | 18 / 700 / 1.33 | Card titles, strong labels |
| `type.linkSm` | `.type-link-sm` | 16 / 700 / 1.38 | Inline actions, amounts in rows |
| `type.caption` | `.type-caption` | 14 / 400 / 1.43 | Metadata, timestamps |
| `type.label` | `.type-label` | 12 / 600 / 1.3 / +0.06em, uppercase | Eyebrows and small labels |

Display sizes are semibold with about -0.03em tracking, as the mockup sets
Urbanist. Body text keeps normal tracking. Money always uses tabular numbers
(`.tnum`) and explicit currency formatting.

### Spacing

`space.1`–`space.7` = 4, 8, 12, 16, 24, 32, 48 px (`--space-1` … `--space-7`).
Base unit 8px. Card padding is `space.5`–`space.6` (24–32px); 16px between rows
inside a card; 8px between a label and its value.

### Radius

| Token | Utility | Current value | Use |
| --- | --- | --- | --- |
| `radius.pill` | `rounded-pill` | 999px | Every button, status pill, answer pill, the top-bar switcher |
| `radius.card` | `rounded-card` | 28px | Main cards: hero balance, virtual card, panels |
| `radius.cardSm` | `rounded-card-sm` | 22px | Bucket cards and secondary cards |
| `radius.input` | `rounded-input` | 14px | Inputs, list items and small blocks |
| `radius.tag` | `rounded-tag` | 8px | Tags and small labels |

### Surfaces and elevation

The mockup layers three warm neutrals, lightest on top:

| Layer | Token | Use |
| --- | --- | --- |
| Ground | `color.surfaceGround` | The page around the 430px phone column |
| Screen | `color.surfaceAlt` | The screen behind cards |
| Card | `color.surface` | Cards and sheets |

Today the app's phone column is still white with screen-tone cards; moving the
column to `surfaceAlt` with white cards comes with the screen rebuilds
(see Planned). Elevation stays flat: no drop shadows, 1px `color.hairline`
borders where a card needs an edge. The header band (`.header-sky`) is the one
soft gradient: solid lime easing into the screen.

The lattice texture (`.lattice`) on lime cards is a fine diagonal hatch in
`color.onSignature` at low opacity, echoing the mockup's striped bars. It is
never a white overlay.

## Components

### Primitives (`components/trellis/primitives.tsx`)

| Component | Required review states |
| --- | --- |
| LogoMark / Wordmark | Canonical mark, wordmark, readable on light and on signature |
| PillButton | Primary (near-black, `text-on-primary`), outline, tint, on-signature; default, hover, pressed, focus, disabled, loading |
| StatusPill | Approved, declined, pending; icon plus text |
| VerifiedBadge / ChainBadge | Preview, not on chain yet, confirming, and sent specimens; verified only with a real explorer link |
| Tag | Chain, rejected, neutral |
| InitialAvatar | Identities derived from BRAND.demo |
| SectionTitle | Section hierarchy with optional supporting action |

Forced hover/pressed/focus styles are visual specimens, not persistent app
state. Disabled and loading controls must not execute an action. All actionable
controls need visible keyboard focus and an accessible name.

## App layer

### Decision colors

| Decision | Text / icon | Background | Icon | Label |
| --- | --- | --- | --- | --- |
| Approved | `color.approved` | `color.approvedBg` | check circle | “Approved” |
| Declined | `color.rejected` | `color.rejectedBg` | x circle | “Declined” |
| Waiting | `color.pending` | `color.pendingBg` | clock | “Pending” |

Decision colors are **always paired with an icon and a label**, never color alone.

### Layout

- Mobile-first, designed at **390px** wide.
- On wider screens, center the app in a **430px** phone-width column
  (`max-w-phone`) on the `color.surfaceGround` stone ground.
- App shell: the role switcher is pinned at the top on the lime `color.signature` bar, the
  screen scrolls, and the role's tab bar is pinned at the bottom. Both bars stay
  in the column's flow (sticky), so content is never hidden behind them, and
  they pad for the phone's safe areas (`.pt-safe`, `.pb-safe`).
- Roles, tabs and their URLs (`/<role>/<tab>`) live in one route map,
  `artifacts/trellis/src/lib/route-map.ts`. The root opens the last-used role
  (the parent by default).
- Full-screen components (onboarding step, decision result) fill their column.
- At narrow widths, stack compositions and wrap pills. Avoid horizontal page
  overflow.

### App shell and screen states

- A pinned bar holds the wordmark and the role switcher (Parent, Grandparent,
  Dependent, names from BRAND.demo); each role has its own bottom tab bar.
  Inside the 430px column the screen is white (`surface`); cards are the warm
  screen tone (`surfaceAlt`) until the planned layering change.
- Controls for later phases stay visible but disabled, with a short caption
  saying they arrive in a later step. Captions never name phases or the sign-in
  provider, and a disabled control never fakes a result.
- Loading skeletons mirror the layout they replace. Empty states use an icon,
  a short title and one line of guidance. Failed loads say so and offer a retry.

### App components

Built components live in `artifacts/trellis/src/components/trellis/`, take data
through props, and never import preview samples.

| Component | Status | Notes |
| --- | --- | --- |
| Hero balance card | Built | `color.signature` with `color.onSignature` text, on-signature lattice hatching, `type.displayXl` amount |
| Virtual card visual | Built | `color.signature` with `color.onSignature` text, app wordmark, holder name, last four only, “Simulated card”; a frozen card gets a dimmed face and a “Frozen” pill |
| Bucket card | Built | Icon, amount left of total, progress bar, held amount, who funds it |
| Activity feed row | Built | Plain-English sentence, signed amount, status pill, optional steps and chain badge |
| “Verified on Monad” badge | Built | Sky `color.chainBg` pill with `color.chain` text with `BRAND.copy.verifiedLabel`, links to the explorer; real confirmed transactions only |
| Onboarding step layout | Built | Back button, progress dots, one question, single-tap pill answers, large continue button, “Skip to demo” |
| Full-screen decision result card | Built | Icon + label, amount, merchant, plain-English reason, reason code in small `font.mono` text, who decided (Rule or AI guard, with its confidence), measured decision time, when, chain status; `BRAND.copy.askParentLabel` button for declined and pending (disabled until asking arrives). Rows for who decided and the measured time appear only with real values |
| Empty states | Built | Tint icon circle, title, one sentence, optional action |
| Loading skeletons | Built | Shapes match hero, bucket and activity row; announced once as “Loading” |
| Role switcher | Built | Pill segmented control on the `color.signature` top bar; one link per role (BRAND.demo name + role) to that role's first tab |
| Bottom tab bar per role | Built | Solid `color.primary` (near-black) bar with `onPrimary` icons and labels; active tab gets a `color.signature` pill with `onSignature` icon, bold label and `aria-current`; optional count badge (parent Approvals shows waiting swipes); never links to /brand |
| Coming-soon screen | Built | Tab title on the header sky plus an empty state; placeholder for tabs not built yet, no sample data or actions |
| Policy card | Built | Preset name and plain-English lines (block, ask, limit, time) |
| Approval card | Built | Request sentence, reason, bucket, time; approve/decline shown disabled until decisions arrive |
| Swipe-simulator merchant tile | Built | Two-column grid of `color.surfaceAlt` tiles: category icon, merchant name, “Category · MCC”, price, and the simulated time when it isn't now; spinner while its swipe is in flight. The server decides; tiles never predict an outcome |


### Planned patterns from the mockup

These are in the mockup but not in the app yet. Do not fake them with
partial styling; build them as real components when their screens are rebuilt.

| Pattern | Notes |
| --- | --- |
| Sprig guide mark | The small sprout character on the welcome screen and in guidance moments |
| Dark pill dock | Floating near-black pill bottom navigation replacing the full-width tab bar |
| Hatched spending bars | Per-bucket bars with on-signature hatching for spent amounts |
| Savings meter | Goal card with a progress meter |
| Record feed | Chain-record list styled with the sky palette |
| Screen layering | Phone column on `surfaceAlt` with white cards |

### Motion

Motion only happens when **money moves, a decision lands, or Monad confirms**.
Nothing moves for decoration.

- One easing curve: `ease-settle` = cubic-bezier(0.2, 0.8, 0.2, 1). No bounce
  or overshoot.
- Three durations: **350ms** (quick: taps, small state changes), **600ms**
  (base: a decision card or the virtual card arriving), **900ms** (slow: a
  chain confirmation or balance settling).
- Short distances: rise a few pixels, scale from 0.97 at most.
- Nothing loops: no spinners left running for effect, no pulsing badges.
- Presets live in `components/trellis/motion.ts`: the decision result card
  fades in and rises (600ms); the virtual card rises and settles from 97% on
  “Accept card” (600ms).
- Respect reduced-motion settings (`motion-reduce:animate-none`): show the
  final state without animating.
- Hover and press color changes are feedback, not motion, and stay short.

### Copy

- Short, friendly, plain English. Say what happened and why in one sentence.
- Use names from `BRAND.demo`, never “the user” or role codes.
- Reason codes appear only in small text under the plain-English reason.
- Never show raw transaction hashes as main text; they live only behind the
  “Verified on Monad” link.
- Preview-only interactions say so (“preview only, nothing was sent or saved”).

## Do's and don'ts

**Do**
- Keep lime for money objects and the top bar, with `text-on-signature` on it.
- Use near-black `color.primary` pills with `text-on-primary` for primary actions.
- Use sky only for things recorded on Monad.
- Layer ground, screen and card surfaces; use hairlines for edges.
- Pair every decision color with an icon and a label.
- Use `font-mono` for codes and reason codes.
- Read every brand value from `BRAND` (or its CSS variables).

**Don't**
- Put white text on lime, or use lime for a button's text color.
- Use sky for anything that is not about the chain.
- Add drop shadows, glows or looping animation.
- Animate anything that is not money moving, a decision landing or a chain
  confirmation.
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
in phone-sized frames (with replay controls); empty-state and loading samples;
the role switcher and each role's tab bar, including a clickable shell in a
phone frame that keeps its own address.

All samples are labelled as preview data and do not call APIs or persist
anything. Production builds do not include the preview; /brand shows an honest
“not available” message there. /brand renders outside the app shell and sits
outside sign-in; every other route needs a signed-in session, and the root
opens the last-used role (the parent home by default).

## Canonical assets

`public/brand/` is the sole public asset directory. The Vite brand plugin
regenerates SVG files that contain `generated-from-brand-config` from `BRAND`
at startup and build; files you replace by hand (without that marker) are left
alone. Do not duplicate assets into an artifact-local public directory.

The Open Graph image is raster art: changing a name in configuration does not
repaint text inside the PNG. Replace it deliberately when rebranding.

The screen background (`backgroundImage`, a portrait WebP) sits behind the
phone-width column on every role tab and the signed-out screen, faded over the
plain surface by `backgroundImageOpacity`. It is fixed to the viewport and
covers the column, so it never tiles or scrolls. Cards on it use the plain
surface with a hairline border so they stand out from the cream.

## How to rebrand

1. Edit `/src/brand/brand.config.ts` (names, tagline, logo alt text, colors and
   their on-colors, the optional `darkColors` palette, heading/body/mono fonts,
   radii, spacing, demo identities, reusable copy).
2. Replace files in `/public/brand/`, keeping the same filenames. Generated SVGs
   update themselves; replace `og.png` and `background.webp` by hand.
3. Add the new app name, demo names, bank names, fonts, font stylesheet URL and
   any non-hex colors to `/src/brand/brand-history.ts`, keeping the old ones.
   `pnpm test` lists any that are missing, and keeps flagging the old values if
   a screen still hardcodes them.
4. Optionally update `/DESIGN.md` so the token values shown here match.
5. Restart the Trellis workflow and open **/brand** to verify. No other file
   should need changes.

Before shipping a rebrand, also check page title, description, theme color,
favicon and OG tags, run `pnpm run typecheck`, `pnpm test` and
`pnpm test:build`. If you maintain the design-system artifact, use its brand
sync command (`pnpm --filter @workspace/trellis-design run tokens`) rather
than editing its generated tokens.

## Phase gate

Before later product phases, verify the role screens and /brand on mobile
(390px) and desktop, keyboard focus and disabled/loading states, asset loading,
and centralized rebranding. Confirm the references and canonical assets remain unchanged for a
preview-only change. A component preview is not proof that any banking or
blockchain flow works.
