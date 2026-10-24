---
name: Demo reset design
description: Why the demo reset re-seeds the whole family and what that requires of new tables, seeds and chain code.
---
The demo reset deletes the one demo family and re-seeds it in one transaction, instead of cleaning up table by table. Nothing on chain is undone (user-agreed scope); explorer links from earlier runs just stop showing. The local receipt log is kept on purpose as the record of those transactions.

**Why:** one cascading delete picks up every row a run creates, including rows in tables added later. The chain side doesn't depend on Postgres ids, so new ids are safe.

**How to apply:**
- New family-scoped tables must cascade from the family, or a reset leaves their rows behind.
- Every Postgres id changes on a reset. Chain code must never need a stored on-chain id for a seeded row. Look it up by stable keys instead (for example, the card by holder and last four).
- Seeds must give the same on-screen numbers every time: no random values and nothing dated "today". The seed history must never contain the script's live steps.
- Who may reset follows the same presenter-mode rule as answering a purchase. Never trust a parent id sent by the client on its own.
