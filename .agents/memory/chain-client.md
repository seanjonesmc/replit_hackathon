---
name: Chain client invariants
description: Non-obvious rules behind the shared Monad chain client and ID derivation; read before changing lib/chain or seeding.
---
- Chain IDs (members, merchants) are SHA-256 of a namespaced key, not keccak, because the backend already stored member `onchain_id` values that way. Never change the scheme or prefixes.
  **Why:** stored DB rows and the deploy seed must derive identical bytes32 IDs.
- Each write holds the operator queue until its receipt arrives (one tx in flight).
  **Why:** gas is estimated unpadded (Monad bills the gas limit), so the next estimate must see prior effects; a dependent write fired concurrently (e.g. capture after authorize) only works because of this.
- On Hardhat's EDR, re-sending an already-mined tx returns "Nonce too low", not "already known"; the client looks the tx up by hash before treating it as unsent.
  **How to apply:** keep that lookup if touching broadcast retries; tests with a forward-then-throw RPC proxy cover it.
- Monad rejects a send whose nonce another sender already holds with "An existing transaction had higher priority"; it counts as a nonce error (resync after a short wait).
  **Why:** parallel task environments (and dev/prod) share the one deployer key, so nonce collisions happen in practice; without the resync a live demo write was marked failed.
- Every post-commit chain write goes through the API's background-submit helper (row → submitted → confirmed only from a mined receipt, else failed). On-chain buckets are found by name, not by Postgres ID.
  **How to apply:** reuse it for authorize/capture rather than calling the client from routes; never mark a row confirmed any other way.
