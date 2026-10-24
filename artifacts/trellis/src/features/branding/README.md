# Branding preview

Development-only brand/component preview at the app root. Consume `@brand`
and `components/trellis`; do not copy configuration, tokens, assets, or primitives.
Canonical values remain in root `src/brand/`, assets in root `public/brand/`.

`App.tsx` lazy-loads `BrandPreview` only when `import.meta.env.DEV` is true.
Production renders `PreviewUnavailable` without the component samples.
Interactions change local presentation state only; no APIs or persistence.
See root `DESIGN.md` for state coverage, scope and rebranding instructions.
