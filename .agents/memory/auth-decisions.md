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

Manual signed-in checks against the dev API (curl) work by inserting a temporary `users` + `sessions` row (session JSON needs `user` and a future `expires_at`) and sending `Cookie: sid=<id>`; delete both rows afterwards. The session `user` must carry every auth-user field (id, email, firstName, lastName, profileImageUrl — null where unknown), otherwise `/api/auth/user` fails its response validation with a 500 while the family routes still work. Browser test runs also leave real login rows in `users`/`sessions`; delete them afterwards.

**Why:** No test database exists and the browser login can't be scripted from the shell; this exercises the real guard and Postgres.

**How to apply:** Leave the dev demo family as the seed made it; if a manual check changed family data, reset it so the API reseeds on restart.

Live swipe checks (curl or a browser tester) should only make swipes that end REJECTED (blocked category, or a frozen card) or PENDING: those write just an `authorizations` row, so deleting the new rows restores the demo exactly. An APPROVED swipe moves bucket money (held/spent) and needs a full demo reset. Snapshot row counts and bucket totals before, compare after.

**Why:** The demo family must stay as the seed made it, and there is no one-tap reset yet.

**How to apply:** Tell testers which merchant tiles they may tap; afterwards delete their authorizations, login users/sessions, unfreeze the card if needed, and restart the API to clear the OIDC override.
