---
name: Database-backed tests
description: How DB tests get their own Postgres database here, and the non-obvious constraints behind that setup.
---
DB-backed API tests run in their own Vitest project against `<dev db>_test`, created and dropped through the server's `postgres` maintenance database (the dev role has CREATEDB there).

**Why:** The dev database must never collect test rows, and services like `processSwipe` use the module-level `db`, so the test URL has to be in `DATABASE_URL` before `@workspace/db` loads; project-level `env` does that without changing production signatures.

**How to apply:** New DB tests go in that project's folder and start from `resetTestDatabase()`. Project `env` is not visible in globalSetup's `process.env` (that's still the dev URL); read the test URL from `project.config.env`.

The project runs its files one at a time because they share one database; reset + reseed costs about 0.4s per test and the schema push about 3s per run.

**Why:** Parallel files would see each other's rows (the seed test counts rows; the swipe tests expect exact balances).

Prove a money-safety test catches something by mutating the guard (drop the bucket re-check, the row locks, the pass claim) and watching it fail; watch operator precedence when mutating with `false &&`.
