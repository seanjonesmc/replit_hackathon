---
name: Brand-values scan covers tests and contracts
description: The pnpm test brand scan flags BRAND demo/bank names anywhere in source, including contract and lib tests.
---
The brand-values test scans `artifacts`, `lib`, `scripts`, `contracts` and more — test files included. Any BRAND value (app name, demo names, bank names like the demo bank, fonts, hex colors) written literally fails `pnpm test`, even inside a Hardhat test.

**Why:** a contract test hardcoded the demo bank name and broke `pnpm test` on main; contract tests run under `contracts:test`, so the author never saw it.

**How to apply:** in tests that need placeholder names, use neutral values (e.g. "Example Bank") or read them from BRAND. Run `pnpm test` after touching contract tests, not just `contracts:test`.
