---
name: Sign-in decisions
description: Why the API sign-in deviates from the standard Replit Auth template, and how auth tests avoid the database.
---
Sign-in is web-only: the standard template's mobile token-exchange and mobile-logout routes were deliberately left out of the API and the OpenAPI spec.

**Why:** There is no mobile app and only the presenter signs in (stack decision); unused login endpoints are extra attack surface.

**How to apply:** Only add the mobile routes back if an Expo artifact is introduced.

Auth tests stub the session store (`vi.mock` of the server's auth lib) instead of writing rows to Postgres.

**Why:** Non-DB API tests must never touch Postgres; the dev database must not collect test rows.

**How to apply:** Same pattern for route tests that only need a signed-in user. Real Postgres behaviour belongs in the `api-server-db` test project (see db-tests.md), or a browser run whose rows are cleaned up afterwards.

Manual signed-in checks against the dev API (curl) work by inserting a temporary `users` + `sessions` row (session JSON needs `user` and a future `expires_at`) and sending `Cookie: sid=<id>`; delete both rows afterwards. The session `user` must carry every auth-user field (id, email, firstName, lastName, profileImageUrl — null where unknown), otherwise `/api/auth/user` fails its response validation with a 500 while the family routes still work. Browser test runs also leave real login rows in `users`/`sessions`; delete them afterwards.

**Why:** The browser login can't be scripted from the shell; this exercises the real guard against the dev Postgres.

**How to apply:** Leave the dev demo family as the seed made it; if a manual check changed family data, reset it so the API reseeds on restart.

Live swipe checks (curl or a browser tester) should only make swipes that end REJECTED (blocked category, or a frozen card) or PENDING: those write just an `authorizations` row, so deleting the new rows restores the demo exactly. An APPROVED swipe moves bucket money (held/spent) and needs a full demo reset. Snapshot row counts and bucket totals before, compare after.

**Why:** The demo family must stay as the seed made it. Since the Reset demo endpoint exists, an approved swipe can also be undone by resetting as the parent.

**How to apply:** Tell testers which merchant tiles they may tap; afterwards delete their authorizations, login users/sessions, unfreeze the card if needed, and restart the API to clear the OIDC override.

A task environment's dev database can lag the schema (e.g. a column added by a just-merged task is missing, so a live write 500s). Run `pnpm --filter db push` (what post-merge does) before live API checks.

**Why:** a live parent send failed with "column note does not exist" until the push ran (2026-10-24).
