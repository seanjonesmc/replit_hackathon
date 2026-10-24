# Testnet scripts

- `export-abis.ts` — writes the compiled ABIs into `lib/chain/src/abis/`.
- `deploy-and-seed.ts` — deploys MockUSD and FamilyCardNetwork, seeds the demo
  family through the shared chain client (`@workspace/chain`), reads it all back
  and prints the addresses, bucket and card IDs, gas used and explorer links.
- `demo-family.ts` — the seed itself (plan, deploy, seed, read-back), shared by
  the deploy script and `test/DemoFamilySeed.ts`.

## Deploy and seed

```sh
pnpm run contracts:deploy:dry-run   # in-process Hardhat network, no secrets
pnpm run contracts:deploy           # Monad testnet only
```

The live run reads `DEPLOYER_PRIVATE_KEY` (a wallet funded with testnet MON from
https://faucet.monad.xyz) and optionally `MONAD_RPC_URL` and `MONAD_EXPLORER_URL`.
It refuses any `--network` but `monadTestnet`, stops unless the RPC reports chain
10143, and rehearses the whole seed in-process first so it can stop before
sending anything when the wallet can't cover the gas (with 50% headroom). Each run
deploys fresh contracts; afterwards set the printed `MOCKUSD_ADDRESS`,
`NETWORK_ADDRESS`, `MONAD_CHAIN_ID` and `MONAD_EXPLORER_URL` as development
environment variables. Production gets its own deployment and operator wallet.

The full run uses about 6.6M gas on Monad (about 6% more than the in-process
rehearsal), roughly 0.7 MON at 102 gwei.

Verify the source on Sourcify (the current development deployment is an exact
match at `https://sourcify.dev/server/repo-ui/10143/<address>`) with:

```sh
cd contracts
pnpm exec hardhat verify sourcify --network monadTestnet "$MOCKUSD_ADDRESS"
pnpm exec hardhat verify sourcify --network monadTestnet "$NETWORK_ADDRESS" "$MOCKUSD_ADDRESS"
```

The seed:

- Names, bank names and the card's last four come from `BRAND.demo`; amounts
  match the API's Postgres seed. Member and merchant IDs, the merchant catalog
  and blocked categories come from `@workspace/chain` (`DEMO_MEMBER_KEYS`,
  `DEMO_MERCHANTS`, `DEMO_BLOCKED_CATEGORIES`), so the backend derives the same
  IDs.
- Bank accounts get a fixed last four derived from the member's key. The API's
  Postgres seed generates its own, so the two may differ; only the display uses it.
- The card expires four years after the deploy month.
- It creates no authorizations, so the swipe flow starts clean.

Read signing credentials from environment secrets; do not store keys or
generated deployment records here.
