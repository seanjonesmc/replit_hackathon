---
name: Brand logo (family sprout)
description: How the sprout logo is produced and why the in-app lockup is inline rather than the SVG file.
---
The logo is the "family sprout" (lime top leaf, two dark side leaves, two stems), redrawn by hand as vector paths from the user's raster brand sheet on 2026-10-24. The generated SVG files and the in-app inline glyph share one set of paths.

**Why:** the user supplied only a PNG, so there are no official vectors. The wordmark SVG's text can't load web fonts when shown through an img tag, so it renders in a fallback sans.
**How to apply:** draw lockups in the app inline (glyph plus heading-font text), not from logo-wordmark.svg. On a signature (lime) fill, use the tiled app icon because the lime top leaf would disappear. If the user later supplies real vector files, drop them into public/brand without the generated marker and the plugin will leave them alone.
