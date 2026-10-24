---
name: /brand route shares its name with the brand asset folder
description: Risk note for the hidden /brand preview route versus public/brand/ assets in production static hosting.
---

The dev-only preview route `/brand` has the same path as the canonical asset
folder `public/brand/` (served at `/brand/...`). In dev, Vite falls through to
the SPA and the route works (wouter matches `/brand` and `/brand/`). In the
published static build, whether `/brand` is rewritten to `index.html` (showing
the "not available" fallback) or resolved as the asset directory has not been
verified as of 2026-10-24.

**Why:** the spec fixes both names (route `/brand`, assets in `/public/brand/`),
so neither can be renamed without a spec change.

**How to apply:** when touching deployment/static serving or the /brand page,
check the published `/brand` once; don't assume the SPA rewrite wins.
