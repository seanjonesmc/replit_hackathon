# Decisions

The decision engine: when the dependent swipes the simulated card, the API
decides APPROVED, REJECTED or PENDING with hard rules first, stores the
result and, for approvals, holds the money in the bucket until a settlement
run pays it out. Import from `./index.ts` only.

- `rules.ts`: `evaluateRules`, one pure, ordered function over pre-loaded
  inputs. The first matching rule decides. Each step is commented in the code.
- `swipes.ts`: `processSwipe` loads every input in one pass, times the
  decision, runs the AI guard slot (step 10), then stores the authorization
  and, for an approval, holds the money in one locked transaction
  (available → held). Nothing is paid at swipe time.
- `outcome.ts`: pure helpers around the rules: the AI guard's answer as a
  decision, and the re-check against the locked card and bucket at store time.
- `clock.ts`: swipe timestamps and time windows on the family's clock.
- `settlement.ts`: `runSettlement`, the presenter's "Run settlement" demo
  control: every held purchase goes held → spent in one locked transaction,
  with its settled and (simulated) issuer-redeemed times, then its capture is
  sent to the chain. The seed settles its history with `settleSeededPurchase`.
- `trace.ts`: plain-words copy for a swipe's step trace and the three
  settlement steps (network pays the merchant and the issuer redeems with
  the partner bank are simulated; the vault repaying the issuer is on chain).
- `chain-handoff.ts`: `authorize` after every stored swipe with a seeded
  merchant, and `capture` at settlement (it waits for an authorize still in
  flight). Capture pays the merchant's on-chain payout address, which the
  deploy seed sets to the card issuer's wallet. Both go through the
  background-submission helper: never awaited by a request, and a chain
  failure only marks the row's chain columns `failed`.
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
