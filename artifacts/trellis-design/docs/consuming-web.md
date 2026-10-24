# Consuming Trellis Design System in web apps

Read `artifacts/trellis-design/docs/AGENTS.md` first. This guide covers
React/Vite and other shadcn/Tailwind web consumers. If the app already contains
a local theme or component library, also read
`artifacts/trellis-design/docs/migrating-web.md` before writing UI.

## Theme

Import this package's theme once from the app's main CSS:

```css
@import "@workspace/trellis-design/styles.css";
```

`styles.css` already imports Tailwind, its plugins, and this package's token
theme. It also registers this package's component sources. Do not add a separate
Tailwind import or a `node_modules` source path in a Tailwind v4 consumer.
Tailwind v3 consumers keep their existing `@tailwind` directives and add
`node_modules/@workspace/trellis-design/src/components` to `content`.

## Components and helpers

Import provided primitives and `cn` directly from this package:

```tsx
import { Button } from "@workspace/trellis-design/components/ui/button";
import { cn } from "@workspace/trellis-design/lib/utils";
import { Card, CardTitle } from "@workspace/trellis-design/components/ui/card";
```

Use the package component whenever it provides the required family. Keep
product-specific compositions in the app, but compose them from package
primitives rather than recreating those primitives locally.

This package does not ship inputs, toast hooks, or a Toaster. Keep those local.
Shipped modules: button, header-gradient, top-nav, link, hero-band, card, badge, footer, download-pill.
Button variants: default/outline. Card variants: product/hero/photography/feature.
Badge has one static tag treatment. Check local prop usage before replacing imports.

## Verify

After wiring the workspace dependency, import and render
`@workspace/trellis-design/components/ui/button`. Run the app's typecheck
and dev server. The import must resolve and the Button must use this package's
theme before broader UI work begins.

## Ongoing rules

- Keep one source of theme variables.
- Import package-provided primitives and helpers from the package path.
- Add reusable product-agnostic components to this package first.
- For a non-shadcn app, use the tokens as the source of truth and adapt existing
  components to the token CSS variables without copying token values.
