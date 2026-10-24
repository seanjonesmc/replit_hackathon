# Product design guide

This is the editable Phase 0 design specification. The visual starting point is
`design/reference/venmo.DESIGN.md`; that reference stays byte-for-byte unchanged
and is never imported by the application. This guide describes our product,
not Venmo's product or assets.

## Scope and truthfulness

The product is a family-spending demo with parent guardrails on **Monad testnet
only**. Bank and card concepts are simulated. Phase 0 implements brand and
component review, not onboarding, permissions, balances, funding, spending,
policy decisions, or blockchain transactions.

The development homepage is a component preview. Label every sample collection
as illustrative preview data. Status colors describe component specimens, not
actual approvals. A confirming specimen does not imply a live request.
Use “Preview, not on chain” for illustrative records. Do not display a verified
transaction or explorer link without a real confirmed transaction.

No real money, bank/card linking, refunds, receipt uploads, recurring allowances,
push notifications, or multiple families are in scope.

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
`src/brand/brand-css.ts` derives CSS variables and browser metadata. The app
stylesheet maps utilities to those variables; its neutral placeholders are not
another palette. The separate reusable design-system artifact has its own
consumption documentation and derives its brand tokens from this same source.
This phase preserves the existing app primitives; it does not migrate the app
to another component package.

## Visual language

- Use signature color for atmospheric header areas and identity; use primary
  and primary-hover for actions. Do not confuse signature and action colors.
- Alternate surface and surface-alt to group content. Hairline borders separate
  rows without heavy shadows.
- Use ink for headings and ink-muted for supporting text. Do not rely on color
  alone for decisions: approved, declined, and pending always include a label
  and an icon.
- Use heading/body fonts from BRAND. Existing type utilities provide display
  sizes of 63, 51 and 33px, 22px section titles, 18/16px body copy, 14px captions
  and 12px uppercase labels. Keep large display text responsive.
- Use the configured spacing scale for section and card rhythm; configured
  pill, card, cardSm, tag and input radii define the shape language.
- Amounts use tabular numerals and explicit currency formatting. Preview
  balances and merchant records are never a source of business truth.
- At narrow widths, stack compositions and wrap state specimens. Avoid
  horizontal page overflow and preserve readable labels.

## Shared components and state contract

Compose the preview in `artifacts/trellis/src/features/branding` from
`artifacts/trellis/src/components/trellis/primitives.tsx`.

| Component | Required review states |
| --- | --- |
| LogoMark / Wordmark | Canonical mark, wordmark, readable light/dark contexts |
| PillButton | Primary, outline, tint, on-dark; default, hover, pressed, focus, disabled, loading |
| StatusPill | Approved, declined, pending; icon plus text |
| VerifiedBadge | Preview and clearly labeled confirming specimen; no fabricated proof |
| Tag | Chain, rejected, neutral |
| InitialAvatar | Identities derived from BRAND.demo |
| SectionTitle | Section hierarchy with optional supporting action |

Forced hover/pressed/focus styles are visual specimens, not persistent app
state. Disabled and loading controls must not execute an action. All actionable
controls need visible keyboard focus and an accessible name. Any preview-only
interaction must explicitly say that it changes no account or transaction.
Samples can compose these primitives into bucket and activity rows, but must
remain in the development-only feature. Do not call APIs or persist samples.

## Canonical assets

`public/brand/` is the sole public asset directory. The existing Vite brand
plugin derives marked SVG assets from BRAND at startup/build. It preserves
custom files that do not contain `generated-from-brand-config`.
Do not duplicate assets into an artifact-local public directory.

Raster artwork such as the Open Graph image is a separate creative asset:
changing a name in configuration does not repaint text embedded in a PNG.
Replace that artwork deliberately and update `BRAND.ogImage` when rebranding.

## How to rebrand

1. Edit only `src/brand/brand.config.ts` for names, tagline, logo alt text,
   colors, fonts, radii, spacing, demo identities and reusable brand copy.
2. Keep canonical asset paths, or point the config to deliberate replacements
   under `public/brand/`. Leave the immutable reference untouched.
3. Restart the managed Trellis workflow so the build-time SVG generator and
   metadata plugin reload. Refresh the browser to reapply runtime variables.
4. Check the development preview: wordmark, all color swatches, type families,
   radii/spacing specimens, family identities and reusable button copy should
   change together. Inspect title, description, theme-color, favicon and OG
   tags as well as visible UI.
5. If maintaining the reusable design-system artifact, use its documented
   brand sync command rather than editing generated tokens independently.
6. Run typechecking and a production build. Confirm the development preview
   and its sample records are absent from production output.

## Phase gate

Before later product phases, verify the preview on desktop and mobile, keyboard
focus and disabled/loading states, asset loading, and centralized rebranding.
Confirm the reference and canonical assets remain unchanged for a preview-only
change. Production must show an honest unavailable message, not sample accounts.
Regression automation is tracked separately; a component preview is not proof
that any banking or blockchain flow works.
