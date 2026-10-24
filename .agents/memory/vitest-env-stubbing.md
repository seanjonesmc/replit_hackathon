---
name: Vitest env stubbing and import.meta.env
description: Why app code must read Vite env vars via the literal import.meta.env expression.
---
Read Vite env values (e.g. BASE_URL) via the literal `import.meta.env.X` expression — never through a cast like `(import.meta as ...).env`.

**Why:** Vite builds still replace the cast form, but Vitest only rewrites the literal expression. Through a cast, `vi.stubEnv` is ignored and the module always sees `/`, so sub-path base tests silently cover only the root case.

**How to apply:** When adding base-path-aware code under src/brand or the trellis app, use the literal form (trellis tsconfig has vite/client types). Tests that need a DOM opt in per file with a happy-dom environment docblock; the trellis project default stays node.
