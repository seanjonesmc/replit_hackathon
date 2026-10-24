import { execFileSync } from "node:child_process";
import path from "node:path";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ChainClient, WriteConfirmation } from "@workspace/chain";
import { createDatabase, type Database } from "@workspace/db";
import {
  bankAccountsTable,
  bankDepositsTable,
  bucketsTable,
  chainEventsTable,
  contributionsTable,
  membersTable,
} from "@workspace/db/schema";
import { BRAND } from "@brand/brand.config";
import { toChainRecord, type BackgroundSubmitDeps } from "../src/services/events";
import {
  getActivity,
  listMemberContributions,
  mirrorSendMoneyOnChain,
  seedDemoFamily,
  sendMoneyToBucket,
} from "../src/services/family";

/**
 * The funder's one-tap send against a throwaway copy of the database
 * (`<dev db>_send_money_test`), never the development data, with a fake chain
 * client standing in for Monad.
 */
const workspaceRoot = path.resolve(import.meta.dirname, "../../..");
const devUrl = process.env.DATABASE_URL;
if (!devUrl) throw new Error("DATABASE_URL must be set to run the send-money tests");

const testUrl = new URL(devUrl);
const testDbName = `${testUrl.pathname.slice(1)}_send_money_test`;
testUrl.pathname = `/${testDbName}`;
const quoted = `"${testDbName.replace(/"/g, '""')}"`;

let conn: ReturnType<typeof createDatabase> | undefined;
let db: Database;

async function adminQuery(text: string) {
  const admin = createDatabase(devUrl!);
  try {
    await admin.pool.query(text);
  } finally {
    await admin.pool.end();
  }
}

beforeAll(async () => {
  await adminQuery(`DROP DATABASE IF EXISTS ${quoted} WITH (FORCE)`);
  await adminQuery(`CREATE DATABASE ${quoted}`);
  execFileSync("pnpm", ["--filter", "@workspace/db", "run", "push-force"], {
    cwd: workspaceRoot,
    env: { ...process.env, DATABASE_URL: testUrl.toString() },
    stdio: "pipe",
  });
  conn = createDatabase(testUrl.toString());
  db = conn.db;
  await seedDemoFamily(db);
}, 180_000);

afterAll(async () => {
  await conn?.pool.end();
  await adminQuery(`DROP DATABASE IF EXISTS ${quoted} WITH (FORCE)`);
});

const grandparentName = BRAND.demo.funders[0]!;

async function grandparent() {
  const [member] = await db
    .select()
    .from(membersTable)
    .where(eq(membersTable.relationship, "grandparent"));
  const [bank] = await db
    .select()
    .from(bankAccountsTable)
    .where(eq(bankAccountsTable.memberId, member!.id));
  const [food] = await db.select().from(bucketsTable).where(eq(bucketsTable.name, "Food"));
  return { member: member!, bank: bank!, food: food! };
}

// ---- A fake chain client ----------------------------------------------------

const ADDRESS = "0x0b7d36cdb2af14db03ae947bb845d8bdf4aa9e17";
let txCounter = 0;
const nextHash = () => `0x${(++txCounter).toString(16).padStart(64, "0")}`;

function confirmation(method: string, txHash: string, eventName: string, args: Record<string, string>): WriteConfirmation<object> {
  return {
    method,
    txHash,
    explorerUrl: `https://explorer.example/tx/${txHash}`,
    blockNumber: 100 + txCounter,
    confirmedAt: new Date("2026-10-24T18:00:00Z"),
    confirmationMs: 900,
    gasUsed: 1n,
    ids: {},
    events: [{ eventName, contractAddress: ADDRESS, txHash, blockNumber: 100 + txCounter, logIndex: 0, args }],
  };
}

interface FakeOptions {
  failDeposit?: boolean;
}

function fakeChain(options: FakeOptions = {}) {
  const calls: string[] = [];
  const client = {
    getCounts: async () => ({ buckets: 3n, contributions: 3n, cards: 1n, authorizations: 0n }),
    getBucket: async (id: bigint) => ({ name: ["Food", "School", "Social"][Number(id) - 1]! }),
    bankDeposit: async (p: { userId: string; amount: number }) => {
      calls.push(`bankDeposit ${p.userId} ${p.amount}`);
      const txHash = nextHash();
      const done = options.failDeposit
        ? Promise.reject(new Error("execution reverted"))
        : Promise.resolve(confirmation("bankDeposit", txHash, "BankDeposit", { amount: String(p.amount) }));
      done.catch(() => undefined);
      return { txHash, confirmation: done };
    },
    fundBucket: async (p: { funderId: string; bucketId: bigint; amount: number }) => {
      calls.push(`fundBucket ${p.funderId} ${p.bucketId} ${p.amount}`);
      const txHash = nextHash();
      return {
        txHash,
        confirmation: Promise.resolve(
          confirmation("fundBucket", txHash, "BucketFunded", { bucketId: String(p.bucketId), amount: String(p.amount) }),
        ),
      };
    },
  };
  const deps = (configured = true): BackgroundSubmitDeps => ({
    isConfigured: () => configured,
    getClient: () => client as unknown as ChainClient,
    executor: db,
    log: { info: () => undefined, warn: () => undefined, error: () => undefined },
  });
  return { calls, deps };
}

// ---- Tests ------------------------------------------------------------------

