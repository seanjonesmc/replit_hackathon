/**
 * Writes the compiled contracts' ABIs into the shared chain library
 * (`lib/chain/src/abis/`), so the API and these scripts use the same ABIs.
 *
 * Run after changing a contract: `pnpm run contracts:export-abis` (Hardhat
 * compiles first). `test/ChainAbis.ts` fails while the committed ABIs differ
 * from the compiled ones.
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import hre from "hardhat";

/** Contract name → exported constant name in the chain library. */
const EXPORTED_ABIS = {
  MockUSD: "mockUsdAbi",
  FamilyCardNetwork: "familyCardNetworkAbi",
} as const;

const abisDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../lib/chain/src/abis",
);

for (const [contractName, exportName] of Object.entries(EXPORTED_ABIS)) {
  const { abi } = await hre.artifacts.readArtifact(contractName);
  const source = [
    `// Generated from the compiled ${contractName} contract by`,
    "// contracts/scripts/export-abis.ts. Do not edit; run",
    "// `pnpm run contracts:export-abis` after changing the contract.",
    `export const ${exportName} = ${JSON.stringify(abi, null, 2)} as const;`,
    "",
  ].join("\n");
  const file = path.join(abisDir, `${contractName}.ts`);
  await writeFile(file, source);
  console.log(`Wrote ${path.relative(process.cwd(), file)}`);
}
