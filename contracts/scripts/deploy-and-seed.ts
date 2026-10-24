/**
 * Deploys MockUSD and FamilyCardNetwork, seeds the demo family through the
 * shared chain client (lib/chain), then reads everything back.
 *
 *   pnpm run contracts:deploy:dry-run   Hardhat's in-process network, no secrets
 *   pnpm run contracts:deploy           Monad testnet (chain 10143) only
 *
 * The live run needs DEPLOYER_PRIVATE_KEY for a wallet funded with testnet
 * MON; MONAD_RPC_URL and MONAD_EXPLORER_URL are optional. It refuses any other
 * --network, stops unless the RPC reports chain 10143, and first rehearses the
 * whole seed in-process to check the wallet can pay for it. Nothing is
 * written to disk: the printed addresses are set as development environment
 * variables by hand.
 */
import type { HardhatEthers } from "@nomicfoundation/hardhat-ethers/types";
import {
  DEFAULT_EXPLORER_URL,
  DEFAULT_RPC_URL,
  MONAD_TESTNET_CHAIN_ID,
  createChainClient,
  type ChainClientOptions,
} from "@workspace/chain";
import { Wallet, formatEther, formatUnits, type Signer } from "ethers";
import hre from "hardhat";
import {
  demoFamilyPlan,
  deployContracts,
  readBackDemoFamily,
  seedDemoFamily,
  type DemoFamilyPlan,
  type DeployedContract,
  type ReadBack,
  type SeedStep,
  type SeededFamily,
} from "./demo-family.js";

const MONAD_NETWORK = "monadTestnet";
const IN_PROCESS_NETWORK = "default";
const FAUCET_URL = "https://faucet.monad.xyz";
/** Headroom over the rehearsal's gas, since Monad prices some opcodes differently. */
const COST_MARGIN_PERCENT = 150n;

class StopError extends Error {}

interface Target {
  ethers: HardhatEthers;
  operator: Signer;
  operatorPrivateKey: string;
  client: Pick<ChainClientOptions, "rpc" | "expectedChainId" | "explorerUrl" | "receiptPollMs">;
  live: boolean;
}

interface Outcome {
  plan: DemoFamilyPlan;
  contracts: DeployedContract[];
  seeded: SeededFamily;
  readBack: ReadBack;
  totalGas: bigint;
}

const log = (line = "") => console.log(line);

function txRef(target: Pick<Target, "live">, explorerUrl: string, txHash: string): string {
  return target.live ? explorerUrl : txHash;
}

async function deployAndSeed(target: Target, quiet = false): Promise<Outcome> {
  const say = quiet ? () => undefined : log;
  const plan = demoFamilyPlan();
  const explorerUrl = target.client.explorerUrl;

  say("Deploying contracts…");
  const { mockUsd, network } = await deployContracts(target.ethers, target.operator);
  const client = createChainClient({
    ...target.client,
    operatorPrivateKey: target.operatorPrivateKey,
    mockUsdAddress: mockUsd.address,
    networkAddress: network.address,
  });
  try {
    for (const contract of [mockUsd, network]) {
      say(`  ${contract.name.padEnd(18)} ${contract.address}`);
      say(`  ${"".padEnd(18)} ${txRef(target, client.txUrl(contract.txHash), contract.txHash)}`);
    }

    say();
    say("Seeding the demo family…");
    const seeded = await seedDemoFamily(client, plan, (step: SeedStep) => {
      say(`  ${step.label}`);
      say(`    ${txRef(target, step.explorerUrl, step.txHash)}`);
    });

    const readBack = await readBackDemoFamily(client, plan, seeded);
    const totalGas =
      mockUsd.gasUsed + network.gasUsed + seeded.steps.reduce((sum, s) => sum + s.gasUsed, 0n);
    return { plan, contracts: [mockUsd, network], seeded, readBack, totalGas };
  } finally {
    client.close();
  }
}

/** Runs the whole deploy and seed on a fresh in-process network. */
async function runInProcess(quiet: boolean): Promise<Outcome> {
  const connection = await hre.network.create(IN_PROCESS_NETWORK);
  try {
    const { ethers, provider } = connection;
    const operator = ethers.Wallet.createRandom(ethers.provider);
    const [funder] = await ethers.getSigners();
    await (await funder!.sendTransaction({ to: operator.address, value: ethers.parseEther("100") })).wait();
    return await deployAndSeed(
      {
        ethers,
        operator,
        operatorPrivateKey: operator.privateKey,
        client: {
          rpc: provider,
          expectedChainId: Number(await provider.request({ method: "eth_chainId" })),
          explorerUrl: DEFAULT_EXPLORER_URL,
          receiptPollMs: 10,
        },
        live: false,
      },
      quiet,
    );
  } finally {
    await connection.close();
  }
}

