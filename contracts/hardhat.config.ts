import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  solidity: {
    version: "0.8.28",
    // Cancun opcodes run on Monad testnet; newer EVM targets are not needed.
    settings: {
      evmVersion: "cancun",
      optimizer: { enabled: true, runs: 200 },
    },
  },
  paths: {
    sources: "./src",
    tests: { mocha: "./test" },
  },
  typechain: {
    outDir: "typechain-types",
  },
  networks: {
    // In-process network used by `hardhat test`; needs no secrets.
    default: {
      type: "edr-simulated",
      chainType: "l1",
    },
    // The deployer key is resolved only when this network is actually used.
    monadTestnet: {
      type: "http",
      chainType: "l1",
      chainId: 10143,
      url: process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz",
      accounts: [configVariable("DEPLOYER_PRIVATE_KEY")],
    },
  },
});
