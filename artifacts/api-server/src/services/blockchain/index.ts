/**
 * The API's Monad testnet connection, built from Secrets. Importing this
 * module never connects or throws: without the chain Secrets the chain is
 * simply "not configured". Routes and services import from here.
 */
import {
  createChainClient,
  DEFAULT_EXPLORER_URL,
  explorerTxUrl,
  type ChainClient,
  type ChainReadiness,
} from "@workspace/chain";
import { readChainSetup, type ChainEnv, type ChainSetup } from "./config";

export { ChainBucketNotFoundError, findChainBucketId } from "./buckets";
export { CHAIN_ENV_NAMES, readChainSetup, type ChainEnv, type ChainSetup } from "./config";

export class ChainNotConfiguredError extends Error {
  constructor(readonly problems: string[]) {
    super(`Monad testnet is not configured. ${problems.join(" ")}`);
    this.name = "ChainNotConfiguredError";
  }
}

export interface BlockchainService {
  readonly setup: ChainSetup;
  isConfigured(): boolean;
  /** The one shared client. Throws ChainNotConfiguredError without Secrets. */
  getClient(): ChainClient;
  /**
   * For startup: resolves once the RPC is on chain 10143 and both contracts
   * are deployed; rejects otherwise (ChainNotConfiguredError,
   * ChainIdMismatchError, or a missing-contract error).
   */
  checkReady(): Promise<ChainReadiness>;
}

export function createBlockchainService(env: ChainEnv): BlockchainService {
  const setup = readChainSetup(env);
  let client: ChainClient | null = null;
  const getClient = (): ChainClient => {
    if (!setup.configured) throw new ChainNotConfiguredError(setup.problems);
    return (client ??= createChainClient(setup.options));
  };
  return {
    setup,
    isConfigured: () => setup.configured,
    getClient,
    checkReady: async () => getClient().assertReady(),
  };
}

let processService: BlockchainService | null = null;

/** The process-wide service, read from process.env on first use. */
function service(): BlockchainService {
  return (processService ??= createBlockchainService(process.env));
}

/**
 * The block explorer's page for a transaction, from MONAD_EXPLORER_URL (or
 * the default explorer). Works whether or not the chain is configured.
 */
export function chainTxUrl(txHash: string): string {
  const { setup } = service();
  const base = setup.configured
    ? setup.options.explorerUrl
    : process.env["MONAD_EXPLORER_URL"]?.trim() || DEFAULT_EXPLORER_URL;
  return explorerTxUrl(base, txHash);
}

export const isChainConfigured = (): boolean => service().isConfigured();
export const getChainClient = (): ChainClient => service().getClient();
export const checkChainReady = (): Promise<ChainReadiness> => service().checkReady();
