---
name: Sign-in decisions
description: Why the API sign-in deviates from the standard Replit Auth template, and how auth tests avoid the database.
---
Sign-in is web-only: the standard template's mobile token-exchange and mobile-logout routes were deliberately left out of the API and the OpenAPI spec.

**Why:** There is no mobile app and only the presenter signs in (stack decision); unused login endpoints are extra attack surface.

**How to apply:** Only add the mobile routes back if an Expo artifact is introduced.

Auth tests stub the session store (`vi.mock` of the server's auth lib) instead of writing rows to Postgres.

**Why:** The project rule is that database tests must use an explicit test database, and none exists; the dev database must not collect test rows.

**How to apply:** Same pattern for later route tests that need a signed-in user; prove real Postgres behaviour with a browser run (the tester can set login claims) and clean up its rows afterwards.
