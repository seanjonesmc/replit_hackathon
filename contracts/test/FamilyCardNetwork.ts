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

    await expect(cardNetwork.linkBankAccount(PARENT, "Demo Bank", "4417"))
      .to.emit(cardNetwork, "BankLinked")
      .withArgs(PARENT, "Demo Bank", "4417");
    expect(await cardNetwork.hasLinkedBank(PARENT)).to.equal(true);
  });

  it("credits the bank balance and mints matching tUSD to the network", async function () {
    const { token, cardNetwork } = await deployNetwork();
    const networkAddress = await cardNetwork.getAddress();
    await cardNetwork.linkBankAccount(PARENT, "Demo Bank", "4417");
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

    await cardNetwork.linkBankAccount(PARENT, "Demo Bank", "4417");
    await expect(
      cardNetwork.bankDeposit(PARENT, 0n),
    ).to.be.revertedWithCustomError(cardNetwork, "ZeroAmount");
  });

  it("reverts write calls from anyone but the operator", async function () {
    const { cardNetwork, other } = await deployNetwork();

    await expect(
      cardNetwork.connect(other).linkBankAccount(PARENT, "Demo Bank", "4417"),
    )
      .to.be.revertedWithCustomError(cardNetwork, "OwnableUnauthorizedAccount")
      .withArgs(other.address);

    await cardNetwork.linkBankAccount(PARENT, "Demo Bank", "4417");
    await expect(cardNetwork.connect(other).bankDeposit(PARENT, 100n))
      .to.be.revertedWithCustomError(cardNetwork, "OwnableUnauthorizedAccount")
      .withArgs(other.address);
  });
});
