# Blockchain

The API's Monad testnet connection. `index.ts` builds one shared chain client
(`@workspace/chain`, ethers v6) from Secrets; contract sources live in root
`contracts/`. Testnet only (chain 10143); there is no mainnet support.

- `isChainConfigured()` — false until `DEPLOYER_PRIVATE_KEY`, `MOCKUSD_ADDRESS`
  and `NETWORK_ADDRESS` are set and valid. `MONAD_RPC_URL` defaults to
  `https://testnet-rpc.monad.xyz`, `MONAD_EXPLORER_URL` to
  `https://testnet.monadvision.com`, and `MONAD_CHAIN_ID`, if set, must be 10143.
  Importing this module never connects or throws.
- `getChainClient()` — the single operator client. Writes go out one at a time
  from its queue; each returns the transaction hash and explorer link at once,
  and a `confirmation` with the block, created IDs and decoded events (shaped
  for the `chain_events` table). Throws `ChainNotConfiguredError` without Secrets.
- `checkChainReady()` — for startup once the chain is wired in: resolves only
  when the RPC reports chain 10143 and both contracts are deployed.

Problems are reported by Secret name; the key and URLs are never echoed. Routes,
startup wiring and storing events belong to the backend services that call this.
