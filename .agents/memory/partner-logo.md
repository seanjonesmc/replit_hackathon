---
name: Partner (Monad) logo raster
description: How the official Monad logo PNG was turned into a transparent web image, and the rule against redrawing or recolouring it.
---
The "Powered by" Monad logo is the user's official PNG, trimmed and made transparent, never redrawn or recoloured. It was supplied on white, so white was removed by un-blending each pixel against the two known logo colours (purple mark vs dark lettering, split by a blank column between them). That keeps the anti-aliased edges clean on lime. A plain colour-to-transparent fuzz leaves a white halo.

**Why:** the user wants the logo to look exactly like the official artwork. ImageMagick (`magick`) is installed here; Python has no PIL.
**How to apply:** if the logo is ever re-exported or swapped, use the same un-blend method and keep it at about 2x its display height.
