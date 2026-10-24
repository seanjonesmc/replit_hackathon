import { expect } from "chai";
import { network } from "hardhat";
import { createChainClient, memberChainId, merchantChainId, type ChainClient } from "@workspace/chain";
import { BRAND } from "../../src/brand/brand.config.js";
import {
  demoFamilyPlan,
  deployContracts,
  expectedBankBalances,
  readBackDemoFamily,
  seedDemoFamily,
  type DemoFamilyPlan,
  type SeededFamily,
} from "../scripts/demo-family.js";

// The deploy script's seed, run through the shared chain client on the
// in-process network (the same path as `pnpm run contracts:deploy:dry-run`).
const { ethers, provider } = await network.create();

describe("Demo family seed (deploy script)", function () {
  const plan: DemoFamilyPlan = demoFamilyPlan(new Date(Date.UTC(2026, 9, 24)));
  let client: ChainClient;
  let seeded: SeededFamily;

  before(async function () {
    const operator = ethers.Wallet.createRandom(ethers.provider);
    const [funder] = await ethers.getSigners();
    await (await funder.sendTransaction({ to: operator.address, value: ethers.parseEther("100") })).wait();

    const { mockUsd, network: cardNetwork } = await deployContracts(ethers, operator);
    client = createChainClient({
      rpc: provider,
      operatorPrivateKey: operator.privateKey,
      mockUsdAddress: mockUsd.address,
      networkAddress: cardNetwork.address,
      explorerUrl: "https://explorer.example",
      expectedChainId: Number(await provider.request({ method: "eth_chainId" })),
      receiptPollMs: 10,
    });
    seeded = await seedDemoFamily(client, plan);
  });

  after(function () {
    client?.close();
  });

  it("takes names, banks and the card's last four from BRAND.demo", function () {
    expect(plan.members.parent.name).to.equal(BRAND.demo.parent);
    expect([plan.members.grandparent.name, plan.members.coParent.name]).to.deep.equal(
      BRAND.demo.funders.slice(0, 2),
    );
    expect(plan.members.dependent.name).to.equal(BRAND.demo.dependent);
    expect(plan.banks.map((b) => b.bankName)).to.deep.equal(BRAND.demo.banks.slice(0, 3));
    expect(plan.card).to.deep.equal({ last4: BRAND.demo.cardLast4, expiryMonth: 10, expiryYear: 2030 });
  });

  it("uses the member IDs the backend stores and the shared merchant IDs", function () {
    expect(plan.members.coParent.id).to.equal(memberChainId("co-parent"));
    expect(plan.members.dependent.id).to.equal(memberChainId("dependent"));
    expect(plan.merchants.map((m) => m.id)).to.include(merchantChainId("trader-joes"));
    expect(new Set(plan.merchants.map((m) => m.payoutAddress)).size).to.equal(9);
  });

  it("leaves the grandparent $100 for the demo's add-$50 step", function () {
    expect(expectedBankBalances(plan)).to.deep.equal({
      parent: 390_00n,
      grandparent: 100_00n,
      coParent: 50_00n,
      dependent: 0n,
    });
  });

  it("creates the buckets, an active card and no authorizations", async function () {
    expect(seeded.bucketIds).to.deep.equal({ Food: 1n, School: 2n, Social: 3n, Transit: 4n });
    expect(seeded.cardId).to.equal(1n);
    expect(seeded.steps).to.have.length(31);
    for (const step of seeded.steps) expect(step.gasUsed > 0n).to.equal(true);
    expect((await client.getCounts()).authorizations).to.equal(0n);
  });

  it("reads back exactly what was planned", async function () {
    const readBack = await readBackDemoFamily(client, plan, seeded);
    expect(readBack.problems).to.deep.equal([]);
    expect(readBack.passed).to.be.greaterThan(70);
  });

  it("reports a mismatch when the chain differs from the plan", async function () {
    const changed: DemoFamilyPlan = {
      ...plan,
      card: { ...plan.card, last4: "0000" },
    };
    const readBack = await readBackDemoFamily(client, changed, seeded);
    expect(readBack.problems).to.deep.equal([
      `Card 1 last four: got ${BRAND.demo.cardLast4}, expected 0000`,
    ]);
  });
});
