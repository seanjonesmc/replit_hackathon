---
name: On-chain authorize vs the backend engine
description: Constraints the card network's authorize() places on whoever wires the backend decision engine to the chain.
---
The chain's `authorize` reverts (rather than declines) when an engine *approve* arrives without a bucket, or when the engine decision and reason code disagree (approve must carry `approved`; pending/reject must not).

**Why:** the task plan allowed bucket 0 only for pending/reject, and a mismatched decision/code would store nonsense permanently on-chain.

**How to apply:** the backend engine plan lets the AI guard approve an *ambiguous* swipe that mapped to no bucket. When wiring the engine to the chain, such approvals need a bucket chosen first (or must go pending); otherwise the on-chain call reverts.

Categories on-chain must be plain lowercase (uppercase ASCII reverts), so the backend must lowercase category names before `setBlockedCategory` / `registerMerchant`.

**Why:** "Bar" vs "bar" would otherwise silently bypass the on-chain block.
