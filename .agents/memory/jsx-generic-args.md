---
name: No explicit generics on JSX elements
description: The web dev server's Babel parser rejects `<Comp<T> ...>` even though tsc accepts it.
---
Don't write explicit type arguments on JSX elements (`<FilterGroup<number | null> ...>`) in the trellis web app. `pnpm run typecheck` and Vitest pass, but the Vite dev server's Babel transform fails with "Unexpected token" and the whole app shows a compile overlay.

**Why:** typecheck and unit tests don't run the dev server's transform, so only a real browser load catches it.

**How to apply:** let TypeScript infer the generic from typed props (typed option constants, `NoInfer<T>` on callback params).
