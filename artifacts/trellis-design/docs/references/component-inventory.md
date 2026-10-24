# Source component inventory

Source: ../../../../design/reference/venmo.DESIGN.md, curated visual specification from https://www.shadcn.io/design/venmo/raw. No third-party implementation code is copied. Internal scaffold primitives supply behavior.

| Family | Reference | Dependencies | Evidence/order | Chunk | Status |
|---|---|---|---|---|---|
| HeaderGradient | components/header-gradient.md | none | first source family | 1 | implemented |
| TopNav | components/top-nav.md | Link | second source family | 1 | implemented |
| Link (nav, inline, row, footer) | components/link.md | none | first link appears third | 1 | implemented |
| Button (primary, hover, outline) | components/button.md | Radix Slot, CVA | fourth source family | 1 | implemented |
| HeroBand (light, sand) | components/hero-band.md | none | follows buttons | 1 | implemented |
| Card (hero, product, photography, pale) | components/card.md | none | follows hero bands | 2 | pending |
| Badge | components/badge.md | none | after inline link | 2 | pending |
| Footer | components/footer.md | Link | after badge | 2 | pending |
| DownloadPill | components/download-pill.md | none | final source family | 2 | pending |

Pilot presents exactly five normalized families. Remaining components await visual approval. App-specific virtual cards, balances, decisions, and onboarding remain in the app layer.
