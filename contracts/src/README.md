# Solidity sources

Testnet contracts compiled by Hardhat 3. `MockUSD.sol` is the simulated dollar
token (tUSD, 2 decimals) minted by the operator and the contracts it authorizes;
wallets cannot be made minters. `FamilyCardNetwork.sol` is the operator-only
simulated bank, card issuer and network for one family; it holds all tUSD and
keeps internal ledgers: the simulated bank, the pot's buckets with each funder's
contributions, and the simulated card stack (cards, blocked categories,
merchants, authorizations with on-chain hard checks, capture, parent
resolution and temporary passes).
