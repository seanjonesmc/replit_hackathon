---
name: Hold then settle
description: Money-movement invariant for swipes and settlement; read before touching swipe recording, balances, or demo reset.
---
An approved swipe only moves available → held. Money reaches spent only through a settlement run (the parent's "Run settlement" demo control) or the seed, which settles its history at each swipe's own time with no settlement run attached.

**Why:** the demo script shows a visible hold at swipe time and a separate settlement step where the vault repays the card issuer on chain (user's plan, 2026-10-24).

**How to apply:**
- "Spent this week" and "paid from" wording key off settled time, so held money never counts as spent.
- The "latest settlement" on the parent overview ignores seed history because seed rows have no settlement run.
- A demo reset must clear held amounts and settlement rows as well as authorizations.
- An APPROVED live check now leaves a held amount; reset the dev family afterwards (delete the family, restart the API).
