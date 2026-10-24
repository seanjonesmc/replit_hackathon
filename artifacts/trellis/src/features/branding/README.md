# Branding preview

Development-only brand/component preview at the hidden `/brand` route (no tab
bar or link points to it). It composes the shared components in
`components/trellis` with samples from `lib/preview-data.ts`; do not copy
configuration, tokens, assets or components here. Canonical values remain in
root `src/brand/`, assets in root `public/brand/`.

`pages/brand.tsx` lazy-loads `BrandPreview` only when `import.meta.env.DEV` is
true, so production builds drop the preview and its samples and render
`PreviewUnavailable` instead (checked by `pnpm test:build`). The root route is a
separate branded holding screen with no sample data.

Every sample block carries the preview-data label. Interactions change local
presentation state only and say so; no APIs, persistence, verified badges or
explorer links. See root `DESIGN.md` for state coverage, scope and rebranding.
