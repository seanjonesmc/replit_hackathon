import {
  DEFAULT_EXPLORER_URL,
  DEFAULT_RPC_URL,
  MONAD_TESTNET_CHAIN_ID,
  type ChainClientOptions,
} from "@workspace/chain";
import { Wallet, isAddress } from "ethers";

/** The Secrets the chain connection reads (see docs/stack-decisions.md). */
export const CHAIN_ENV_NAMES = [
  "MONAD_RPC_URL",
  "MONAD_CHAIN_ID",
  "DEPLOYER_PRIVATE_KEY",
  "MOCKUSD_ADDRESS",
  "NETWORK_ADDRESS",
  "MONAD_EXPLORER_URL",
] as const;

export type ChainEnv = Partial<Record<(typeof CHAIN_ENV_NAMES)[number], string>>;

export type ChainSetup =
  | { configured: true; options: ChainClientOptions }
  | { configured: false; problems: string[] };

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

function isPrivateKey(value: string): boolean {
  try {
    new Wallet(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads the chain Secrets. Problems are reported by name only; values (the
 * key, or an RPC URL that may embed an API key) never appear in messages.
 * Only Monad testnet is accepted: MONAD_CHAIN_ID may be unset or 10143.
 */
export function readChainSetup(env: ChainEnv): ChainSetup {
  const read = (name: (typeof CHAIN_ENV_NAMES)[number]) =>
    env[name]?.trim() || undefined;
  const problems: string[] = [];

  const rpcUrl = read("MONAD_RPC_URL") ?? DEFAULT_RPC_URL;
  if (!isHttpUrl(rpcUrl)) problems.push("MONAD_RPC_URL is not an http(s) URL.");

  const explorerUrl = read("MONAD_EXPLORER_URL") ?? DEFAULT_EXPLORER_URL;
  if (!isHttpUrl(explorerUrl)) {
    problems.push("MONAD_EXPLORER_URL is not an http(s) URL.");
  }

  const chainId = read("MONAD_CHAIN_ID");
  if (chainId !== undefined && chainId !== String(MONAD_TESTNET_CHAIN_ID)) {
    problems.push(
      `MONAD_CHAIN_ID must be ${MONAD_TESTNET_CHAIN_ID} (Monad testnet); no other chain is supported.`,
    );
  }

  const rawKey = read("DEPLOYER_PRIVATE_KEY");
  const operatorPrivateKey =
    rawKey && !rawKey.startsWith("0x") ? `0x${rawKey}` : rawKey;
  if (!operatorPrivateKey) {
    problems.push("DEPLOYER_PRIVATE_KEY is not set.");
  } else if (!isPrivateKey(operatorPrivateKey)) {
    problems.push("DEPLOYER_PRIVATE_KEY is not a valid private key.");
  }

  const mockUsdAddress = read("MOCKUSD_ADDRESS");
  const networkAddress = read("NETWORK_ADDRESS");
  for (const [name, address] of [
    ["MOCKUSD_ADDRESS", mockUsdAddress],
    ["NETWORK_ADDRESS", networkAddress],
  ] as const) {
    if (!address) problems.push(`${name} is not set.`);
    else if (!isAddress(address)) problems.push(`${name} is not a valid address.`);
  }

  if (problems.length > 0 || !operatorPrivateKey || !mockUsdAddress || !networkAddress) {
    return { configured: false, problems };
  }
  return {
    configured: true,
    options: {
      rpc: rpcUrl,
      operatorPrivateKey,
      mockUsdAddress,
      networkAddress,
      explorerUrl,
      expectedChainId: MONAD_TESTNET_CHAIN_ID,
    },
  };
}
