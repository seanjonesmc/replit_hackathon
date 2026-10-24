import { expect } from "chai";
import hre from "hardhat";
import { familyCardNetworkAbi, mockUsdAbi } from "@workspace/chain";

describe("Shared chain library ABIs", function () {
  for (const [contractName, committedAbi] of [
    ["FamilyCardNetwork", familyCardNetworkAbi],
    ["MockUSD", mockUsdAbi],
  ] as const) {
    it(`match the compiled ${contractName}`, async function () {
      const { abi } = await hre.artifacts.readArtifact(contractName);
      expect(committedAbi, "Run `pnpm run contracts:export-abis`").to.deep.equal(abi);
    });
  }
});
