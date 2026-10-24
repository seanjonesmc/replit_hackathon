# Demo preset swipes: settling the spec conflicts

## What & Why
The product spec's seed values contradict three of its preset swipes (see the
Out of scope section of [phase-1-signin-screens.md](phase-1-signin-screens.md)):

- Food's per-purchase limit ($60) is below its approval threshold ($75).
- There is no Transit bucket and no late-night window for the 2:10am Uber preset.
- Electronics (Apple Store, MCC 5732) is missing from the category-to-bucket map.

The decision engine made a temporary choice for each one when it was built. The
user confirmed or changed those choices on 2026-10-24. This plan records them
and the result each preset swipe must give, so the engine and the swipe
simulator can be checked against it. The spec text stays unchanged; these
decisions also appear in the differences table in
[../stack-decisions.md](../stack-decisions.md).

## Decisions
1. **Apple Store $129: keep Electronics paying from School.** $129 is under
   School's $150 per-purchase limit and over its $100 approval threshold, so the
   swipe goes Pending (`needs_approval`). When the parent approves, the retry is
   paid from School. School is the only seeded bucket where that works, and it
   is the approval step in the demo script.
2. **Uber at 2:10am $22: add a Transit bucket and keep the late-night window.**
   - The seeded policy keeps its 11pm–6am window, so the swipe goes Pending
     (`outside_hours`) before any AI call.
   - New fourth bucket: **Transit**, $50, up to $40 per purchase, approval over
     $30, funded by the parent. Purpose line "Rides and bus fare", transit icon.
   - Rideshare (and transit) already map to Transit in the category table. With
     the bucket in place, a parent-approved ride is paid from Transit instead of
     having nowhere to go.
3. **Food: keep the spec's values as written.** $60 per-purchase limit,
   approval over $75. A Food purchase over $60 is declined (`over_limit`) and
   never reaches the threshold. The policy card keeps listing both values as
   stored. The seeded history's $72 Trader Joe's decline stays as is.

## Expected results
These assume the seeded state after the purchase history:
- Food has $118.75 left, School $200, Social $25, Transit $50.
- The card is active.
- Times are on the family's clock (America/Los_Angeles).

The step numbers refer to `evaluateRules` in
`artifacts/api-server/src/services/decisions/rules.ts`.

| Preset swipe                                    | Category (MCC)       | Bucket  | Decision | Reason code        | Decided at                    | If the parent approves             |
| ----------------------------------------------- | -------------------- | ------- | -------- | ------------------ | ----------------------------- | ---------------------------------- |
| Trader Joe's $18.40                             | grocery (5411)       | Food    | APPROVED | `approved`         | step 11                       | n/a                                |
| Campus Bookstore $24.00                         | bookstore (5942)     | School  | APPROVED | `approved`         | step 11                       | n/a                                |
| The Tipsy Tavern $32.00                         | bar (5813)           | none    | REJECTED | `blocked_category` | step 2                        | n/a                                |
| Steam $14.99                                    | gaming (5816)        | none    | REJECTED | `blocked_category` | step 2                        | n/a                                |
| Uber $22.00 at 2:10am                           | rideshare (4121)     | Transit | PENDING  | `outside_hours`    | step 8 (no AI call)           | Retry APPROVED, paid from Transit  |
| Apple Store $129.00                             | electronics (5732)   | School  | PENDING  | `needs_approval`   | step 9                        | Retry APPROVED, paid from School   |

No preset swipe goes to the AI guard. The parent's approval grants a temporary
pass for that merchant and amount (10 minutes). The pass is checked before the
time window and the threshold, so the retry is approved even at 2:10am.

Other cases these decisions fix:

| Swipe                                  | Bucket  | Decision | Reason code     |
| -------------------------------------- | ------- | -------- | --------------- |
| Any swipe on a frozen card             | none    | REJECTED | `card_inactive` |
| Uber $22.00 in the daytime             | Transit | APPROVED | `approved`      |
| Trader Joe's $65.00 (between $60 and $75) | Food | REJECTED | `over_limit`    |

### Repeat swipes in one demo run
Balances carry over between swipes until the demo is reset:
- After an approved Apple Store purchase, School has $71 left. A second $129
  swipe is declined (`insufficient_funds`).
- Transit covers two approved $22 rides ($50 → $28 → $6). After that, the 2:10am
  Uber is declined (`insufficient_funds`), because the balance check comes
  before the time window.
- Food covers six $18.40 Trader Joe's swipes.

## Applied
- **App seed:** Transit is added to the demo family's buckets, after Food,
  School and Social. Food, School, Social and the policy are unchanged.
- **On-chain deploy seed:** Transit is added with the same values, so a new
  deploy matches the app seed. The parent's bank keeps $390 after funding.
- **Tests:**
  - The seed test checks Transit's limits and funding, the late-night window
    and four bucket cards.
  - The rules test checks every row in the tables above, including both
    parent-approved retries.
  - The deploy-seed test checks four buckets.

## Not done here
- **The contract already deployed on Monad testnet still has three buckets.**
  It needs Transit created and funded (two operator transactions), or a fresh
  deploy, before the engine's on-chain calls can pay a ride from Transit.
- **A database seeded before this change keeps three buckets.** The seed only
  creates the family when none exists, so the family must be re-seeded to get
  Transit.
- **The swipe simulator and the approval flow are not built here.** The
  simulator must send the Uber preset with a 2:10am timestamp on the family's
  clock.
