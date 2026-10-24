import { asc, eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  usersTable,
  authorizationsTable,
  chainEventsTable,
  bankAccountsTable,
  bucketsTable,
  cardsTable,
  contributionsTable,
  db,
  familiesTable,
  membersTable,
  merchantsTable,
  pool,
  settlementsTable,
  temporaryPassesTable,
} from "@workspace/db";
import { BRAND } from "@brand/brand.config";
import {
  processSwipe,
  runSettlement,
  seedSpendingDemo,
  setCardFrozen,
} from "../../src/services/decisions";
import { zonedParts } from "../../src/services/decisions/clock";
import { DEMO_TIME_ZONE } from "../../src/services/decisions";
import { resetDemo } from "../../src/services/demo";
import {
  FamilyServiceError,
  getActivity,
  getDemoFamily,
  getParentOverview,
  seedDemoFamily,
  sendMoneyToBucket,
} from "../../src/services/family";
import { resetTestDatabase } from "./test-database";

/**
 * The presenter's "Reset demo" against the test database: the seed starts
 * where the demo script starts (nothing held, no $18.40 groceries, nothing
 * from today), a reset after a full run returns exactly that state, and
 * running the script again gives the same numbers every time.
 */

// Database only; never send anything to the chain.
vi.mock("../../src/services/decisions/chain-handoff", () => ({
  handOffToChain: vi.fn(async () => ({ status: "skipped", why: "test" })),
  captureOnChain: vi.fn(async () => ({ status: "skipped", why: "test" })),
  waitForAuthorize: vi.fn(async () => {}),
}));

const NO_GUARD = { aiGuard: null } as const;
/** The signed-in presenter (no member is linked to an account by the seed). */
const PRESENTER = "presenter-account";
/** One fixed moment for every seed and reset, so dated rows compare equal. */
const NOW = new Date("2026-10-24T19:00:00Z");

async function memberByRole(role: "parent" | "funder" | "dependent", relationship?: string) {
  const rows = await db.select().from(membersTable).where(eq(membersTable.role, role));
  const member = relationship ? rows.find((m) => m.relationship === relationship) : rows[0];
  if (!member) throw new Error(`No ${relationship ?? role} in the demo family`);
  return member;
}

/** Drops every `id` key, since row ids change on every reset. */
function withoutIds<T>(value: T): T {
  if (Array.isArray(value)) return value.map(withoutIds) as T;
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value).filter(([key]) => key !== "id").map(([key, v]) => [key, withoutIds(v)]),
    ) as T;
  }
  return value;
}

/** What the screens show, without row ids (they change on every reset). */
async function screenState() {
  const family = await getDemoFamily(db);
  const overview = await getParentOverview(family.id, NOW, db);
  const activity = await getActivity(family.id, db);
  const banks = await db
    .select({
      member: membersTable.displayName,
      bankName: bankAccountsTable.bankName,
      last4: bankAccountsTable.last4,
      balanceCents: bankAccountsTable.balanceCents,
    })
    .from(bankAccountsTable)
    .innerJoin(membersTable, eq(membersTable.id, bankAccountsTable.memberId))
    .orderBy(asc(membersTable.displayName));
  const [card] = await db.select().from(cardsTable);
  const { latestSettlementId: _latest, ...overviewNumbers } = overview;
  return {
    overview: withoutIds(overviewNumbers),
    banks,
    card: { last4: card!.last4, status: card!.status },
    activity: activity.map((a) => ({
      kind: a.kind,
      summary: a.summary,
      amountCents: a.amountCents,
      decision: a.decision,
      bucketName: a.bucketName,
      settlement: a.settlement,
    })),
  };
}

async function counts() {
  const tables = {
    families: familiesTable,
    contributions: contributionsTable,
    authorizations: authorizationsTable,
    settlements: settlementsTable,
    passes: temporaryPassesTable,
    merchants: merchantsTable,
  };
  const out: Record<string, number> = {};
  for (const [name, table] of Object.entries(tables)) {
    const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(table);
    out[name] = row!.n;
  }
  return out;
}

/**
 * The three-step script: the grandparent sends $50 to Food, the dependent buys
 * $18.40 of groceries (held), and the parent runs settlement. Then a few
 * things a rehearsal might also leave behind: a pending purchase and a
 * frozen card. Returns what the screens show right after settlement.
 */
async function runScript() {
  const grandparent = await memberByRole("funder", "grandparent");
  const dependent = await memberByRole("dependent");
  const [bank] = await db.select().from(bankAccountsTable).where(eq(bankAccountsTable.memberId, grandparent.id));
  const [food] = await db.select().from(bucketsTable).where(eq(bucketsTable.name, "Food"));
  const [card] = await db.select().from(cardsTable);
  const merchants = new Map((await db.select().from(merchantsTable)).map((m) => [m.slug, m]));
  const swipe = (slug: string, amount: number) => {
    const m = merchants.get(slug)!;
    return {
      cardId: card!.id,
      dependentId: dependent.id,
      merchantId: m.id,
      merchantName: m.name,
      mcc: m.mcc,
      merchantCategory: m.category,
      items: ["groceries"],
      amount,
      location: "Westwood, Los Angeles",
      timestamp: "2026-10-24T12:30:00",
    };
  };

  await sendMoneyToBucket(
    { memberId: grandparent.id, bankAccountId: bank!.id, bucketId: food!.id, amountCents: 50_00 },
    db,
  );
  const { authorization } = await processSwipe(swipe("trader-joes", 18_40), NO_GUARD);
  expect(authorization.decision).toBe("APPROVED");
  await runSettlement();
  const afterScript = await screenState();

  const pending = await processSwipe(swipe("apple-store", 129_00), NO_GUARD);
  expect(pending.authorization.decision).toBe("PENDING");
  await setCardFrozen(true);
  return afterScript;
}

