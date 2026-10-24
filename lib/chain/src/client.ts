import {
  BrowserProvider,
  Indexed,
  Interface,
  JsonRpcProvider,
  Network,
  Transaction,
  Wallet,
  getAddress,
  isError,
  type Eip1193Provider,
  type JsonRpcApiProvider,
  type Result,
} from "ethers";
import { familyCardNetworkAbi } from "./abis/FamilyCardNetwork";
import { mockUsdAbi } from "./abis/MockUSD";
import {
  authStatusName,
  cardStatusName,
  engineDecisionValue,
  reasonCodeName,
  reasonCodeValue,
  type AuthStatus,
  type CardStatus,
  type EngineDecision,
  type ReasonCode,
} from "./codes";
import {
  ChainBroadcastError,
  ChainCallRevertedError,
  ChainConfirmationTimeoutError,
  ChainIdMismatchError,
  ChainTxRevertedError,
} from "./errors";
import { explorerAddressUrl, explorerTxUrl } from "./explorer";
import { toJsonSafe, type JsonValue } from "./json";
import { SerialQueue } from "./queue";
import {
  isAlreadyKnownError,
  isNonceError,
  isTransientRpcError,
  sleep,
  withRetry,
  type RetryOptions,
} from "./retry";

/** Monad testnet, the only network the product runs on. */
export const MONAD_TESTNET_CHAIN_ID = 10143;
/** Monad's public testnet RPC endpoint. */
export const DEFAULT_RPC_URL = "https://testnet-rpc.monad.xyz";

/** An unsigned integer argument (amounts in cents, IDs, timestamps). */
export type Uint = bigint | number;
/** A 0x-prefixed 32-byte hex ID (see `chainId`). */
export type Bytes32 = string;

export interface ChainClientOptions {
  /** HTTP(S) JSON-RPC URL, or an in-process EIP-1193 provider (tests). */
  rpc: string | Eip1193Provider;
  /** The operator (deployer) wallet's key; it owns both contracts. */
  operatorPrivateKey: string;
  mockUsdAddress: string;
  networkAddress: string;
  explorerUrl: string;
  /** Nothing is read or sent unless the RPC reports this chain. Default 10143. */
  expectedChainId?: number;
  /** Retries for transient RPC failures. Default 4 attempts from 250ms. */
  retry?: Partial<RetryOptions>;
  /** Re-sign with a fresh nonce this many times after a nonce error. Default 2. */
  nonceResyncs?: number;
  /** How often to poll for a receipt. Default 200ms (Monad blocks ~400ms). */
  receiptPollMs?: number;
  /** Give up waiting for a receipt after this long. Default 60s. */
  confirmationTimeoutMs?: number;
}

/** One decoded event, shaped for the API's `chain_events` table. */
export interface ChainEventRecord {
  eventName: string;
  contractAddress: string;
  txHash: string;
  blockNumber: number;
  logIndex: number;
  /** Decoded arguments by name; big numbers are decimal strings. */
  args: Record<string, JsonValue>;
}

export type NoIds = Record<never, never>;

export interface WriteConfirmation<TIds extends object = NoIds> {
  method: string;
  txHash: string;
  explorerUrl: string;
  blockNumber: number;
  /** The block's timestamp. */
  confirmedAt: Date;
  /** From broadcast until the client saw the receipt. */
  confirmationMs: number;
  /** IDs the call created (authorization, bucket, card or contribution). */
  ids: TIds;
  events: ChainEventRecord[];
}

/** A broadcast write. `confirmation` settles once it is mined. */
export interface PendingWrite<TIds extends object = NoIds> {
  method: string;
  txHash: string;
  explorerUrl: string;
  nonce: number;
  /**
   * Rejects with ChainTxRevertedError or ChainConfirmationTimeoutError.
   * Ignoring it is safe: an unobserved rejection never crashes the process.
   */
  confirmation: Promise<WriteConfirmation<TIds>>;
}

export interface AuthorizeConfirmation
  extends WriteConfirmation<{ authorizationId: bigint }> {
  /** What the chain recorded; its hard checks can override the engine. */
  authorization: { status: AuthStatus; reasonCode: ReasonCode; reason: string };
}

export interface PendingAuthorize
  extends Omit<PendingWrite<{ authorizationId: bigint }>, "confirmation"> {
  confirmation: Promise<AuthorizeConfirmation>;
}

