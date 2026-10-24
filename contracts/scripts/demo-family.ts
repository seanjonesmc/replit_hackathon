/**
 * The demo family's on-chain seed: what `deploy-and-seed.ts` deploys and
 * creates, and how it reads the result back. The contract tests run the same
 * functions on the in-process network.
 *
 * Names, bank names and the card's last four come from BRAND.demo; member and
 * merchant IDs from the shared chain library, so they match the IDs the
 * backend stores. Amounts are in cents and match the backend's Postgres seed.
 */
import type { HardhatEthers } from "@nomicfoundation/hardhat-ethers/types";
import {
  DEMO_BLOCKED_CATEGORIES,
  DEMO_BUCKET_CHAIN_IDS,
  DEMO_MEMBER_KEYS,
  DEMO_MERCHANTS,
  chainId,
  memberChainId,
  merchantChainId,
  merchantPayoutAddress,
  type Bytes32,
  type ChainClient,
  type DemoMemberRole,
  type DemoMerchant,
  type WriteConfirmation,
} from "@workspace/chain";
import type { Signer } from "ethers";
import { BRAND } from "../../src/brand/brand.config.js";

export type FundingRole = Exclude<DemoMemberRole, "dependent">;

export interface DemoMember {
  role: DemoMemberRole;
  name: string;
  id: Bytes32;
}

export interface DemoBank {
  role: FundingRole;
  bankName: string;
  last4: string;
  deposit: bigint;
}

export interface DemoBucket {
  name: string;
  amount: bigint;
  perTxLimit: bigint;
  approvalThreshold: bigint;
  fundedBy: FundingRole;
}

export interface DemoSeedMerchant extends DemoMerchant {
  id: Bytes32;
  payoutAddress: string;
}

export interface DemoFamilyPlan {
  members: Record<DemoMemberRole, DemoMember>;
  banks: DemoBank[];
  buckets: DemoBucket[];
  blockedCategories: readonly string[];
  merchants: DemoSeedMerchant[];
  card: { last4: string; expiryMonth: number; expiryYear: number };
}

const MEMBER_ROLES: readonly DemoMemberRole[] = ["parent", "grandparent", "coParent", "dependent"];
/** In BRAND.demo.banks order: the parent links the first bank, and so on. */
const FUNDING_ROLES: readonly FundingRole[] = ["parent", "grandparent", "coParent"];

const DEPOSITS: Record<FundingRole, bigint> = {
  parent: 500_00n,
  grandparent: 250_00n,
  coParent: 250_00n,
};

/**
 * The spec's three buckets, each funded by a different person, then Transit
 * (docs/plans/demo-preset-swipes.md), also funded by the parent. The
 * grandparent keeps $100.
 */
const BUCKETS: readonly DemoBucket[] = [
  { name: "Food", amount: 150_00n, perTxLimit: 60_00n, approvalThreshold: 75_00n, fundedBy: "grandparent" },
  { name: "School", amount: 200_00n, perTxLimit: 150_00n, approvalThreshold: 100_00n, fundedBy: "coParent" },
  { name: "Social", amount: 60_00n, perTxLimit: 40_00n, approvalThreshold: 30_00n, fundedBy: "parent" },
  { name: "Transit", amount: 50_00n, perTxLimit: 40_00n, approvalThreshold: 30_00n, fundedBy: "parent" },
];

/** The card expires this many years after the deploy month. */
const CARD_VALID_YEARS = 4;

/** A stable last four for a member's simulated bank, from their role key. */
function bankLast4(role: FundingRole): string {
  const digits = BigInt(chainId(`demo-family:bank:${DEMO_MEMBER_KEYS[role]}`)) % 10_000n;
  return digits.toString().padStart(4, "0");
}

export function usd(cents: bigint): string {
  const sign = cents < 0n ? "-" : "";
  const abs = cents < 0n ? -cents : cents;
  return `${sign}$${abs / 100n}.${(abs % 100n).toString().padStart(2, "0")}`;
}

export function demoFamilyPlan(now: Date = new Date()): DemoFamilyPlan {
  const { demo } = BRAND;
  const [grandparentName, coParentName] = demo.funders;
  if (!grandparentName || !coParentName) {
    throw new Error("BRAND.demo.funders needs two names (grandparent, then co-parent).");
  }
  if (demo.banks.length < FUNDING_ROLES.length) {
    throw new Error("BRAND.demo.banks needs three banks, one each for the parent and both funders.");
  }

  const names: Record<DemoMemberRole, string> = {
    parent: demo.parent,
    grandparent: grandparentName,
    coParent: coParentName,
    dependent: demo.dependent,
  };
  const members = Object.fromEntries(
    MEMBER_ROLES.map((role) => [
      role,
      { role, name: names[role], id: memberChainId(DEMO_MEMBER_KEYS[role]) },
    ]),
  ) as Record<DemoMemberRole, DemoMember>;

  return {
    members,
    banks: FUNDING_ROLES.map((role, index) => ({
      role,
      bankName: demo.banks[index]!,
      last4: bankLast4(role),
      deposit: DEPOSITS[role],
    })),
    buckets: BUCKETS.map((bucket) => ({ ...bucket })),
    blockedCategories: DEMO_BLOCKED_CATEGORIES,
    merchants: DEMO_MERCHANTS.map((merchant) => ({
      ...merchant,
      id: merchantChainId(merchant.slug),
      payoutAddress: merchantPayoutAddress(merchant.slug),
    })),
    card: {
      last4: demo.cardLast4,
      expiryMonth: now.getUTCMonth() + 1,
      expiryYear: now.getUTCFullYear() + CARD_VALID_YEARS,
    },
  };
}

