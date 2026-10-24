import { execFileSync } from "node:child_process";
import path from "node:path";
import { eq, min, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase, type Database } from "@workspace/db";
import {
  authorizationsTable,
  bankAccountsTable,
  bankDepositsTable,
  bucketsTable,
  cardsTable,
  contributionsTable,
  familiesTable,
  membersTable,
  merchantsTable,
  policiesTable,
} from "@workspace/db/schema";
import { BRAND } from "@brand/brand.config";
import { seedSpendingDemo } from "../src/services/decisions";
import {
  GetCardAndPolicyResponse,
  GetDependentWalletResponse,
  GetParentOverviewResponse,
  ListActivityResponse,
} from "@workspace/api-zod";
import {
  getActivity,
  getCardAndPolicy,
  getDependentWallet,
  getParentOverview,
  seedDemoFamily,
} from "../src/services/family";

/**
 * Seeds a throwaway copy of the database (`<dev db>_seed_test`), never the
 * development data, the way the server does at start: the family first, then
 * the decision engine's merchants, policy, card and history. The schema is
 * pushed fresh each run, so a schema change that breaks seeding fails here.
 */
const workspaceRoot = path.resolve(import.meta.dirname, "../../..");
const devUrl = process.env.DATABASE_URL;
if (!devUrl) throw new Error("DATABASE_URL must be set to run the seed tests");

const testUrl = new URL(devUrl);
const testDbName = `${testUrl.pathname.slice(1)}_seed_test`;
testUrl.pathname = `/${testDbName}`;

let conn: ReturnType<typeof createDatabase> | undefined;
let db: Database;

/** Both seeds, in the order the server runs them. */
async function seedAll() {
  const family = await seedDemoFamily(db);
  await seedSpendingDemo(db);
  return family;
}

/** Runs a statement on the development server's default database (create/drop only). */
async function adminQuery(text: string) {
  const admin = createDatabase(devUrl!);
  try {
    await admin.pool.query(text);
  } finally {
    await admin.pool.end();
  }
}

async function countRows() {
  const tables = {
    families: familiesTable,
    members: membersTable,
    banks: bankAccountsTable,
    deposits: bankDepositsTable,
    buckets: bucketsTable,
    contributions: contributionsTable,
    cards: cardsTable,
    merchants: merchantsTable,
    policies: policiesTable,
    authorizations: authorizationsTable,
  };
  const counts: Record<string, number> = {};
  for (const [name, table] of Object.entries(tables)) {
    const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(table);
    counts[name] = row!.n;
  }
  return counts;
}

beforeAll(async () => {
  const quoted = `"${testDbName.replace(/"/g, '""')}"`;
  await adminQuery(`DROP DATABASE IF EXISTS ${quoted} WITH (FORCE)`);
  await adminQuery(`CREATE DATABASE ${quoted}`);
  execFileSync("pnpm", ["--filter", "@workspace/db", "run", "push-force"], {
    cwd: workspaceRoot,
    env: { ...process.env, DATABASE_URL: testUrl.toString() },
    stdio: "pipe",
  });
  conn = createDatabase(testUrl.toString());
  db = conn.db;
}, 180_000);

afterAll(async () => {
  await conn?.pool.end();
  const quoted = `"${testDbName.replace(/"/g, '""')}"`;
  await adminQuery(`DROP DATABASE IF EXISTS ${quoted} WITH (FORCE)`);
});

