import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

const PARENT = ethers.id("demo-parent");

async function deployNetwork() {
  const [operator, other] = await ethers.getSigners();
  const token = await ethers.deployContract("MockUSD");
  const cardNetwork = await ethers.deployContract("FamilyCardNetwork", [
    await token.getAddress(),
  ]);
  await token.setMinter(await cardNetwork.getAddress(), true);
  return { token, cardNetwork, operator, other };
}

describe("FamilyCardNetwork simulated bank", function () {
  it("emits BankLinked when a bank is linked", async function () {
    const { cardNetwork } = await deployNetwork();

    await expect(cardNetwork.linkBankAccount(PARENT, "Example Bank", "4417"))
      .to.emit(cardNetwork, "BankLinked")
      .withArgs(PARENT, "Example Bank", "4417");
    expect(await cardNetwork.hasLinkedBank(PARENT)).to.equal(true);
  });

  it("credits the bank balance and mints matching tUSD to the network", async function () {
    const { token, cardNetwork } = await deployNetwork();
    const networkAddress = await cardNetwork.getAddress();
    await cardNetwork.linkBankAccount(PARENT, "Example Bank", "4417");
    await cardNetwork.linkBankAccount(PARENT, "Second Bank", "0021");

    await expect(cardNetwork.bankDeposit(PARENT, 50000n))
      .to.emit(cardNetwork, "BankDeposit")
      .withArgs(PARENT, 50000n, 50000n);
    await expect(cardNetwork.bankDeposit(PARENT, 2500n))
      .to.emit(cardNetwork, "BankDeposit")
      .withArgs(PARENT, 2500n, 52500n);

    expect(await cardNetwork.bankBalanceOf(PARENT)).to.equal(52500n);
    expect(await token.balanceOf(networkAddress)).to.equal(52500n);
    expect(await token.totalSupply()).to.equal(52500n);
  });

  it("reverts a deposit without a linked bank or of zero", async function () {
    const { cardNetwork } = await deployNetwork();

    await expect(cardNetwork.bankDeposit(PARENT, 100n))
      .to.be.revertedWithCustomError(cardNetwork, "NoLinkedBank")
      .withArgs(PARENT);

    await cardNetwork.linkBankAccount(PARENT, "Example Bank", "4417");
    await expect(
      cardNetwork.bankDeposit(PARENT, 0n),
    ).to.be.revertedWithCustomError(cardNetwork, "ZeroAmount");
  });

  it("reverts write calls from anyone but the operator", async function () {
    const { cardNetwork, other } = await deployNetwork();

    await expect(
      cardNetwork.connect(other).linkBankAccount(PARENT, "Example Bank", "4417"),
    )
      .to.be.revertedWithCustomError(cardNetwork, "OwnableUnauthorizedAccount")
      .withArgs(other.address);

    await cardNetwork.linkBankAccount(PARENT, "Example Bank", "4417");
    await expect(cardNetwork.connect(other).bankDeposit(PARENT, 100n))
      .to.be.revertedWithCustomError(cardNetwork, "OwnableUnauthorizedAccount")
      .withArgs(other.address);
  });
});