let initial: Awaited<ReturnType<typeof screenState>>;
let initialCounts: Record<string, number>;

beforeAll(async () => {
  await resetTestDatabase();
  await seedDemoFamily(db, NOW);
  await seedSpendingDemo(db, NOW);
  initial = await screenState();
  initialCounts = await counts();
});

afterAll(() => pool.end());

describe("the seed starts where the demo script starts", () => {
  it("has nothing held, no $18.40 groceries and nothing from today", async () => {
    expect(initial.overview.heldPurchasesCount).toBe(0);
    expect(initial.overview.heldTotalCents).toBe(0);
    expect(initial.overview.pendingApprovalsCount).toBe(0);

    const swipes = await db.select().from(authorizationsTable);
    expect(swipes.some((a) => a.amountCents === 18_40)).toBe(false);

    const today = zonedParts(NOW, DEMO_TIME_ZONE);
    const isToday = (d: Date) => {
      const p = zonedParts(d, DEMO_TIME_ZONE);
      return p.year === today.year && p.month === today.month && p.day === today.day;
    };
    expect(swipes.some((a) => isToday(a.swipedAt))).toBe(false);
    const contributions = await db.select().from(contributionsTable);
    expect(contributions.some((c) => isToday(c.createdAt))).toBe(false);
  });

  it("still looks lived-in, with Food at $118.75", () => {
    const food = initial.overview.buckets.find((b) => b.name === "Food");
    expect(food?.availableCents).toBe(118_75);
    expect(initial.activity.filter((a) => a.kind === "purchase").length).toBeGreaterThanOrEqual(6);
    expect(initial.activity.filter((a) => a.kind === "contribution")).toHaveLength(4);
  });

  it("fixes each seeded bank's last four digits", () => {
    expect(new Set(initial.banks.map((b) => b.last4)).size).toBe(3);
    expect(initial.banks.every((b) => /^[0-9]{4}$/.test(b.last4))).toBe(true);
  });
});

describe("resetting the demo", () => {
  let firstRun: Awaited<ReturnType<typeof screenState>>;

  it("only a parent can reset", async () => {
    const grandparent = await memberByRole("funder", "grandparent");
    const attempt = resetDemo({ memberId: grandparent.id, actingUserId: PRESENTER }, db, NOW);
    await expect(attempt).rejects.toBeInstanceOf(FamilyServiceError);
    await expect(resetDemo({ memberId: grandparent.id, actingUserId: PRESENTER }, db, NOW)).rejects.toMatchObject({
      kind: "forbidden",
      message: "Only a parent can reset the demo.",
    });
    expect(await screenState()).toEqual(initial);
  });

  it("returns a full run to the seeded state", async () => {
    firstRun = await runScript();
    expect(await counts()).not.toEqual(initialCounts);
    // A receipt from the run, as the chain mirror would have stored it.
    const [ranSwipe] = await db.select().from(authorizationsTable).orderBy(asc(authorizationsTable.id));
    await db.insert(chainEventsTable).values({
      eventName: "Authorized",
      contractAddress: `0x${"a".repeat(40)}`,
      txHash: `0x${"b".repeat(64)}`,
      blockNumber: 1,
      logIndex: 0,
      args: {},
      ownerTable: "authorizations",
      ownerId: ranSwipe!.id,
    });

    const parent = await memberByRole("parent");
    const result = await resetDemo({ memberId: parent.id, actingUserId: PRESENTER }, db, NOW);
    expect(result.historyAdded).toBeGreaterThan(0);

    expect(await counts()).toEqual(initialCounts);
    expect(await screenState()).toEqual(initial);
    const [family] = await db.select().from(familiesTable);
    expect(family!.id).toBe(result.familyId);
    // Fresh rows carry no chain records, so no old explorer links show.
    const swipes = await db.select().from(authorizationsTable);
    expect(swipes.every((a) => a.chainStatus === "not_submitted" && a.chainTxHash === null)).toBe(true);
    // The receipt log is kept as the record of what's on chain, and no fresh
    // row reuses the old id it points at.
    const receipts = await db.select().from(chainEventsTable);
    expect(receipts).toHaveLength(1);
    expect(swipes.some((a) => a.id === receipts[0]!.ownerId)).toBe(false);
  });

  it("gives the same numbers when the script runs again", async () => {
    const secondRun = await runScript();
    expect(secondRun).toEqual(firstRun);

    const parent = await memberByRole("parent");
    await resetDemo({ memberId: parent.id, actingUserId: PRESENTER }, db, NOW);
    expect(await screenState()).toEqual(initial);
  });

  it("keeps account links, and a parent linked to another account can't be used to reset", async () => {
    await db.insert(usersTable).values([{ id: "parent-account" }, { id: "other-account" }]).onConflictDoNothing();
    const parent = await memberByRole("parent");
    await db.update(membersTable).set({ userId: "parent-account" }).where(eq(membersTable.id, parent.id));

    await expect(
      resetDemo({ memberId: parent.id, actingUserId: "other-account" }, db, NOW),
    ).rejects.toMatchObject({ kind: "forbidden", message: `Only ${parent.displayName} can answer as ${parent.displayName}.` });

    await resetDemo({ memberId: parent.id, actingUserId: "parent-account" }, db, NOW);
    const fresh = await memberByRole("parent");
    expect(fresh.id).not.toBe(parent.id);
    expect(fresh.userId).toBe("parent-account");
    expect(await screenState()).toEqual(initial);
  });
});