export interface Bucket {
  name: string;
  perTxLimit: bigint;
  approvalThreshold: bigint;
  available: bigint;
  held: bigint;
  spent: bigint;
}

export interface Card {
  dependentId: Bytes32;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  status: CardStatus;
}

export interface Authorization {
  cardId: bigint;
  merchantId: Bytes32;
  /** 0 means no bucket. */
  bucketId: bigint;
  amount: bigint;
  status: AuthStatus;
  reasonCode: ReasonCode;
  reason: string;
  /** Block timestamp in seconds. */
  timestamp: bigint;
}

export interface ChainReadiness {
  chainId: number;
  blockNumber: number;
  operatorAddress: string;
}

type ContractKey = "network" | "token";

interface ParsedEvent {
  name: string;
  address: string;
  args: Record<string, unknown>;
}

interface RawLog {
  address: string;
  topics: string[];
  data: string;
  logIndex: string;
}

interface RawReceipt {
  status: string;
  blockNumber: string;
  logs: RawLog[];
}

interface Mined {
  receipt: RawReceipt;
  confirmationMs: number;
}

/**
 * The single operator's connection to the FamilyCardNetwork and MockUSD
 * contracts. Writes run one at a time from an in-process queue with a locally
 * tracked nonce; each holds the queue until it is mined, so the next write's
 * gas estimate (used unpadded, since Monad charges the gas limit) already sees
 * its effects.
 */
export class ChainClient {
  readonly expectedChainId: number;
  readonly operatorAddress: string;
  readonly networkAddress: string;
  readonly mockUsdAddress: string;
  readonly explorerUrl: string;