/** Each funder's bank balance once the seed has funded the buckets. */
export function expectedBankBalances(plan: DemoFamilyPlan): Record<DemoMemberRole, bigint> {
  const balances: Record<DemoMemberRole, bigint> = {
    parent: 0n,
    grandparent: 0n,
    coParent: 0n,
    dependent: 0n,
  };
  for (const bank of plan.banks) balances[bank.role] += bank.deposit;
  for (const bucket of plan.buckets) balances[bucket.fundedBy] -= bucket.amount;
  return balances;
}

// --- Deploy ---

export interface DeployedContract {
  name: string;
  address: string;
  txHash: string;
  gasUsed: bigint;
}

/** Deploys MockUSD, then FamilyCardNetwork; `operator` owns both. */
export async function deployContracts(
  ethers: HardhatEthers,
  operator: Signer,
): Promise<{ mockUsd: DeployedContract; network: DeployedContract }> {
  const deploy = async (name: string, args: unknown[]): Promise<DeployedContract> => {
    const contract = await ethers.deployContract(name, args, operator);
    const tx = contract.deploymentTransaction();
    if (!tx) throw new Error(`Deploying ${name} sent no transaction.`);
    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1) {
      throw new Error(`Deploying ${name} failed in transaction ${tx.hash}.`);
    }
    return { name, address: await contract.getAddress(), txHash: tx.hash, gasUsed: receipt.gasUsed };
  };
  const mockUsd = await deploy("MockUSD", []);
  const network = await deploy("FamilyCardNetwork", [mockUsd.address]);
  return { mockUsd, network };
}

// --- Seed ---

export interface SeedStep {
  label: string;
  txHash: string;
  explorerUrl: string;
  gasUsed: bigint;
}

export interface SeededFamily {
  /** Bucket name → on-chain bucket ID. */
  bucketIds: Record<string, bigint>;
  cardId: bigint;
  steps: SeedStep[];
}

/**
 * Seeds the family through the shared chain client, one confirmed write at a
 * time. It creates no authorizations, so the swipe flow starts clean.
 */
export async function seedDemoFamily(
  client: ChainClient,
  plan: DemoFamilyPlan,
  onStep: (step: SeedStep) => void = () => undefined,
): Promise<SeededFamily> {
  const steps: SeedStep[] = [];
  const run = async <C extends WriteConfirmation<object>>(
    label: string,
    write: Promise<{ confirmation: Promise<C> }>,
  ): Promise<C> => {
    const confirmed = await (await write).confirmation;
    const step = {
      label,
      txHash: confirmed.txHash,
      explorerUrl: confirmed.explorerUrl,
      gasUsed: confirmed.gasUsed,
    };
    steps.push(step);
    onStep(step);
    return confirmed;
  };

  await run(
    "Let the card network mint tUSD",
    client.setMinter({ account: client.networkAddress, allowed: true }),
  );

  for (const bank of plan.banks) {
    const member = plan.members[bank.role];
    await run(
      `Link ${bank.bankName} ••${bank.last4} for ${member.name}`,
      client.linkBankAccount({ userId: member.id, bankName: bank.bankName, last4: bank.last4 }),
    );
    await run(
      `Deposit ${usd(bank.deposit)} for ${member.name}`,
      client.bankDeposit({ userId: member.id, amount: bank.deposit }),
    );
  }

  const bucketIds: Record<string, bigint> = {};
  for (const bucket of plan.buckets) {
    const created = await run(
      `Create ${bucket.name} (limit ${usd(bucket.perTxLimit)}, approval over ${usd(bucket.approvalThreshold)})`,
      client.createBucket({
        name: bucket.name,
        perTxLimit: bucket.perTxLimit,
        approvalThreshold: bucket.approvalThreshold,
      }),
    );
    const bucketId = created.ids.bucketId;
    bucketIds[bucket.name] = bucketId;
    const funder = plan.members[bucket.fundedBy];
    await run(
      `${funder.name} funds ${bucket.name} with ${usd(bucket.amount)}`,
      client.fundBucket({ funderId: funder.id, bucketId, amount: bucket.amount }),
    );
  }

  for (const category of plan.blockedCategories) {
    await run(`Block ${category}`, client.setBlockedCategory({ category, blocked: true }));
  }

  for (const merchant of plan.merchants) {
    await run(
      `Register ${merchant.name} (MCC ${merchant.mcc}, ${merchant.category})`,
      client.registerMerchant({
        merchantId: merchant.id,
        name: merchant.name,
        mcc: merchant.mcc,
        category: merchant.category,
        payoutAddress: merchant.payoutAddress,
      }),
    );
  }

  const dependent = plan.members.dependent;
  const issued = await run(
    `Issue ${dependent.name}'s card ••${plan.card.last4}`,
    client.issueCard({ dependentId: dependent.id, ...plan.card }),
  );
  const cardId = issued.ids.cardId;
  await run(`Activate card ${cardId}`, client.activateCard({ cardId }));

  return { bucketIds, cardId, steps };
}

