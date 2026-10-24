---
name: Monad testnet deploy
description: Cost, verification and config facts for deploying/seeding the contracts on Monad testnet, and how to typecheck contracts scripts.
---

- A full deploy + demo seed costs about 6.6M gas on Monad, ~6% more than Hardhat's
  in-process rehearsal; at ~102 gwei (Oct 2026) that's ~0.67 MON. The script
  refuses to start below rehearsal × 1.5, so the wallet needs ~1 MON.
  **Why:** Monad reprices some opcodes; the rehearsal underestimates.
  **How to apply:** when asking someone to fund a deployer, ask for ~1 MON per run.
- `hardhat verify sourcify --network monadTestnet` gives an exact match on
  sourcify.dev for chain 10143 in seconds; no API key needed.
- Contract addresses, chain ID and explorer URL are per-environment variables
  (not Secrets); only the deployer key is a Secret. Development points at the
  dev deployment; production must get its own deployment and wallet.
- When a user says the wallet is funded but the script reads 0 MON, check the
  balance on two public RPCs and give them the explorer link for the exact
  address their key derives to; the faucet may have funded another account.
- contracts/tsconfig (nodenext) cannot resolve lib/chain's extensionless
  re-exports, and the root typecheck skips contracts/. Check contracts scripts with
  `tsc -p tsconfig.json --noEmit --module preserve --moduleResolution bundler`.
- A fresh task env may lack the contracts → @workspace/chain symlink; run
  `pnpm install --frozen-lockfile` if hardhat run reports ERR_MODULE_NOT_FOUND.
- Prefer a fresh deploy over patching the live contract when its state has
  drifted from the seed plan (e.g. a test contribution from another task):
  readBackDemoFamily compares exact balances and counts, so patching can't pass.
  A redeploy costs ~0.7 MON; afterwards set the dev address env vars and
  re-verify both contracts on Sourcify.
  **Why:** adding Transit (2026-10-24) found Food topped up by $50 on chain.
- The dev contracts were redeployed on 2026-10-24 so merchant payouts point at the card issuer. The one testnet swipe + settlement check afterwards left 1 authorization on chain and Food $18.40 lower than the seed plan, so readBackDemoFamily would no longer match that deployment exactly.
  **How to apply:** expect the live chain to drift from the seed after demo runs; redeploy (not patch) when an exact match is needed.
