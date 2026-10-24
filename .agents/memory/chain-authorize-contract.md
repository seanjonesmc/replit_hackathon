---
name: On-chain authorize vs the backend engine
description: Constraints the card network's authorize() places on whoever wires the backend decision engine to the chain.
---
The chain's `authorize` reverts (rather than declines) when an engine *approve* arrives without a bucket, or when the engine decision and reason code disagree (approve must carry `approved`; pending/reject must not).

**Why:** the task plan allowed bucket 0 only for pending/reject, and a mismatched decision/code would store nonsense permanently on-chain.

**How to apply:** the backend engine plan lets the AI guard approve an *ambiguous* swipe that mapped to no bucket. When wiring the engine to the chain, such approvals need a bucket chosen first (or must go pending); otherwise the on-chain call reverts.

Categories on-chain must be plain lowercase (uppercase ASCII reverts), so the backend must lowercase category names before `setBlockedCategory` / `registerMerchant`.

**Why:** "Bar" vs "bar" would otherwise silently bypass the on-chain block.

Capture pays the merchant's on-chain payout address, and the deploy seed registers every merchant with the card issuer's derived address as payout (decided 2026-10-24, contract code unchanged).

**Why:** the demo story is "the vault repays the card issuer at settlement; Visa pays the merchant in dollars". A merchant can't be re-registered, so changing payouts needed a fresh deploy rather than a contract change.

**How to apply:** new merchants on chain must also get the issuer address as payout. The app only captures when its row has an on-chain authorization id and the chain says `approved`; the chain's own hard checks can disagree with the engine (e.g. temporary passes aren't on chain), and then the capture is marked failed, never the decision.