// --- Read-back ---

export interface ReadBack {
  /** Comparisons that matched. */
  passed: number;
  /** Comparisons that did not, as "what: got X, expected Y". */
  problems: string[];
  /** A short human summary of what the chain now holds. */
  summary: string[];
}

/** Reads the seeded state back from the chain and compares it with the plan. */
export async function readBackDemoFamily(
  client: ChainClient,
  plan: DemoFamilyPlan,
  seeded: SeededFamily,
): Promise<ReadBack> {
  let passed = 0;
  const problems: string[] = [];
  const check = (what: string, actual: unknown, expected: unknown) => {
    if (String(actual) === String(expected)) passed += 1;
    else problems.push(`${what}: got ${String(actual)}, expected ${String(expected)}`);
  };
  const summary: string[] = [];

  const balances = expectedBankBalances(plan);
  const balanceText: string[] = [];
  for (const role of MEMBER_ROLES) {
    const member = plan.members[role];
    const balance = await client.getBankBalance(member.id);
    check(`${member.name}'s bank balance`, balance, balances[role]);
    if (role !== "dependent") balanceText.push(`${member.name} ${usd(balance)}`);
  }
  summary.push(`Bank balances: ${balanceText.join(", ")}`);

  const totalDeposits = plan.banks.reduce((sum, bank) => sum + bank.deposit, 0n);
  check("tUSD held by the card network", await client.getTusdBalance(client.networkAddress), totalDeposits);

  for (const expected of plan.buckets) {
    const bucketId = seeded.bucketIds[expected.name];
    const bucket = await client.getBucket(bucketId!);
    const what = `Bucket ${bucketId} (${expected.name})`;
    check(`${expected.name}'s chain bucket ID`, bucketId, DEMO_BUCKET_CHAIN_IDS[expected.name]);
    check(`${what} name`, bucket.name, expected.name);
    check(`${what} available`, bucket.available, expected.amount);
    check(`${what} per-purchase limit`, bucket.perTxLimit, expected.perTxLimit);
    check(`${what} approval threshold`, bucket.approvalThreshold, expected.approvalThreshold);
    check(`${what} held`, bucket.held, 0n);
    check(`${what} spent`, bucket.spent, 0n);
    summary.push(
      `Bucket ${bucketId} ${bucket.name}: ${usd(bucket.available)} available, limit ${usd(bucket.perTxLimit)}, approval over ${usd(bucket.approvalThreshold)}, funded by ${plan.members[expected.fundedBy].name}`,
    );
  }

  for (const category of plan.blockedCategories) {
    check(`Category ${category} blocked`, await client.isCategoryBlocked(category), true);
  }
  const blocked = new Set(plan.blockedCategories);
  for (const merchant of plan.merchants) {
    const onChain = await client.getMerchant(merchant.id);
    check(`${merchant.name} name`, onChain.name, merchant.name);
    check(`${merchant.name} MCC`, onChain.mcc, merchant.mcc);
    check(`${merchant.name} category`, onChain.category, merchant.category);
    check(`${merchant.name} payout address`, onChain.payoutAddress, merchant.payoutAddress);
    if (!blocked.has(merchant.category)) {
      check(`Category ${merchant.category} not blocked`, await client.isCategoryBlocked(merchant.category), false);
    }
  }
  summary.push(`Blocked categories: ${plan.blockedCategories.join(", ")}`);
  summary.push(
    `Merchants: ${plan.merchants.map((m) => `${m.name} ${m.mcc} ${m.category}`).join(" · ")}`,
  );

  const card = await client.getCard(seeded.cardId);
  const dependent = plan.members.dependent;
  check(`Card ${seeded.cardId} holder`, card.dependentId, dependent.id);
  check(`Card ${seeded.cardId} last four`, card.last4, plan.card.last4);
  check(`Card ${seeded.cardId} expiry month`, card.expiryMonth, plan.card.expiryMonth);
  check(`Card ${seeded.cardId} expiry year`, card.expiryYear, plan.card.expiryYear);
  check(`Card ${seeded.cardId} status`, card.status, "active");
  const expiry = `${String(card.expiryMonth).padStart(2, "0")}/${card.expiryYear}`;
  summary.push(`Card ${seeded.cardId}: ${dependent.name} ••${card.last4}, expires ${expiry}, ${card.status}`);

  const counts = await client.getCounts();
  check("Bucket count", counts.buckets, plan.buckets.length);
  check("Contribution count", counts.contributions, plan.buckets.length);
  check("Card count", counts.cards, 1);
  check("Authorization count", counts.authorizations, 0);
  summary.push(`Authorizations: ${counts.authorizations}`);

  return { passed, problems, summary };
}
