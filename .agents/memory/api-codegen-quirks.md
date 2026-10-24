---
name: API codegen quirks
description: Non-obvious mismatches between the generated React client and the server-side Zod validators.
---
The generated React client types OpenAPI `date-time` fields as ISO strings, while the generated server Zod schemas type them as `Date`.

**Why:** The two generators treat `format: date-time` differently; mixing them up compiles on one side and breaks at runtime on the other.

**How to apply:** Frontend code (including preview samples) builds dates with `toISOString()` and parses them for display; server read models can hand `Date` values to the Zod response schemas. The Orval config pins the React Query major version; keep it in step if React Query is upgraded.