describe("FamilyCardNetwork pot and buckets", function () {
  const GRANDPARENT = ethers.id("demo-grandparent");

  async function deployWithFundedBanks() {
    const deployed = await deployNetwork();
    const { cardNetwork } = deployed;
    await cardNetwork.linkBankAccount(PARENT, "Example Bank", "4417");
    await cardNetwork.bankDeposit(PARENT, 50000n);
    await cardNetwork.linkBankAccount(GRANDPARENT, "Other Bank", "9902");
    await cardNetwork.bankDeposit(GRANDPARENT, 20000n);
    await cardNetwork.createBucket("Groceries", 15000n, 7500n);
    return deployed;
  }

  it("creates buckets with their limits and IDs from 1", async function () {
    const { cardNetwork } = await deployNetwork();

    await expect(cardNetwork.createBucket("Groceries", 15000n, 7500n))
      .to.emit(cardNetwork, "BucketCreated")
      .withArgs(1n, "Groceries", 15000n, 7500n);
    await expect(cardNetwork.createBucket("Fun", 0n, 0n))
      .to.emit(cardNetwork, "BucketCreated")
      .withArgs(2n, "Fun", 0n, 0n);

    expect(await cardNetwork.bucketCount()).to.equal(2n);
    const groceries = await cardNetwork.getBucket(1n);
    expect(groceries.name).to.equal("Groceries");
    expect(groceries.perTxLimit).to.equal(15000n);
    expect(groceries.approvalThreshold).to.equal(7500n);
    expect(groceries.available).to.equal(0n);
    expect(groceries.held).to.equal(0n);
    expect(groceries.spent).to.equal(0n);
    await expect(cardNetwork.getBucket(0n))
      .to.be.revertedWithCustomError(cardNetwork, "UnknownBucket")
      .withArgs(0n);
  });

  it("funding a bucket attributes the contribution to the funder", async function () {
    const { token, cardNetwork } = await deployWithFundedBanks();
    const networkAddress = await cardNetwork.getAddress();

    const tx = await cardNetwork.fundBucket(PARENT, 1n, 12000n);
    await expect(tx)
      .to.emit(cardNetwork, "BucketFunded")
      .withArgs(1n, PARENT, 1n, 12000n);
    await expect(cardNetwork.fundBucket(GRANDPARENT, 1n, 5000n))
      .to.emit(cardNetwork, "BucketFunded")
      .withArgs(2n, GRANDPARENT, 1n, 5000n);

    expect(await cardNetwork.bankBalanceOf(PARENT)).to.equal(38000n);
    expect(await cardNetwork.bankBalanceOf(GRANDPARENT)).to.equal(15000n);
    expect((await cardNetwork.getBucket(1n)).available).to.equal(17000n);
    // Funding only moves the internal ledgers; the tUSD stays in the network.
    expect(await token.balanceOf(networkAddress)).to.equal(70000n);

    expect(await cardNetwork.contributionCount()).to.equal(2n);
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt!.blockNumber);
    const first = await cardNetwork.getContribution(1n);
    expect(first.funderId).to.equal(PARENT);
    expect(first.bucketId).to.equal(1n);
    expect(first.amount).to.equal(12000n);
    expect(first.timestamp).to.equal(BigInt(block!.timestamp));
    expect((await cardNetwork.getContribution(2n)).funderId).to.equal(
      GRANDPARENT,
    );
    await expect(cardNetwork.getContribution(3n))
      .to.be.revertedWithCustomError(cardNetwork, "UnknownContribution")
      .withArgs(3n);
  });

  it("reverts funding beyond the bank balance, of zero or of an unknown bucket", async function () {
    const { cardNetwork } = await deployWithFundedBanks();

    await expect(cardNetwork.fundBucket(GRANDPARENT, 1n, 20001n))
      .to.be.revertedWithCustomError(cardNetwork, "InsufficientBankBalance")
      .withArgs(GRANDPARENT, 20000n, 20001n);
    await expect(
      cardNetwork.fundBucket(PARENT, 1n, 0n),
    ).to.be.revertedWithCustomError(cardNetwork, "ZeroAmount");
    await expect(cardNetwork.fundBucket(PARENT, 2n, 100n))
      .to.be.revertedWithCustomError(cardNetwork, "UnknownBucket")
      .withArgs(2n);

    expect(await cardNetwork.bankBalanceOf(GRANDPARENT)).to.equal(20000n);
    expect(await cardNetwork.contributionCount()).to.equal(0n);
  });

  it("updates a bucket's limits", async function () {
    const { cardNetwork } = await deployWithFundedBanks();

    await expect(cardNetwork.setBucketLimits(1n, 10000n, 0n))
      .to.emit(cardNetwork, "BucketLimitsUpdated")
      .withArgs(1n, 10000n, 0n);

    const groceries = await cardNetwork.getBucket(1n);
    expect(groceries.perTxLimit).to.equal(10000n);
    expect(groceries.approvalThreshold).to.equal(0n);
    await expect(cardNetwork.setBucketLimits(0n, 1n, 1n))
      .to.be.revertedWithCustomError(cardNetwork, "UnknownBucket")
      .withArgs(0n);
  });

  it("reverts bucket writes from anyone but the operator", async function () {
    const { cardNetwork, other } = await deployWithFundedBanks();
    const asOther = cardNetwork.connect(other);

    for (const call of [
      () => asOther.createBucket("Fun", 0n, 0n),
      () => asOther.setBucketLimits(1n, 0n, 0n),
      () => asOther.fundBucket(PARENT, 1n, 100n),
    ]) {
      await expect(call())
        .to.be.revertedWithCustomError(
          cardNetwork,
          "OwnableUnauthorizedAccount",
        )
        .withArgs(other.address);
    }
  });
});
