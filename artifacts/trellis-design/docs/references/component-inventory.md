# Source component inventory

Source: ../../../../design/reference/venmo.DESIGN.md, curated visual specification from https://www.shadcn.io/design/venmo/raw. No third-party implementation code is copied. Internal scaffold primitives supply behavior.

Colors, type, radii and motion now come from the app mockup (../../../../design/reference/trellis-app-mockup.html) through root BRAND; the per-family notes below still cite the Venmo reference for structure and measurements.

| Family | Reference | Dependencies | Evidence/order | Chunk | Status |
|---|---|---|---|---|---|
| HeaderGradient | components/header-gradient.md | none | first source family | 1 | implemented |
| TopNav | components/top-nav.md | Link | second source family | 1 | implemented |
| Link (nav, inline, row, footer) | components/link.md | none | first link appears third | 1 | implemented |
| Button (primary, hover, outline) | components/button.md | Radix Slot, CVA | fourth source family | 1 | implemented |
| HeroBand (light, sand) | components/hero-band.md | none | follows buttons | 1 | implemented |
| Card (hero, product, photography, pale) | components/card.md | none | follows hero bands | 2 | implemented |
| Badge | components/badge.md | none | after inline link | 2 | implemented |
| Footer | components/footer.md | Link | after badge | 2 | implemented |
| DownloadPill | components/download-pill.md | none | final source family | 2 | implemented |

All nine normalized families are implemented. The first five were approved before the remaining four were built. App-specific virtual cards, balances, decisions, and onboarding remain in the app layer.

The app-layer virtual debit card is not a design-system component, but its colors are design-system tokens: `cardFace` and `cardFaceEnd` (the charcoal face gradient), `onCardFace` (text and icons on the face, 4.5:1 or better) and `cardChip` (the EMV chip), generated from `BRAND.colors` into `tokens.json`, `src/generated/tokens.tsx` and `src/brand-vars.css` (`--brand-cardFace`, ...). It never uses `signature` lime, so it reads apart from the hero balance card.