  readonly #provider: JsonRpcApiProvider;
  readonly #wallet: Wallet;
  readonly #interfaces: Record<ContractKey, Interface> = {
    network: new Interface(familyCardNetworkAbi),
    token: new Interface(mockUsdAbi),
  };
  readonly #queue = new SerialQueue();
  readonly #retry: RetryOptions;
  readonly #nonceResyncs: number;
  readonly #receiptPollMs: number;
  readonly #confirmationTimeoutMs: number;
  #nonce: number | null = null;
  #chainCheck: Promise<void> | null = null;

  constructor(options: ChainClientOptions) {
    this.expectedChainId = options.expectedChainId ?? MONAD_TESTNET_CHAIN_ID;
    if (!Number.isSafeInteger(this.expectedChainId) || this.expectedChainId <= 0) {
      throw new Error(`Invalid expected chain ID: ${this.expectedChainId}`);
    }
    try {
      this.#wallet = new Wallet(options.operatorPrivateKey);
    } catch {
      // Never echo the key, even partially.
      throw new Error("The operator private key is not a valid 32-byte hex key.");
    }
    this.operatorAddress = this.#wallet.address;
    this.networkAddress = getAddress(options.networkAddress);
    this.mockUsdAddress = getAddress(options.mockUsdAddress);
    this.explorerUrl = options.explorerUrl;
    this.#retry = {
      attempts: options.retry?.attempts ?? 4,
      baseDelayMs: options.retry?.baseDelayMs ?? 250,
    };
    this.#nonceResyncs = options.nonceResyncs ?? 2;
    this.#receiptPollMs = options.receiptPollMs ?? 200;
    this.#confirmationTimeoutMs = options.confirmationTimeoutMs ?? 60_000;

    if (typeof options.rpc === "string") {
      // A static network skips ethers' own detection (and its endless
      // reconnect logging); the chain ID is checked explicitly instead.
      const network = Network.from(this.expectedChainId);
      this.#provider = new JsonRpcProvider(options.rpc, network, {
        staticNetwork: network,
        batchMaxCount: 1,
      });
    } else {
      this.#provider = new BrowserProvider(options.rpc);
    }
  }

  txUrl(txHash: string): string {
    return explorerTxUrl(this.explorerUrl, txHash);
  }

  addressUrl(address: string): string {
    return explorerAddressUrl(this.explorerUrl, address);
  }

  /** Throws ChainIdMismatchError unless the RPC reports the expected chain. */
  assertChain(): Promise<void> {
    this.#chainCheck ??= this.#checkChain().catch((error: unknown) => {
      this.#chainCheck = null;
      throw error;
    });
    return this.#chainCheck;
  }

  /**
   * Confirms the expected chain and that both contracts are deployed at the
   * configured addresses.
   */
  async assertReady(): Promise<ChainReadiness> {
    await this.assertChain();
    for (const [name, address] of [
      ["FamilyCardNetwork", this.networkAddress],
      ["MockUSD", this.mockUsdAddress],
    ] as const) {
      const code = await this.#rpc<string>("eth_getCode", [address, "latest"]);
      if (code === "0x") {
        throw new Error(`No ${name} contract is deployed at ${address}.`);
      }
    }
    const blockNumber = Number(await this.#rpc<string>("eth_blockNumber", []));
    return {
      chainId: this.expectedChainId,
      blockNumber,
      operatorAddress: this.operatorAddress,
    };
  }

  /** Stops the underlying provider. */
  close(): void {
    this.#provider.destroy();
  }

  // --- Writes: simulated bank ---

  linkBankAccount(p: { userId: Bytes32; bankName: string; last4: string }): Promise<PendingWrite> {
    return this.#write("network", "linkBankAccount", [p.userId, p.bankName, p.last4], noIds);
  }

  bankDeposit(p: { userId: Bytes32; amount: Uint }): Promise<PendingWrite> {
    return this.#write("network", "bankDeposit", [p.userId, p.amount], noIds);
  }

  // --- Writes: pot and buckets ---

  createBucket(p: {
    name: string;
    perTxLimit: Uint;
    approvalThreshold: Uint;
  }): Promise<PendingWrite<{ bucketId: bigint }>> {
    return this.#write(
      "network",
      "createBucket",
      [p.name, p.perTxLimit, p.approvalThreshold],
      (events) => ({ ids: { bucketId: this.#created(events, "BucketCreated", "bucketId") } }),
    );
  }

  setBucketLimits(p: {
    bucketId: Uint;
    perTxLimit: Uint;
    approvalThreshold: Uint;
  }): Promise<PendingWrite> {
    return this.#write(
      "network",
      "setBucketLimits",
      [p.bucketId, p.perTxLimit, p.approvalThreshold],
      noIds,
    );
  }

  fundBucket(p: {
    funderId: Bytes32;
    bucketId: Uint;
    amount: Uint;
  }): Promise<PendingWrite<{ contributionId: bigint }>> {
    return this.#write(
      "network",
      "fundBucket",
      [p.funderId, p.bucketId, p.amount],
      (events) => ({
        ids: { contributionId: this.#created(events, "BucketFunded", "contributionId") },
      }),
    );
  }

  // --- Writes: cards and categories ---

  issueCard(p: {
    dependentId: Bytes32;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  }): Promise<PendingWrite<{ cardId: bigint }>> {
    return this.#write(
      "network",
      "issueCard",
      [p.dependentId, p.last4, p.expiryMonth, p.expiryYear],
      (events) => ({ ids: { cardId: this.#created(events, "CardIssued", "cardId") } }),
    );
  }

  activateCard(p: { cardId: Uint }): Promise<PendingWrite> {
    return this.#write("network", "activateCard", [p.cardId], noIds);
  }

  freezeCard(p: { cardId: Uint }): Promise<PendingWrite> {
    return this.#write("network", "freezeCard", [p.cardId], noIds);
  }

  unfreezeCard(p: { cardId: Uint }): Promise<PendingWrite> {
    return this.#write("network", "unfreezeCard", [p.cardId], noIds);
  }

  /** `category` must be a plain lowercase name, e.g. "bar". */
  setBlockedCategory(p: { category: string; blocked: boolean }): Promise<PendingWrite> {
    return this.#write("network", "setBlockedCategory", [p.category, p.blocked], noIds);
  }

  // --- Writes: merchants ---

  /** `category` must be a plain lowercase name, e.g. "grocery". */
  registerMerchant(p: {
    merchantId: Bytes32;
    name: string;
    mcc: number;
    category: string;
    payoutAddress: string;
  }): Promise<PendingWrite> {
    return this.#write(
      "network",
      "registerMerchant",
      [p.merchantId, p.name, p.mcc, p.category, p.payoutAddress],
      noIds,
    );
  }

  // --- Writes: authorizations ---

  /**
   * Records an authorization. An `approve` needs a bucket and the `approved`
   * code; `pending`/`reject` need another code (bucket 0 allowed), or the
   * call reverts.
   */
  authorize(p: {
    cardId: Uint;
    merchantId: Bytes32;
    bucketId: Uint;
    amount: Uint;
    engineDecision: EngineDecision;
    reasonCode: ReasonCode;
    reason: string;
  }): Promise<PendingAuthorize> {
    return this.#write(
      "network",
      "authorize",
      [
        p.cardId,
        p.merchantId,
        p.bucketId,
        p.amount,
        engineDecisionValue(p.engineDecision),
        reasonCodeValue(p.reasonCode),
        p.reason,
      ],
      (events) => {
        const created = this.#event(events, "AuthorizationCreated");
        return {
          ids: { authorizationId: created.args.authId as bigint },
          authorization: {
            status: authStatusName(created.args.status as bigint),
            reasonCode: reasonCodeName(created.args.reasonCode as bigint),
            reason: created.args.reason as string,
          },
        };
      },
    );
  }

  capture(p: { authorizationId: Uint }): Promise<PendingWrite> {
    return this.#write("network", "capture", [p.authorizationId], noIds);
  }

  resolvePending(p: {
    authorizationId: Uint;
    approved: boolean;
    parentId: Bytes32;
  }): Promise<PendingWrite> {
    return this.#write(
      "network",
      "resolvePending",
      [p.authorizationId, p.approved, p.parentId],
      noIds,
    );
  }

  /** `expiresAt` is a unix timestamp in seconds. */
  grantTemporaryPass(p: {
    cardId: Uint;
    merchantId: Bytes32;
    maxAmount: Uint;
    expiresAt: Uint;
  }): Promise<PendingWrite> {
    return this.#write(
      "network",
      "grantTemporaryPass",
      [p.cardId, p.merchantId, p.maxAmount, p.expiresAt],
      noIds,
    );
  }

  // --- Writes: MockUSD ---

  /** Lets a contract (the card network) mint tUSD. Used when deploying. */
  setMinter(p: { account: string; allowed: boolean }): Promise<PendingWrite> {
    return this.#write("token", "setMinter", [p.account, p.allowed], noIds);
  }

  // --- Reads ---

  async getBankBalance(userId: Bytes32): Promise<bigint> {
    const [balance] = await this.#read("network", "bankBalanceOf", [userId]);
    return balance as bigint;
  }

  async getBucket(bucketId: Uint): Promise<Bucket> {
    const [bucket] = await this.#read("network", "getBucket", [bucketId]);
    return {
      name: bucket.name,
      perTxLimit: bucket.perTxLimit,
      approvalThreshold: bucket.approvalThreshold,
      available: bucket.available,
      held: bucket.held,
      spent: bucket.spent,
    };
  }

  async getCard(cardId: Uint): Promise<Card> {
    const [card] = await this.#read("network", "getCard", [cardId]);
    return {
      dependentId: card.dependentId,
      last4: card.last4,
      expiryMonth: Number(card.expiryMonth),
      expiryYear: Number(card.expiryYear),
      status: cardStatusName(card.status),
    };
  }

  async getAuthorization(authorizationId: Uint): Promise<Authorization> {
    const [auth] = await this.#read("network", "getAuthorization", [authorizationId]);
    return {
      cardId: auth.cardId,
      merchantId: auth.merchantId,
      bucketId: auth.bucketId,
      amount: auth.amount,
      status: authStatusName(auth.status),
      reasonCode: reasonCodeName(auth.reasonCode),
      reason: auth.reason,
      timestamp: auth.timestamp,
    };
  }

  /** tUSD balance (cents) of any address, e.g. a merchant payout wallet. */
  async getTusdBalance(address: string): Promise<bigint> {
    const [balance] = await this.#read("token", "balanceOf", [address]);
    return balance as bigint;
  }

  // --- Internals ---

  /**
   * Raw JSON-RPC with transient retries. Raw calls bypass ethers' short-lived
   * response cache, which would hide a receipt or state change for ~250ms.
   */
  #rpc<T>(method: string, params: unknown[]): Promise<T> {
    return withRetry(() => this.#provider.send(method, params) as Promise<T>, this.#retry);
  }

  async #checkChain(): Promise<void> {
    const actual = BigInt(await this.#rpc<string>("eth_chainId", []));
    if (actual !== BigInt(this.expectedChainId)) {
      throw new ChainIdMismatchError(this.expectedChainId, actual);
    }
  }

  #target(contract: ContractKey): string {
    return contract === "network" ? this.networkAddress : this.mockUsdAddress;
  }

  /** Turns a contract revert into ChainCallRevertedError; other errors pass through. */
  #asRevert(method: string, error: unknown): unknown {
    if (!isError(error, "CALL_EXCEPTION") || isTransientRpcError(error)) return error;
    const data = typeof error.data === "string" ? error.data : null;
    if (data && data.length > 2) {
      for (const iface of Object.values(this.#interfaces)) {
        const parsed = iface.parseError(data);
        if (parsed) {
          return new ChainCallRevertedError(
            method,
            parsed.name,
            [...parsed.args].map((arg) => toJsonSafe(arg)),
            { cause: error },
          );
        }
      }
    }
    return new ChainCallRevertedError(method, error.revert?.name ?? null, [], { cause: error });
  }

  async #read(contract: ContractKey, method: string, args: unknown[]): Promise<Result> {
    await this.assertChain();
    const iface = this.#interfaces[contract];
    const data = iface.encodeFunctionData(method, args);
    try {
      const raw = await this.#rpc<string>("eth_call", [
        { to: this.#target(contract), data },
        "latest",
      ]);
      return iface.decodeFunctionResult(method, raw);
    } catch (error) {
      throw this.#asRevert(method, error);
    }
  }

  #write<T extends { ids: object }>(
    contract: ContractKey,
    method: string,
    args: unknown[],
    extract: (events: ParsedEvent[]) => T,
  ): Promise<
    Omit<PendingWrite<T["ids"]>, "confirmation"> & {
      confirmation: Promise<WriteConfirmation<T["ids"]> & Omit<T, "ids">>;
    }
  > {
    return this.#queue.run(async () => {
      const sent = await this.#send(contract, method, args);
      const mined = this.#waitForReceipt(method, sent.txHash, sent.startedAt);
      const confirmation = mined.then((result) =>
        this.#confirm(method, sent.txHash, result, extract),
      );
      // Mark it handled so an ignored rejection can't crash the process.
      confirmation.catch(() => undefined);
      return {
        value: {
          method,
          txHash: sent.txHash,
          explorerUrl: this.txUrl(sent.txHash),
          nonce: sent.nonce,
          confirmation,
        },
        holdUntil: mined,
      };
    });
  }

  async #send(
    contract: ContractKey,
    method: string,
    args: unknown[],
  ): Promise<{ txHash: string; nonce: number; startedAt: number }> {
    await this.assertChain();
    const to = this.#target(contract);
    const data = this.#interfaces[contract].encodeFunctionData(method, args);

    const [gasLimit, fees] = await Promise.all([
      this.#rpc<string>("eth_estimateGas", [{ from: this.operatorAddress, to, data }])
        .then(BigInt)
        .catch((error: unknown) => {
          throw this.#asRevert(method, error);
        }),
      withRetry(() => this.#provider.getFeeData(), this.#retry),
    ]);
    const feeFields =
      fees.maxFeePerGas !== null && fees.maxPriorityFeePerGas !== null
        ? {
            type: 2,
            maxFeePerGas: fees.maxFeePerGas,
            maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
          }
        : { type: 0, gasPrice: fees.gasPrice };

    for (let resync = 0; ; resync++) {
      const nonce = (this.#nonce ??= await this.#pendingNonce());
      const signed = await this.#wallet.signTransaction({
        ...feeFields,
        chainId: this.expectedChainId,
        nonce,
        to,
        data,
        gasLimit,
        value: 0n,
      });
      const txHash = Transaction.from(signed).hash as string;
      const startedAt = performance.now();
      try {
        await this.#broadcast(method, signed, txHash);
        this.#nonce = nonce + 1;
        return { txHash, nonce, startedAt };
      } catch (error) {
        this.#nonce = null;
        if (isNonceError(error) && resync < this.#nonceResyncs) continue;
        throw error;
      }
    }
  }

  #pendingNonce(): Promise<number> {
    return this.#rpc<string>("eth_getTransactionCount", [this.operatorAddress, "pending"]).then(
      Number,
    );
  }

  /**
   * Sends one signed transaction, retrying transient failures. A retry can
   * hit a transaction that already reached the node; that counts as sent.
   */
  async #broadcast(method: string, signed: string, txHash: string): Promise<void> {
    for (let attempt = 1; ; attempt++) {
      try {
        await this.#provider.send("eth_sendRawTransaction", [signed]);
        return;
      } catch (error) {
        if (isAlreadyKnownError(error)) return;
        if (attempt > 1 && isNonceError(error)) {
          // Did an earlier, seemingly failed attempt land? Only a definite
          // "no" lets the caller re-sign with a fresh nonce.
          const known = await this.#rpc<unknown>("eth_getTransactionByHash", [txHash]).catch(
            (lookupError: unknown) => {
              throw new ChainBroadcastError(method, txHash, { cause: lookupError });
            },
          );
          if (known !== null) return;
          throw error;
        }
        if (!isTransientRpcError(error)) throw error;
        if (attempt >= this.#retry.attempts) {
          // It may still have reached the node.
          throw new ChainBroadcastError(method, txHash, { cause: error });
        }
        await sleep(this.#retry.baseDelayMs * 2 ** (attempt - 1));
      }
    }
  }

  async #waitForReceipt(method: string, txHash: string, startedAt: number): Promise<Mined> {
    try {
      for (;;) {
        let receipt: RawReceipt | null = null;
        try {
          receipt = await this.#provider.send("eth_getTransactionReceipt", [txHash]);
        } catch (error) {
          if (!isTransientRpcError(error)) throw error;
        }
        if (receipt) {
          return { receipt, confirmationMs: Math.round(performance.now() - startedAt) };
        }
        if (performance.now() - startedAt >= this.#confirmationTimeoutMs) {
          throw new ChainConfirmationTimeoutError(method, txHash, this.#confirmationTimeoutMs);
        }
        await sleep(this.#receiptPollMs);
      }
    } catch (error) {
      // The transaction may still be pending; resync before the next write.
      this.#nonce = null;
      throw error;
    }
  }

  async #confirm<T extends { ids: object }>(
    method: string,
    txHash: string,
    { receipt, confirmationMs }: Mined,
    extract: (events: ParsedEvent[]) => T,
  ): Promise<WriteConfirmation<T["ids"]> & Omit<T, "ids">> {
    const blockNumber = Number(BigInt(receipt.blockNumber));
    if (BigInt(receipt.status) !== 1n) {
      throw new ChainTxRevertedError(method, txHash, blockNumber);
    }
    const block = await this.#rpc<{ timestamp: string } | null>("eth_getBlockByNumber", [
      receipt.blockNumber,
      false,
    ]);
    if (!block) throw new Error(`Block ${blockNumber} of ${txHash} was not found.`);

    const parsed: ParsedEvent[] = [];
    const events: ChainEventRecord[] = [];
    for (const log of receipt.logs) {
      const decoded = this.#decodeLog(log);
      if (!decoded) continue;
      parsed.push(decoded.parsed);
      events.push({
        eventName: decoded.parsed.name,
        contractAddress: decoded.parsed.address,
        txHash,
        blockNumber,
        logIndex: Number(BigInt(log.logIndex)),
        args: decoded.args,
      });
    }

    return {
      ...extract(parsed),
      method,
      txHash,
      explorerUrl: this.txUrl(txHash),
      blockNumber,
      confirmedAt: new Date(Number(BigInt(block.timestamp)) * 1000),
      confirmationMs,
      events,
    };
  }

  /** Decodes a log from one of our contracts; other contracts' logs are skipped. */
  #decodeLog(log: RawLog): { parsed: ParsedEvent; args: Record<string, JsonValue> } | null {
    const address = getAddress(log.address);
    const contract: ContractKey | null =
      address === this.networkAddress ? "network" : address === this.mockUsdAddress ? "token" : null;
    if (!contract) return null;

    const description = this.#interfaces[contract].parseLog({ topics: log.topics, data: log.data });
    if (!description) {
      // ABI drift: keep the raw log rather than dropping it.
      return {
        parsed: { name: "UnknownEvent", address, args: {} },
        args: { topics: log.topics, data: log.data },
      };
    }
    const raw: Record<string, unknown> = {};
    const args: Record<string, JsonValue> = {};
    description.fragment.inputs.forEach((input, index) => {
      const value: unknown = description.args[index];
      raw[input.name] = value;
      args[input.name] = toJsonSafe(Indexed.isIndexed(value) ? value.hash : value);
    });
    return { parsed: { name: description.name, address, args: raw }, args };
  }

  #event(events: ParsedEvent[], name: string): ParsedEvent {
    const event = events.find((e) => e.name === name && e.address === this.networkAddress);
    if (!event) throw new Error(`The receipt has no ${name} event.`);
    return event;
  }

  #created(events: ParsedEvent[], eventName: string, argName: string): bigint {
    return this.#event(events, eventName).args[argName] as bigint;
  }
}

function noIds(): { ids: NoIds } {
  return { ids: {} };
}

export function createChainClient(options: ChainClientOptions): ChainClient {
  return new ChainClient(options);
}
