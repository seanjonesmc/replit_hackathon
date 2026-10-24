import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { ChainIdMismatchError, DEFAULT_EXPLORER_URL, DEFAULT_RPC_URL } from "@workspace/chain";
import { Wallet } from "ethers";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  CHAIN_ENV_NAMES,
  ChainNotConfiguredError,
  createBlockchainService,
  isChainConfigured,
  type ChainEnv,
} from "./index";

const operator = Wallet.createRandom();
const ADDRESSES = {
  MOCKUSD_ADDRESS: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  NETWORK_ADDRESS: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
};

describe("blockchain service without chain Secrets", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("reports not configured instead of throwing", async () => {
    for (const name of CHAIN_ENV_NAMES) vi.stubEnv(name, "");
    expect(isChainConfigured()).toBe(false);

    const service = createBlockchainService({});
    expect(service.isConfigured()).toBe(false);
    expect(service.setup).toEqual({
      configured: false,
      problems: [
        "DEPLOYER_PRIVATE_KEY is not set.",
        "MOCKUSD_ADDRESS is not set.",
        "NETWORK_ADDRESS is not set.",
      ],
    });
    expect(() => service.getClient()).toThrow(ChainNotConfiguredError);
    await expect(service.checkReady()).rejects.toBeInstanceOf(ChainNotConfiguredError);
  });

  it("names invalid Secrets without echoing their values", () => {
    const badKey = "0xdeadbeef-not-a-key";
    const setup = createBlockchainService({
      DEPLOYER_PRIVATE_KEY: badKey,
      MONAD_CHAIN_ID: "1",
      MONAD_RPC_URL: "ftp://rpc.example/secret-token",
      MOCKUSD_ADDRESS: "0x123",
      NETWORK_ADDRESS: ADDRESSES.NETWORK_ADDRESS,
    }).setup;
    expect(setup.configured).toBe(false);
    const problems = setup.configured ? [] : setup.problems;
    expect(problems).toEqual([
      "MONAD_RPC_URL is not an http(s) URL.",
      "MONAD_CHAIN_ID must be 10143 (Monad testnet); no other chain is supported.",
      "DEPLOYER_PRIVATE_KEY is not a valid private key.",
      "MOCKUSD_ADDRESS is not a valid address.",
    ]);
    expect(problems.join(" ")).not.toMatch(/deadbeef|secret-token/);
  });
});

describe("blockchain service with chain Secrets", () => {
  const env: ChainEnv = {
    // Without the 0x prefix, as keys are often pasted.
    DEPLOYER_PRIVATE_KEY: operator.privateKey.slice(2),
    ...ADDRESSES,
  };

  it("defaults to Monad testnet and shares one client", () => {
    const service = createBlockchainService(env);
    expect(service.setup).toEqual({
      configured: true,
      options: {
        rpc: DEFAULT_RPC_URL,
        operatorPrivateKey: operator.privateKey,
        mockUsdAddress: ADDRESSES.MOCKUSD_ADDRESS,
        networkAddress: ADDRESSES.NETWORK_ADDRESS,
        explorerUrl: DEFAULT_EXPLORER_URL,
        expectedChainId: 10143,
      },
    });
    const client = service.getClient();
    expect(service.getClient()).toBe(client);
    expect(client.operatorAddress).toBe(operator.address);
    expect(client.txUrl("0xabc")).toBe("https://testnet.monadvision.com/tx/0xabc");
    client.close();
  });

  describe("readiness check against an RPC endpoint", () => {
    let server: Server;
    let rpcUrl: string;
    let chainIdHex = "0x279f"; // 10143

    beforeAll(async () => {
      server = createServer((req, res) => {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          const { id, method } = JSON.parse(body) as { id: number; method: string };
          const results: Record<string, string> = {
            eth_chainId: chainIdHex,
            eth_getCode: "0x6080",
            eth_blockNumber: "0x2a",
          };
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ jsonrpc: "2.0", id, result: results[method] }));
        });
      });
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      rpcUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });

    afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

    it("confirms chain 10143 and the deployed contracts", async () => {
      chainIdHex = "0x279f";
      const service = createBlockchainService({ ...env, MONAD_RPC_URL: rpcUrl });
      await expect(service.checkReady()).resolves.toEqual({
        chainId: 10143,
        blockNumber: 42,
        operatorAddress: operator.address,
      });
      service.getClient().close();
    });

    it("refuses any other chain", async () => {
      chainIdHex = "0x1";
      const service = createBlockchainService({ ...env, MONAD_RPC_URL: rpcUrl });
      await expect(service.checkReady()).rejects.toBeInstanceOf(ChainIdMismatchError);
      service.getClient().close();
    });
  });
});
