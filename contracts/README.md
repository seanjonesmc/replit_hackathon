# Smart contracts (reserved)

Solidity sources belong in `src/`, tests in `test/`, and testnet deployment scripts
in `scripts/`. Eventual Hardhat configuration belongs here at `hardhat.config.ts`.

No toolchain, dependencies, contract code, deployment, or wallet setup is included.
Phase 3 introduces the agreed toolchain (Hardhat 3 with its ethers toolbox); see
[docs/stack-decisions.md](../docs/stack-decisions.md) for it, the secret names, and
the on-chain rules.
Use Monad testnet only when implementation is authorized. Never commit private
keys, local environment files, compiled artifacts, cache, or deployment outputs.
