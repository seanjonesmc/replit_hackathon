import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

async function deployMockUSD() {
  const [operator, other] = await ethers.getSigners();
  const token = await ethers.deployContract("MockUSD");
  const minterContract = await ethers.deployContract("MintCaller");
  return { token, minterContract, operator, other };
}

describe("MockUSD", function () {
  it("is Test USD (tUSD) with 2 decimals", async function () {
    const { token } = await deployMockUSD();

    expect(await token.name()).to.equal("Test USD");
    expect(await token.symbol()).to.equal("tUSD");
    expect(await token.decimals()).to.equal(2n);
  });

  it("lets the operator mint", async function () {
    const { token, operator, other } = await deployMockUSD();

    await token.connect(operator).mint(other.address, 2500n);

    expect(await token.balanceOf(other.address)).to.equal(2500n);
    expect(await token.totalSupply()).to.equal(2500n);
  });

  it("lets a contract the operator authorizes mint", async function () {
    const { token, minterContract, other } = await deployMockUSD();
    const minterAddress = await minterContract.getAddress();

    await expect(token.setMinter(minterAddress, true))
      .to.emit(token, "MinterSet")
      .withArgs(minterAddress, true);
    await minterContract.mint(await token.getAddress(), other.address, 100n);

    expect(await token.balanceOf(other.address)).to.equal(100n);
  });

  it("reverts minting from any other address", async function () {
    const { token, minterContract, other } = await deployMockUSD();

    await expect(token.connect(other).mint(other.address, 100n))
      .to.be.revertedWithCustomError(token, "NotMinter")
      .withArgs(other.address);
    await expect(
      minterContract.mint(await token.getAddress(), other.address, 100n),
    )
      .to.be.revertedWithCustomError(token, "NotMinter")
      .withArgs(await minterContract.getAddress());
  });

  it("never hands mint rights to a wallet or lets others grant them", async function () {
    const { token, minterContract, other } = await deployMockUSD();

    await expect(token.setMinter(other.address, true))
      .to.be.revertedWithCustomError(token, "MinterNotContract")
      .withArgs(other.address);
    await expect(
      token.connect(other).setMinter(await minterContract.getAddress(), true),
    )
      .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
      .withArgs(other.address);
  });
});