describe("demo family seeding", () => {
  it("creates the family once, then never duplicates it", async () => {
    const first = await seedAll();
    expect(first.created).toBe(true);
    const before = await countRows();

    const second = await seedAll();
    expect(second).toEqual({ familyId: first.familyId, created: false });

    const concurrent = await Promise.all([seedAll(), seedAll()]);
    expect(concurrent.every((r) => !r.created && r.familyId === first.familyId)).toBe(true);
    expect(await countRows()).toEqual(before);
    expect(before.families).toBe(1);
  });

  it("seeds the people, banks and card from BRAND.demo", async () => {
    const members = await db.select().from(membersTable);
    expect(members.map((m) => m.displayName).sort()).toEqual(
      [BRAND.demo.parent, ...BRAND.demo.funders, BRAND.demo.dependent].sort(),
    );
    expect(members.every((m) => m.onboardingComplete)).toBe(true);
    const dependent = members.find((m) => m.role === "dependent");
    expect(dependent?.age).toBe(BRAND.demo.dependentAge);

    const banks = await db.select().from(bankAccountsTable);
    expect(banks.length).toBeGreaterThanOrEqual(3);
    expect(banks.every((b) => (BRAND.demo.banks as readonly string[]).includes(b.bankName))).toBe(true);

    const [card] = await db.select().from(cardsTable);
    expect(card?.last4).toBe(BRAND.demo.cardLast4);
    expect(card?.status).toBe("active");
  });

  it("seeds the agreed bucket limits, merchants and blocked categories", async () => {
    const buckets = await db.select().from(bucketsTable);
    const byName = Object.fromEntries(buckets.map((b) => [b.name, b]));
    expect(Object.keys(byName).sort()).toEqual(["Food", "School", "Social", "Transit"]);
    // The spec's values as written: Food's $60 limit stays below its $75
    // threshold (docs/plans/demo-preset-swipes.md).
    expect(byName.Food).toMatchObject({ perPurchaseLimitCents: 6000, approvalThresholdCents: 7500 });
    expect(byName.School).toMatchObject({ perPurchaseLimitCents: 15000, approvalThresholdCents: 10000 });
    expect(byName.Social).toMatchObject({ perPurchaseLimitCents: 4000, approvalThresholdCents: 3000 });
    // Added so a parent-approved 2:10am Uber ride has a bucket to pay from.
    expect(byName.Transit).toMatchObject({ perPurchaseLimitCents: 4000, approvalThresholdCents: 3000 });

    expect(byName.Food).toMatchObject({ purpose: "Groceries and meals out", icon: "food" });
    expect(byName.Transit).toMatchObject({ icon: "transit" });

    const [policy] = await db.select().from(policiesTable);
    expect([...policy!.blockedCategories].sort()).toEqual(["bar", "gambling", "gaming", "liquor", "nightclub"]);
    // The late-night window that sends the 2:10am Uber preset to a parent.
    expect(policy!.timeWindows).toEqual([{ start: "23:00", end: "06:00" }]);

    const merchants = await db.select().from(merchantsTable);
    expect(Object.fromEntries(merchants.map((m) => [m.name, [m.mcc, m.category]]))).toEqual({
      "Trader Joe's": ["5411", "grocery"],
      "Campus Bookstore": ["5942", "bookstore"],
      "The Tipsy Tavern": ["5813", "bar"],
      "Liquor Barn": ["5921", "liquor"],
      "Lucky Star Casino": ["7995", "gambling"],
      Steam: ["5816", "gaming"],
      Uber: ["4121", "rideshare"],
      "Apple Store": ["5732", "electronics"],
      AMC: ["7832", "movies"],
    });
  });

  it("keeps every bucket balance in agreement with its contributions and approved swipes", async () => {
    const buckets = await db.select().from(bucketsTable);
    const funded = { Food: 15000, School: 20000, Social: 6000, Transit: 5000 } as Record<string, number>;
    for (const b of buckets) {
      const [contrib] = await db
        .select({ total: sql<number>`coalesce(sum(${contributionsTable.amountCents}), 0)::int` })
        .from(contributionsTable)
        .where(eq(contributionsTable.bucketId, b.id));
      const [settled] = await db
        .select({ total: sql<number>`coalesce(sum(${authorizationsTable.amountCents}), 0)::int` })
        .from(authorizationsTable)
        .where(sql`${authorizationsTable.bucketId} = ${b.id} and ${authorizationsTable.decision} = 'APPROVED' and ${authorizationsTable.settledAt} is not null`);
      expect(contrib!.total, `${b.name} funding`).toBe(funded[b.name]);
      expect(b.spentCents, `${b.name} spent`).toBe(settled!.total);
      expect(b.availableCents + b.heldCents + b.spentCents, `${b.name} balance`).toBe(contrib!.total);
      expect(b.availableCents, `${b.name} available`).toBeGreaterThanOrEqual(0);
    }
  });

  it("dates the funding before the purchase history", async () => {
    const [funding] = await db.select({ latest: sql<Date>`max(${contributionsTable.createdAt})` }).from(contributionsTable);
    const [history] = await db.select({ earliest: min(authorizationsTable.swipedAt) }).from(authorizationsTable);
    expect(new Date(funding!.latest).getTime()).toBeLessThan(history!.earliest!.getTime());
  });

  it("records the approval chain and leaves on-chain fields empty", async () => {
    const swipes = await db.select().from(authorizationsTable);
    expect(swipes.length).toBeGreaterThanOrEqual(7);
    expect(new Set(swipes.map((a) => a.decision))).toEqual(new Set(["APPROVED", "REJECTED", "PENDING"]));

    const asked = swipes.find((a) => a.status === "parent_approved");
    expect(asked?.resolvedByMemberId).not.toBeNull();
    const retry = swipes.find((a) => a.previousAuthorizationId === asked?.id);
    expect(retry?.decision).toBe("APPROVED");
    expect(retry?.settledAt).not.toBeNull();

    expect(swipes.every((a) => a.chainStatus === "not_submitted" && a.chainTxHash === null)).toBe(true);
  });

  it("feeds every screen read with contract-valid data from the seeded family", async () => {
    const [family] = await db.select().from(familiesTable);
    const id = family!.id;

    const overview = GetParentOverviewResponse.parse(await getParentOverview(id, new Date(), db));
    expect(overview.parentName).toBe(BRAND.demo.parent);
    expect(overview.buckets.map((b) => b.name)).toEqual(["Food", "School", "Social", "Transit"]);
    expect(overview.potTotalCents).toBe(overview.buckets.reduce((sum, b) => sum + b.availableCents + b.heldCents, 0));

    const activity = ListActivityResponse.parse(await getActivity(id, db));
    expect(activity.filter((a) => a.kind === "contribution")).toHaveLength(4);
    // The parent-approved original is folded into its retry's row.
    const chained = activity.filter((a) => a.timeline.length > 0);
    expect(chained).toHaveLength(1);
    expect(chained[0]!.decision).toBe("APPROVED");
    expect(chained[0]!.summary).toContain(`after ${BRAND.demo.parent} said yes`);
    const times = activity.map((a) => a.occurredAt.getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));

    const cardPolicy = GetCardAndPolicyResponse.parse(await getCardAndPolicy(id, db));
    expect(cardPolicy.card.last4).toBe(BRAND.demo.cardLast4);
    expect(cardPolicy.card.dependentName).toBe(BRAND.demo.dependent);
    expect(cardPolicy.blockedCategories.map((c) => c.label)).toContain("Liquor stores");
    expect(cardPolicy.policy.lines.some((l) => l.kind === "time")).toBe(true);

    const wallet = GetDependentWalletResponse.parse(await getDependentWallet(id, new Date(), db));
    expect(wallet.totalAvailableCents).toBe(wallet.buckets.reduce((sum, b) => sum + b.availableCents, 0));
  });
});
