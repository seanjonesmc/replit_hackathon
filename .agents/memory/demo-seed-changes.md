---
name: Changing the demo seed
description: What else must change when demo-family seed values change, and which spec oddities the user chose to keep.
---
The app's Postgres seed and the on-chain deploy seed must carry the same bucket values. Change both together, along with their tests.

**Why:** the contract re-checks per-purchase limits and approval thresholds itself. If the two seeds differ, the chain overrides the engine with "Enforced on-chain" reasons.

**How to apply:** after any bucket, limit or funding change, update both seeds and run `pnpm test` plus `contracts:test`. The deploy-seed test also counts seed steps and checks bank balances.

Seed changes don't reach existing data. The family is created only when none exists, and the live testnet contract keeps whatever it was deployed with.

**Why:** seeding is idempotent by design, and redeploying costs testnet gas.

**How to apply:**
- **Dev database:** if it holds only seed rows, deleting the family cascades to every family-scoped table (merchants stay). Restarting the API then re-seeds it.
- **Live contract:** update it with owner transactions or a fresh deploy.

The user deliberately kept Food's spec values: the $60 per-purchase limit stays below the $75 approval threshold (decided 2026-10-24).

**Why:** the user picked "keep as written" over raising the limit or swapping the two values.

**How to apply:** don't "fix" Food's limits unless the user asks. The agreed preset results are in docs/plans/demo-preset-swipes.md.
