# Solidity sources

Testnet contracts compiled by Hardhat 3. `MockUSD.sol` is the simulated dollar
token (tUSD, 2 decimals) minted by the operator and the contracts it authorizes;
wallets cannot be made minters. `FamilyCardNetwork.sol` is the operator-only
simulated bank, card issuer and network for one family; it holds all tUSD and
keeps internal ledgers (so far the simulated bank, and the pot's buckets with
each funder's contributions).
