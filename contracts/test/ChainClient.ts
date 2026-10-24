import { expect } from "chai";
import { network } from "hardhat";
import {
  ChainCallRevertedError,
  ChainIdMismatchError,
  createChainClient,
  memberChainId,
  merchantChainId,
  type ChainClient,
  type ChainClientOptions,
} from "@workspace/chain";

// The API's chain client (lib/chain), driven against the in-process network.
const { ethers, provider } = await network.create();

const PARENT = memberChainId("parent");
const DEPENDENT = memberChainId("dependent");
const GROCER = merchantChainId("corner-grocer");
const EXPLORER = "https://explorer.example";
const TX_HASH = /^0x[0-9a-f]{64}$/;

async function rejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("Expected the promise to reject.");
}

describe("ChainClient (lib/chain)", function () {
  const operator = ethers.Wallet.createRandom(ethers.provider);
  let options: ChainClientOptions;
  let client: ChainClient;
  let tokenAddress: string;
  let networkAddress: string;
  let payoutAddress: string;

  const operatorNonce = () => ethers.provider.getTransactionCount(operator.address);

  before(async function () {
    const [funder, payout] = await ethers.getSigners();
    payoutAddress = payout.address;
    await (
      await funder.sendTransaction({ to: operator.address, value: ethers.parseEther("100") })
    ).wait();

    // The client's wallet deploys, so it owns both contracts (the operator).
    const token = await ethers.deployContract("MockUSD", [], operator);
    tokenAddress = await token.getAddress();
    const cardNetwork = await ethers.deployContract("FamilyCardNetwork", [tokenAddress], operator);
    networkAddress = await cardNetwork.getAddress();

    options = {
      rpc: provider,
      operatorPrivateKey: operator.privateKey,
      mockUsdAddress: tokenAddress,
      networkAddress,
      explorerUrl: EXPLORER,
      expectedChainId: Number(await provider.request({ method: "eth_chainId" })),
      retry: { baseDelayMs: 5 },
      receiptPollMs: 10,
    };
    client = createChainClient(options);
  });

  after(function () {
    client.close();
  });

  it("refuses to send or read when connected to another chain", async function () {
    const monadOnly = createChainClient({ ...options, expectedChainId: 10143 });
    const nonceBefore = await operatorNonce();

    const sendError = await rejection(
      monadOnly.linkBankAccount({ userId: PARENT, bankName: "Example Bank", last4: "4417" }),
    );
    expect(sendError).to.be.instanceOf(ChainIdMismatchError);
    expect(await rejection(monadOnly.getBankBalance(PARENT))).to.be.instanceOf(
      ChainIdMismatchError,
    );
    expect(await operatorNonce()).to.equal(nonceBefore);
    monadOnly.close();
  });

  it("drives deposit → fund → authorize → capture and decodes the events", async function () {
    const minter = await client.setMinter({ account: networkAddress, allowed: true });
    expect(minter.txHash).to.match(TX_HASH);
    expect(minter.explorerUrl).to.equal(`${EXPLORER}/tx/${minter.txHash}`);
    expect((await minter.confirmation).events.map((e) => e.eventName)).to.deep.equal([
      "MinterSet",
    ]);

    await (
      await client.linkBankAccount({ userId: PARENT, bankName: "Example Bank", last4: "4417" })
    ).confirmation;
    const deposit = await (await client.bankDeposit({ userId: PARENT, amount: 50_000n }))
      .confirmation;
    expect(deposit.events.map((e) => [e.eventName, e.contractAddress])).to.deep.equal([
      ["Transfer", tokenAddress],
      ["BankDeposit", networkAddress],
    ]);
    expect(deposit.events[1].args).to.deep.equal({
      userId: PARENT,
      amount: "50000",
      newBalance: "50000",
    });

    const bucket = await (
      await client.createBucket({ name: "Food", perTxLimit: 6_000n, approvalThreshold: 7_500n })
    ).confirmation;
    expect(bucket.ids).to.deep.equal({ bucketId: 1n });

    const funded = await (
      await client.fundBucket({ funderId: PARENT, bucketId: 1n, amount: 10_000n })
    ).confirmation;
    expect(funded.ids).to.deep.equal({ contributionId: 1n });
    expect(funded.events).to.deep.equal([
      {
        eventName: "BucketFunded",
        contractAddress: networkAddress,
        txHash: funded.txHash,
        blockNumber: funded.blockNumber,
        logIndex: 0,
        args: { contributionId: "1", funderId: PARENT, bucketId: "1", amount: "10000" },
      },
    ]);

    const card = await (
      await client.issueCard({ dependentId: DEPENDENT, last4: "4242", expiryMonth: 9, expiryYear: 2029 })
    ).confirmation;
    expect(card.ids).to.deep.equal({ cardId: 1n });
    await (await client.activateCard({ cardId: 1n })).confirmation;
    await (
      await client.registerMerchant({
        merchantId: GROCER,
        name: "Corner Grocer",
        mcc: 5411,
        category: "grocery",
        payoutAddress,
      })
    ).confirmation;

    const pending = await client.authorize({
      cardId: 1n,
      merchantId: GROCER,
      bucketId: 1n,
      amount: 4_250n,
      engineDecision: "approve",
      reasonCode: "approved",
      reason: "Within the Food rules.",
    });
    expect(pending.txHash).to.match(TX_HASH);
    const auth = await pending.confirmation;
    expect(auth.txHash).to.equal(pending.txHash);
    expect(auth.ids).to.deep.equal({ authorizationId: 1n });
    expect(auth.authorization).to.deep.equal({
      status: "approved",
      reasonCode: "approved",
      reason: "Within the Food rules.",
    });
    expect(auth.blockNumber).to.be.a("number");
    expect(auth.confirmationMs).to.be.a("number").and.at.least(0);
    expect(auth.confirmedAt).to.be.instanceOf(Date);
    expect(auth.events[0].args).to.deep.equal({
      authId: "1",
      cardId: "1",
      merchantId: GROCER,
      bucketId: "1",
      amount: "4250",
      status: "0",
      reasonCode: "0",
      reason: "Within the Food rules.",
    });
    // Events are ready for a jsonb column as they are.
    expect(JSON.parse(JSON.stringify(auth.events))).to.deep.equal(auth.events);

    const captured = await (await client.capture({ authorizationId: 1n })).confirmation;
    expect(captured.events.map((e) => [e.eventName, e.logIndex])).to.deep.equal([
      ["Transfer", 0],
      ["AuthorizationCaptured", 1],
    ]);
    expect(captured.events[1].args).to.deep.equal({
      authId: "1",
      merchantId: GROCER,
      payoutAddress,
      amount: "4250",
    });

    expect(await client.getBankBalance(PARENT)).to.equal(40_000n);
    expect(await client.getBucket(1n)).to.deep.equal({
      name: "Food",
      perTxLimit: 6_000n,
      approvalThreshold: 7_500n,
      available: 5_750n,
      held: 0n,
      spent: 4_250n,
    });
    expect(await client.getCard(1n)).to.deep.equal({
      dependentId: DEPENDENT,
      last4: "4242",
      expiryMonth: 9,
      expiryYear: 2029,
      status: "active",
    });
    expect(await client.getAuthorization(1n)).to.deep.include({
      cardId: 1n,
      merchantId: GROCER,
      bucketId: 1n,
      amount: 4_250n,
      status: "captured",
      reasonCode: "approved",
      reason: "Within the Food rules.",
    });
    expect(await client.getTusdBalance(payoutAddress)).to.equal(4_250n);
  });

  it("confirms writes fired at once in call order, each seeing the last", async function () {
    const nonceBefore = await operatorNonce();
    const sent = await Promise.all(
      ["A", "B", "C", "D", "E"].map((name) =>
        client.createBucket({ name, perTxLimit: 0n, approvalThreshold: 0n }),
      ),
    );
    expect(sent.map((p) => p.nonce)).to.deep.equal([0, 1, 2, 3, 4].map((i) => nonceBefore + i));
    const confirmed = await Promise.all(sent.map((p) => p.confirmation));
    expect(confirmed.map((c) => c.ids.bucketId)).to.deep.equal([2n, 3n, 4n, 5n, 6n]);
    for (let i = 1; i < confirmed.length; i++) {
      expect(confirmed[i].blockNumber).to.be.greaterThan(confirmed[i - 1].blockNumber);
    }

    // A capture fired with its authorization is estimated after it is mined.
    const [authorize, capture] = await Promise.all([
      client.authorize({
        cardId: 1n,
        merchantId: GROCER,
        bucketId: 1n,
        amount: 1_000n,
        engineDecision: "approve",
        reasonCode: "approved",
        reason: "Within the Food rules.",
      }),
      client.capture({ authorizationId: 2n }),
    ]);
    expect((await authorize.confirmation).ids).to.deep.equal({ authorizationId: 2n });
    expect((await capture.confirmation).events.map((e) => e.eventName)).to.include(
      "AuthorizationCaptured",
    );

    // A reverting write fails alone, without using a nonce or stalling the queue.
    const nonceMid = await operatorNonce();
    const [first, failed, last] = await Promise.allSettled([
      client.setBucketLimits({ bucketId: 2n, perTxLimit: 500n, approvalThreshold: 0n }),
      client.capture({ authorizationId: 99n }),
      client.setBucketLimits({ bucketId: 3n, perTxLimit: 500n, approvalThreshold: 0n }),
    ]);
    expect(failed.status).to.equal("rejected");
    const reason = (failed as PromiseRejectedResult).reason;
    expect(reason).to.be.instanceOf(ChainCallRevertedError);
    expect(reason).to.deep.include({ errorName: "UnknownAuthorization", errorArgs: ["99"] });
    expect(first.status === "fulfilled" && first.value.nonce).to.equal(nonceMid);
    expect(last.status === "fulfilled" && last.value.nonce).to.equal(nonceMid + 1);
    if (last.status === "fulfilled") await last.value.confirmation;
  });

  it("resyncs its nonce after another sender used it", async function () {
    // E.g. a deploy script sending from the same operator key.
    await (await operator.sendTransaction({ to: payoutAddress, value: 1n })).wait();
    const nonce = await operatorNonce();

    const blocked = await client.setBlockedCategory({ category: "bar", blocked: true });
    expect(blocked.nonce).to.equal(nonce);
    expect((await blocked.confirmation).events[0]).to.deep.include({
      eventName: "CategoryBlocked",
      args: { category: "bar", blocked: true },
    });
  });

  describe("transient RPC failures", function () {
    /** Fails the next `count` calls to `method`, optionally after forwarding them. */
    function flakyProvider(method: string, count: number, forwardFirst: boolean) {
      let remaining = count;
      return {
        async request(args: { method: string; params?: unknown[] | object }) {
          if (args.method === method && remaining > 0) {
            remaining--;
            if (forwardFirst) await provider.request(args);
            throw new Error("request timed out");
          }
          return provider.request(args);
        },
      };
    }

    async function freezeThenUnfreeze(flaky: ReturnType<typeof flakyProvider>) {
      const flakyClient = createChainClient({ ...options, rpc: flaky });
      const nonceBefore = await operatorNonce();
      const frozen = await (await flakyClient.freezeCard({ cardId: 1n })).confirmation;
      expect(frozen.events.map((e) => e.eventName)).to.deep.equal(["CardFrozen"]);
      // Exactly one transaction was mined.
      expect(await operatorNonce()).to.equal(nonceBefore + 1);
      await (await flakyClient.unfreezeCard({ cardId: 1n })).confirmation;
      flakyClient.close();
    }

    it("retries gas estimation and sending", async function () {
      await freezeThenUnfreeze(flakyProvider("eth_estimateGas", 1, false));
      await freezeThenUnfreeze(flakyProvider("eth_sendRawTransaction", 2, false));
    });

    it("treats a send whose response was lost as sent, without sending twice", async function () {
      await freezeThenUnfreeze(flakyProvider("eth_sendRawTransaction", 1, true));
    });

    it("tolerates receipt polling failures", async function () {
      await freezeThenUnfreeze(flakyProvider("eth_getTransactionReceipt", 3, false));
    });
  });
});
