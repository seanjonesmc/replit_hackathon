# Decisions

The decision engine: when the dependent swipes the simulated card, the API
decides APPROVED, REJECTED or PENDING with hard rules first, stores the
result and, for approvals, moves the money in the bucket. Import from
`./index.ts` only.

- `rules.ts`: `evaluateRules`, one pure, ordered function over pre-loaded
  inputs. The first matching rule decides. Each step is commented in the code.
- `swipes.ts`: `processSwipe` loads every input in one pass, times the
  decision, runs the AI guard slot (step 10), then stores the authorization
  and moves the money in one locked transaction (available → held → spent).
- `outcome.ts`: pure helpers around the rules: the AI guard's answer as a
  decision, and the re-check against the locked card and bucket at store time.
- `clock.ts`: swipe timestamps and time windows on the family's clock.
- `chain-handoff.ts`: the one place the on-chain authorize/capture calls plug
  in (Phase 3). Never awaited by the request; does nothing yet.
- `cards.ts`, `merchants.ts`, `authorizations.ts`: the card and its freeze
  switch (database only), the seeded merchants, the activity feed and approvals.
- `seed.ts`: merchants, the family policy, the dependent's card and a short
  purchase history, each added only when missing.

Guarantees:
- A hard rule always wins. The AI guard (`../ai`) only sees swipes no hard rule
  decided, and can only approve or send to a parent.
- The category table picks the bucket. The AI guard's bucket is used only for
  a category the table doesn't map, and its approval must still fit that
  bucket's per-purchase limit and approval thresholds.
- Storing a swipe locks the card, then the bucket, and re-checks both: a card
  frozen while the AI guard was deciding rejects the swipe, and two quick
  swipes can't overspend a bucket. Rejected and pending swipes move no money.
- Parent approve/decline, granting temporary passes and auto-retry are Phase 6;
  the engine already honours an unused, unexpired pass.
