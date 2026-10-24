import { BRAND } from "@brand/brand.config";
import { memberChainId } from "@workspace/chain";
import { inArray, sql } from "drizzle-orm";
import {
  bankAccountsTable,
  bankDepositsTable,
  bucketsTable,
  contributionsTable,
  db,
  familiesTable,
  membersTable,
  type DbExecutor,
  type Member,
} from "@workspace/db";
import { depositToBank, linkBankAccount } from "./banks";
import { contributeToBucket } from "./contributions";
import {
  SEED_BANK_LAST4,
  SEED_BUCKETS,
  SEED_CONTRIBUTION_AGO_MS,
  SEED_DEPOSIT_AGO_MS,
} from "./seed-data";

/**
 * Fixed 32-byte contract id (bytes32) for a seeded member, derived from a
 * stable key so it is the same after every demo reset. The shared chain
 * library derives it, so the deploy seed produces the same ids.
 */
export function memberOnchainId(seedKey: string): string {
  return memberChainId(seedKey);
}

/** Arbitrary constant for the advisory lock that serializes seeding. */
const SEED_LOCK_KEY = 72_001;

/**
 * Takes the family seed's transaction-scoped lock, so a demo reset and a
 * seed (or two resets) never interleave. Held until the transaction ends.
 */
export async function lockDemoSeed(tx: DbExecutor): Promise<void> {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(${SEED_LOCK_KEY})`);
}

type SeedMemberKey = "parent" | "grandparent" | "coParent" | "dependent";

/** Amounts in cents. Names come from BRAND.demo; buckets are in ./seed-data. */
const SEED_DEPOSITS: Record<Exclude<SeedMemberKey, "dependent">, number> = {
  parent: 500_00,
  grandparent: 250_00,
  coParent: 250_00,
};

function seedPlan() {
  const { demo } = BRAND;
  if (demo.funders.length < 2) {
    throw new Error(
      "BRAND.demo.funders needs two names (grandparent, then co-parent) to seed the demo family.",
    );
  }
  if (demo.banks.length < 3) {
    throw new Error(
      "BRAND.demo.banks needs three banks so the parent and both funders each link a different one.",
    );
  }
  const [grandparentName, coParentName] = demo.funders as [string, string];
  const [parentBank, grandparentBank, coParentBank] = demo.banks as [
    string,
    string,
    string,
  ];

  const members: Record<
    SeedMemberKey,
    Pick<Member, "displayName" | "role" | "relationship" | "age"> & {
      seedKey: string;
    }
  > = {
    parent: {
      displayName: demo.parent,
      role: "parent",
      relationship: "parent",
      age: null,
      seedKey: "parent",
    },
    grandparent: {
      displayName: grandparentName,
      role: "funder",
      relationship: "grandparent",
      age: null,
      seedKey: "grandparent",
    },
    coParent: {
      displayName: coParentName,
      role: "funder",
      relationship: "co-parent",
      age: null,
      seedKey: "co-parent",
    },
    dependent: {
      displayName: demo.dependent,
      role: "dependent",
      relationship: "student",
      age: demo.dependentAge,
      seedKey: "dependent",
    },
  };
  const banks: Record<Exclude<SeedMemberKey, "dependent">, string> = {
    parent: parentBank,
    grandparent: grandparentBank,
    coParent: coParentBank,
  };
  return { familyName: demo.familyName, members, banks };
}

export type SeedResult =
  { created: false; familyId: number } | { created: true; familyId: number };

/**
 * Creates the demo family from BRAND.demo when none exists. Idempotent: a
 * transaction-scoped advisory lock serializes concurrent callers, and an
 * existing family means nothing is written. Money moves through the same
 * services as the API, so every balance equals deposits minus contributions.
 * The funding is dated a few days before `now`, so the purchase history the
 * decision engine seeds afterwards (`seedSpendingDemo`) reads in order.
 * The demo reset (services/demo) reuses it after clearing the family.
 */
export async function seedDemoFamily(
  executor: DbExecutor = db,
  now: Date = new Date(),
): Promise<SeedResult> {
  const plan = seedPlan();
  const at = (agoMs: number) => new Date(now.getTime() - agoMs);

  return executor.transaction(async (tx) => {
    await lockDemoSeed(tx);

    const [existing] = await tx
      .select({ id: familiesTable.id })
      .from(familiesTable)
      .limit(1);
    if (existing) return { created: false, familyId: existing.id };

    const [family] = await tx
      .insert(familiesTable)
      .values({ name: plan.familyName })
      .returning();

    const memberIds = {} as Record<SeedMemberKey, number>;
    for (const key of Object.keys(plan.members) as SeedMemberKey[]) {
      const { seedKey, ...member } = plan.members[key];
      const [row] = await tx
        .insert(membersTable)
        .values({
          ...member,
          familyId: family!.id,
          onboardingComplete: true,
          onchainId: memberOnchainId(seedKey),
        })
        .returning({ id: membersTable.id });
      memberIds[key] = row!.id;
    }

    const bankIds = {} as Record<keyof typeof plan.banks, number>;
    for (const key of Object.keys(plan.banks) as (keyof typeof plan.banks)[]) {
      const account = await linkBankAccount(
        {
          memberId: memberIds[key],
          bankName: plan.banks[key],
          last4: SEED_BANK_LAST4[key],
        },
        tx,
      );
      await depositToBank(
        { bankAccountId: account.id, amountCents: SEED_DEPOSITS[key] },
        tx,
      );
      bankIds[key] = account.id;
    }

    for (const bucket of SEED_BUCKETS) {
      const [row] = await tx
        .insert(bucketsTable)
        .values({
          familyId: family!.id,
          name: bucket.name,
          purpose: bucket.purpose,
          icon: bucket.icon,
          perPurchaseLimitCents: bucket.perPurchaseLimitCents,
          approvalThresholdCents: bucket.approvalThresholdCents,
        })
        .returning({ id: bucketsTable.id });
      await contributeToBucket(
        {
          bucketId: row!.id,
          memberId: memberIds[bucket.fundedBy],
          bankAccountId: bankIds[bucket.fundedBy],
          amountCents: bucket.amountCents,
        },
        tx,
      );
    }

    // Date the funding a few days back so the history reads in order.
    const bankIdList = Object.values(bankIds);
    await tx
      .update(bankDepositsTable)
      .set({ createdAt: at(SEED_DEPOSIT_AGO_MS) })
      .where(inArray(bankDepositsTable.bankAccountId, bankIdList));
    await tx
      .update(bankAccountsTable)
      .set({ createdAt: at(SEED_DEPOSIT_AGO_MS) })
      .where(inArray(bankAccountsTable.id, bankIdList));
    await tx
      .update(contributionsTable)
      .set({ createdAt: at(SEED_CONTRIBUTION_AGO_MS) })
      .where(inArray(contributionsTable.bankAccountId, bankIdList));

    return { created: true, familyId: family!.id };
  });
}
