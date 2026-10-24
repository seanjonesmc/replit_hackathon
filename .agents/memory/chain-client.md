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