describe("sending money to a bucket", () => {
  it("deposits, funds the bucket and tags it with the default note in one step", async () => {
    const { member, bank, food } = await grandparent();
    const result = await sendMoneyToBucket(
      { bucketId: food.id, memberId: member.id, bankAccountId: bank.id, amountCents: 5000, note: "  " },
      db,
    );

    expect(result.deposit.amountCents).toBe(5000);
    expect(result.contribution.note).toBe(`Food, from ${grandparentName}`);
    expect(result.bucket.availableCents).toBe(food.availableCents + 5000);
    // Deposited and moved on: the bank ends where it started.
    expect(result.bankAccount.balanceCents).toBe(bank.balanceCents);
    // Nothing is on chain until the mirror runs.
    expect(toChainRecord(result.contribution)).toEqual({
      status: "not_submitted",
      txHash: null,
      confirmedAt: null,
      explorerUrl: null,
    });

    const activity = await getActivity(member.familyId, db);
    const row = activity.find((a) => a.id === `contribution-${result.contribution.id}`);
    expect(row).toMatchObject({
      summary: `${grandparentName} added $50.00 to Food`,
      detail: `Food, from ${grandparentName}`,
      direction: "in",
    });
  });

  it("keeps the funder's own note", async () => {
    const { member, bank, food } = await grandparent();
    const result = await sendMoneyToBucket(
      { bucketId: food.id, memberId: member.id, bankAccountId: bank.id, amountCents: 1250, note: "Treat yourself" },
      db,
    );
    expect(result.contribution.note).toBe("Treat yourself");
    const { contributions } = await listMemberContributions(member.id, db);
    expect(contributions[0]?.contribution.note).toBe("Treat yourself");
  });

  it("rolls the deposit back when the contribution is refused", async () => {
    const { member, food } = await grandparent();
    const [otherBank] = await db
      .select()
      .from(bankAccountsTable)
      .where(eq(bankAccountsTable.bankName, BRAND.demo.banks[0]!));
    const depositsBefore = await db.select().from(bankDepositsTable);

    await expect(
      sendMoneyToBucket(
        { bucketId: food.id, memberId: member.id, bankAccountId: otherBank!.id, amountCents: 5000 },
        db,
      ),
    ).rejects.toThrow(/isn't one of/);
    await expect(
      sendMoneyToBucket(
        { bucketId: food.id, memberId: member.id, bankAccountId: otherBank!.id, amountCents: 5000, note: "x".repeat(141) },
        db,
      ),
    ).rejects.toThrow();
    expect(await db.select().from(bankDepositsTable)).toHaveLength(depositsBefore.length);
  });
});

describe("mirroring a send on chain", () => {
  async function send() {
    const { member, bank, food } = await grandparent();
    const result = await sendMoneyToBucket(
      { bucketId: food.id, memberId: member.id, bankAccountId: bank.id, amountCents: 5000 },
      db,
    );
    return { ...result, member };
  }

  async function rows(depositId: number, contributionId: number) {
    const [deposit] = await db.select().from(bankDepositsTable).where(eq(bankDepositsTable.id, depositId));
    const [contribution] = await db
      .select()
      .from(contributionsTable)
      .where(eq(contributionsTable.id, contributionId));
    return { deposit: deposit!, contribution: contribution! };
  }

  it("sends the deposit, then funds the on-chain bucket, and confirms both from their receipts", async () => {
    const { deposit, contribution, member } = await send();
    const chain = fakeChain();
    const outcome = await mirrorSendMoneyOnChain(
      { deposit, contribution, bucketName: "Food", funderOnchainId: member.onchainId },
      chain.deps(),
    );

    expect(outcome.deposit.status).toBe("confirmed");
    expect(outcome.contribution.status).toBe("confirmed");
    expect(chain.calls).toEqual([
      `bankDeposit ${member.onchainId} 5000`,
      `fundBucket ${member.onchainId} 1 5000`,
    ]);

    const after = await rows(deposit.id, contribution.id);
    expect(after.deposit.chainStatus).toBe("confirmed");
    expect(after.contribution.chainStatus).toBe("confirmed");
    expect(after.contribution.chainTxHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(toChainRecord(after.contribution).explorerUrl).toMatch(
      new RegExp(`/tx/${after.contribution.chainTxHash}$`),
    );

    const events = await db
      .select()
      .from(chainEventsTable)
      .where(eq(chainEventsTable.txHash, after.contribution.chainTxHash!));
    expect(events).toMatchObject([
      { eventName: "BucketFunded", ownerTable: "contributions", ownerId: contribution.id },
    ]);
  });

  it("marks both rows not on chain when the deposit fails, without sending the funding", async () => {
    const { deposit, contribution, member } = await send();
    const chain = fakeChain({ failDeposit: true });
    const outcome = await mirrorSendMoneyOnChain(
      { deposit, contribution, bucketName: "Food", funderOnchainId: member.onchainId },
      chain.deps(),
    );

    expect(outcome.deposit.status).toBe("failed");
    expect(outcome.contribution.status).toBe("failed");
    expect(chain.calls).toEqual([`bankDeposit ${member.onchainId} 5000`]);
    const after = await rows(deposit.id, contribution.id);
    expect(after.deposit.chainStatus).toBe("failed");
    expect(after.contribution.chainStatus).toBe("failed");
    expect(toChainRecord(after.contribution).explorerUrl).toBeNull();
  });

  it("leaves everything off chain, untouched, when the chain isn't configured", async () => {
    const { deposit, contribution, member } = await send();
    const chain = fakeChain();
    const outcome = await mirrorSendMoneyOnChain(
      { deposit, contribution, bucketName: "Food", funderOnchainId: member.onchainId },
      chain.deps(false),
    );
    expect(outcome.deposit.status).toBe("not_configured");
    expect(chain.calls).toEqual([]);
    const after = await rows(deposit.id, contribution.id);
    expect(after.deposit.chainStatus).toBe("not_submitted");
    expect(after.contribution.chainStatus).toBe("not_submitted");
  });
});