function liveSettings(): { operatorPrivateKey: string; rpcUrl: string; explorerUrl: string } {
  const chainId = process.env.MONAD_CHAIN_ID?.trim();
  if (chainId && chainId !== String(MONAD_TESTNET_CHAIN_ID)) {
    throw new StopError(
      `MONAD_CHAIN_ID is ${chainId}, but only Monad testnet (${MONAD_TESTNET_CHAIN_ID}) is supported.`,
    );
  }
  const rawKey = process.env.DEPLOYER_PRIVATE_KEY?.trim();
  if (!rawKey) {
    throw new StopError(
      `DEPLOYER_PRIVATE_KEY is not set. Add the deployer wallet's key in Secrets and fund it with testnet MON from ${FAUCET_URL}.`,
    );
  }
  const operatorPrivateKey = rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`;
  try {
    new Wallet(operatorPrivateKey);
  } catch {
    // Never echo the key.
    throw new StopError("DEPLOYER_PRIVATE_KEY is not a valid private key.");
  }
  return {
    operatorPrivateKey,
    rpcUrl: process.env.MONAD_RPC_URL?.trim() || DEFAULT_RPC_URL,
    explorerUrl: process.env.MONAD_EXPLORER_URL?.trim() || DEFAULT_EXPLORER_URL,
  };
}

async function runLive(): Promise<{ outcome: Outcome; operator: string; spent: bigint; explorerUrl: string }> {
  const settings = liveSettings();
  const connection = await hre.network.create(MONAD_NETWORK);
  try {
    const { ethers, provider } = connection;
    const chainId = Number(await provider.request({ method: "eth_chainId" }));
    if (chainId !== MONAD_TESTNET_CHAIN_ID) {
      throw new StopError(
        `The RPC reports chain ${chainId}, not Monad testnet (${MONAD_TESTNET_CHAIN_ID}). Nothing was sent.`,
      );
    }

    const operator = new ethers.Wallet(settings.operatorPrivateKey, ethers.provider);
    const before = await ethers.provider.getBalance(operator.address);
    log(`Operator ${operator.address} holds ${formatEther(before)} MON.`);
    if (before === 0n) {
      throw new StopError(`The operator wallet has no MON. Fund it from ${FAUCET_URL}, then run again.`);
    }

    log("Rehearsing the deploy and seed on the in-process network…");
    const rehearsal = await runInProcess(true);
    if (rehearsal.readBack.problems.length > 0) {
      throw new StopError(`The rehearsal's read-back failed:\n  ${rehearsal.readBack.problems.join("\n  ")}`);
    }
    const gasPrice = BigInt(await provider.request({ method: "eth_gasPrice" }) as string);
    const needed = (rehearsal.totalGas * gasPrice * COST_MARGIN_PERCENT) / 100n;
    log(
      `It used ${rehearsal.totalGas} gas; at ${formatUnits(gasPrice, "gwei")} gwei that needs about ${formatEther(needed)} MON with headroom.`,
    );
    if (before < needed) {
      throw new StopError(
        `The operator wallet needs about ${formatEther(needed)} MON but holds ${formatEther(before)}. Fund it from ${FAUCET_URL}, then run again.`,
      );
    }
    log();

    const outcome = await deployAndSeed({
      ethers,
      operator,
      operatorPrivateKey: settings.operatorPrivateKey,
      client: { rpc: settings.rpcUrl, explorerUrl: settings.explorerUrl },
      live: true,
    });
    const after = await ethers.provider.getBalance(operator.address);
    return { outcome, operator: operator.address, spent: before - after, explorerUrl: settings.explorerUrl };
  } finally {
    await connection.close();
  }
}

function printSummary(
  outcome: Outcome,
  live: { operator: string; spent: bigint; explorerUrl: string } | null,
): void {
  const { contracts, seeded, readBack, totalGas } = outcome;
  const base = live?.explorerUrl.replace(/\/+$/, "");
  log();
  log(live ? `Summary — Monad testnet (chain ${MONAD_TESTNET_CHAIN_ID})` : "Summary — dry run on the in-process network (nothing was sent to Monad)");
  if (live) log(`  Operator           ${live.operator}`);
  for (const contract of contracts) {
    log(`  ${contract.name.padEnd(18)} ${contract.address}${base ? `  ${base}/address/${contract.address}` : ""}`);
  }
  log(`  Bucket IDs         ${Object.entries(seeded.bucketIds).map(([name, id]) => `${name} ${id}`).join(", ")}`);
  log(`  Card ID            ${seeded.cardId}`);
  log(`  Gas used           ${totalGas} (${contracts.length} deploys + ${seeded.steps.length} seed transactions)`);
  if (live) log(`  MON spent          ${formatEther(live.spent)}`);

  log();
  log("Read back from the chain:");
  for (const line of readBack.summary) log(`  ${line}`);
  if (readBack.problems.length > 0) {
    log();
    log(`Read-back FAILED (${readBack.problems.length} mismatches, ${readBack.passed} matched):`);
    for (const problem of readBack.problems) log(`  ${problem}`);
    return;
  }
  log(`  All ${readBack.passed} checks match the seed plan.`);

  if (live) {
    const [mockUsd, network] = contracts;
    log();
    log("Set these for development (non-secret environment variables):");
    log(`  MOCKUSD_ADDRESS=${mockUsd!.address}`);
    log(`  NETWORK_ADDRESS=${network!.address}`);
    log(`  MONAD_CHAIN_ID=${MONAD_TESTNET_CHAIN_ID}`);
    log(`  MONAD_EXPLORER_URL=${live.explorerUrl}`);
  }
}

async function main(): Promise<void> {
  const requested = hre.globalOptions.network;
  if (requested === MONAD_NETWORK) {
    const { outcome, ...live } = await runLive();
    printSummary(outcome, live);
    if (outcome.readBack.problems.length > 0) process.exitCode = 1;
    return;
  }
  if (requested !== undefined && requested !== IN_PROCESS_NETWORK) {
    throw new StopError(
      `Refusing to deploy to "${requested}". Use --network ${MONAD_NETWORK} (Monad testnet, chain ${MONAD_TESTNET_CHAIN_ID}), or no --network for a dry run.`,
    );
  }
  log("Dry run on Hardhat's in-process network (nothing is sent to Monad).");
  log();
  const outcome = await runInProcess(false);
  printSummary(outcome, null);
  if (outcome.readBack.problems.length > 0) process.exitCode = 1;
}

try {
  await main();
} catch (error) {
  if (!(error instanceof StopError)) throw error;
  console.error(`Stopped: ${error.message}`);
  process.exitCode = 1;
}
