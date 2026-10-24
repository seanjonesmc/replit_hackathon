# Smart contracts

Solidity contracts built and tested with Hardhat 3 and its ethers toolbox (mocha +
ethers v6). Sources are in `src/`, tests in `test/`, testnet deployment scripts in
`scripts/`, and configuration in `hardhat.config.ts`.

- `pnpm run compile` / `pnpm run test` here, or `pnpm run contracts:compile` /
  `pnpm run contracts:test` from the root. Tests use the in-process network and
  need no secrets.
- `monadTestnet` (chain 10143) reads `MONAD_RPC_URL` (default
  `https://testnet-rpc.monad.xyz`) and `DEPLOYER_PRIVATE_KEY` from the environment,
  only when that network is used.
- `pnpm run export-abis` (root: `pnpm run contracts:export-abis`) compiles and
  writes the contract ABIs into `lib/chain/src/abis/`, which the API and the
  deploy scripts share. Run it after changing a contract; the `ChainAbis` test
  fails while the committed ABIs differ from the compiled ones.
- `pnpm run contracts:deploy:dry-run` / `pnpm run contracts:deploy` (root) deploy
  both contracts and seed the demo family, in-process or on Monad testnet. See
  [scripts/README.md](scripts/README.md).

See [docs/stack-decisions.md](../docs/stack-decisions.md) for secret names and the
on-chain rules. Monad testnet only. Never commit private keys, local environment
files, compiled artifacts, cache, generated types, or deployment outputs.
