import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChainClient, WriteConfirmation } from "@workspace/chain";
import {
  authorizationsTable,
  bucketsTable,
  cardsTable,
  chainEventsTable,
  db,
  membersTable,
  merchantsTable,
  pool,
  temporaryPassesTable,
  usersTable,
  type Member,
} from "@workspace/db";
import {
  getAuthorizationThread,
  mirrorParentDecisionOnChain,
  processSwipe,
  resolveApproval,
  seedSpendingDemo,
  type SwipeInput,
} from "../../src/services/decisions";
import type { BackgroundSubmitDeps } from "../../src/services/events";
import { FamilyServiceError, seedDemoFamily } from "../../src/services/family";
import { resetTestDatabase } from "./test-database";

/**
 * A parent's answer to a pending swipe, against the test database: approve
 * grants a single-use pass and re-runs the purchase at once, decline moves
 * nothing, and a request can only be answered once. The AI guard is off, so
 * the rules alone decide; the chain hand-off is a fake.
 */

vi.mock("../../src/services/decisions/chain-handoff", () => ({
  handOffToChain: vi.fn(async () => {}),
}));

const NO_GUARD = { aiGuard: null } as const;
/** The signed-in presenter, not linked to any member (presenter mode). */
const PRESENTER = "presenter-account";

let swipe: (merchant: string, amount: number, time?: string) => SwipeInput;
let parent: Member;
let funder: Member;

beforeEach(async () => {
  await resetTestDatabase();
  await seedDemoFamily();
  await seedSpendingDemo();

  const members = await db.select().from(membersTable);
  const dependent = members.find((m) => m.role === "dependent")!;
  parent = members.find((m) => m.role === "parent")!;
  funder = members.find((m) => m.role === "funder")!;
  const [card] = await db.select().from(cardsTable).where(eq(cardsTable.dependentMemberId, dependent.id));
  const merchants = new Map((await db.select().from(merchantsTable)).map((m) => [m.slug, m]));

  swipe = (slug, amount, time = "14:30") => {
    const merchant = merchants.get(slug);
    if (!merchant) throw new Error(`No seeded merchant "${slug}"`);
    return {
      cardId: card!.id,
      dependentId: dependent.id,
      merchantId: merchant.id,
      merchantName: merchant.name,
      mcc: merchant.mcc,
      merchantCategory: merchant.category,
      items: ["test purchase"],
      amount,
      location: "Test location",
      timestamp: `2026-10-23T${time}:00`,
    };
  };
});

afterAll(() => pool.end());

async function bucket(name: string) {
  const [row] = await db.select().from(bucketsTable).where(eq(bucketsTable.name, name));
  return row!;
}

/** The seed's history already holds one used pass. */
async function passCount() {
  return (await db.select().from(temporaryPassesTable)).length;
}

async function slugOf(name: string) {
  const [m] = await db.select().from(merchantsTable).where(eq(merchantsTable.name, name));
  return m!.slug;
}

async function pendingSwipe(name: string, amount: number, time?: string) {
  const { authorization } = await processSwipe(swipe(await slugOf(name), amount, time), NO_GUARD);
  expect(authorization.decision).toBe("PENDING");
  return authorization;
}

async function expectServiceError(promise: Promise<unknown>, kind: FamilyServiceError["kind"]) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(FamilyServiceError);
  expect((error as FamilyServiceError).kind).toBe(kind);
  return error as FamilyServiceError;
}

describe("a parent approves a pending swipe", () => {
  it("grants a 10-minute pass and re-runs the purchase, paid from School", async () => {
    const original = await pendingSwipe("Apple Store", 129_00);
    const schoolBefore = await bucket("School");
    const now = new Date();

    const outcome = await resolveApproval(
      { authorizationId: original.id, parentId: parent.id, actingUserId: PRESENTER, decision: "approve" },
      { now },
    );

    expect(outcome.original).toMatchObject({
      status: "parent_approved",
      decision: "PENDING",
      resolvedByMemberId: parent.id,
    });
    expect(outcome.pass).toMatchObject({
      merchantId: original.merchantId,
      cardId: original.cardId,
      maxAmountCents: 129_00,
    });
    expect(outcome.pass!.expiresAt.getTime() - now.getTime()).toBe(10 * 60_000);
    expect(outcome.retry).toMatchObject({
      decision: "APPROVED",
      status: "approved",
      reasonCode: "approved",
      bucketId: schoolBefore.id,
      previousAuthorizationId: original.id,
    });

    const [pass] = await db.select().from(temporaryPassesTable).where(eq(temporaryPassesTable.id, outcome.pass!.id));
    expect(pass!.usedAt).not.toBeNull();

    const school = await bucket("School");
    // Approved purchases are held until settlement, like any swipe.
    expect(school.availableCents).toBe(schoolBefore.availableCents - 129_00);
    expect(school.heldCents).toBe(schoolBefore.heldCents + 129_00);
    expect(school.spentCents).toBe(schoolBefore.spentCents);

    // The dependent's screen polls this: the original now links to its retry.
    const thread = await getAuthorizationThread(original.id);
    expect(thread.authorization.authorization.status).toBe("parent_approved");
    expect(thread.authorization.nextAuthorizationId).toBe(outcome.retry!.id);
    expect(thread.retry?.authorization.decision).toBe("APPROVED");
    expect(thread.retry?.bucketName).toBe("School");
  });

  it("approves the 2:10am ride from Transit, still on the late-night clock", async () => {
    const original = await pendingSwipe("Uber", 22_00, "02:10");
    expect(original.reasonCode).toBe("outside_hours");
    const transitBefore = await bucket("Transit");

    const { retry } = await resolveApproval({
      authorizationId: original.id,
      parentId: parent.id,
      actingUserId: PRESENTER,
      decision: "approve",
    });

    expect(retry).toMatchObject({ decision: "APPROVED", bucketId: transitBefore.id });
    // Retried as long after 2:10am as really passed: well inside the window.
    const lagMs = retry!.swipedAt.getTime() - original.swipedAt.getTime();
    expect(lagMs).toBeGreaterThanOrEqual(0);
    expect(lagMs).toBeLessThan(60_000);
    expect((await bucket("Transit")).availableCents).toBe(transitBefore.availableCents - 22_00);
  });

  it("uses the pass once: the same purchase again needs a new OK", async () => {
    const original = await pendingSwipe("Uber", 10_00, "02:10");
    const { pass, retry } = await resolveApproval({
      authorizationId: original.id,
      parentId: parent.id,
      actingUserId: PRESENTER,
      decision: "approve",
    });
    expect(retry?.decision).toBe("APPROVED");

    // Transit still has $40, so only the late-night rule stands in the way.
    const again = await processSwipe(swipe(await slugOf("Uber"), 10_00, "02:12"), NO_GUARD);
    expect(again.authorization).toMatchObject({ decision: "PENDING", reasonCode: "outside_hours" });

    const [used] = await db.select().from(temporaryPassesTable).where(eq(temporaryPassesTable.id, pass!.id));
    expect(used!.usedAt).not.toBeNull();
  });
});

describe("a parent declines a pending swipe", () => {
  it("marks it declined, grants no pass and moves no money", async () => {
    const original = await pendingSwipe("Apple Store", 129_00);
    const before = await db.select().from(bucketsTable).orderBy(bucketsTable.id);
    const passesBefore = await passCount();

    const outcome = await resolveApproval({
      authorizationId: original.id,
      parentId: parent.id,
      actingUserId: PRESENTER,
      decision: "decline",
    });

    expect(outcome.original).toMatchObject({ status: "parent_declined", resolvedByMemberId: parent.id });
    expect(outcome.retry).toBeNull();
    expect(outcome.pass).toBeNull();
    expect(await passCount()).toBe(passesBefore);
    expect(await db.select().from(bucketsTable).orderBy(bucketsTable.id)).toEqual(before);

    const thread = await getAuthorizationThread(original.id);
    expect(thread.retry).toBeNull();
  });
});

describe("answering a request that isn't waiting", () => {
  it("rejects a second answer with a conflict and moves the money only once", async () => {
    const original = await pendingSwipe("Apple Store", 129_00);
    await resolveApproval({ authorizationId: original.id, parentId: parent.id, actingUserId: PRESENTER, decision: "approve" });
    const schoolAfterFirst = await bucket("School");

    const again = await expectServiceError(
      resolveApproval({ authorizationId: original.id, parentId: parent.id, actingUserId: PRESENTER, decision: "approve" }),
      "conflict",
    );
    expect(again.message).toBe("A parent already approved this purchase.");
    await expectServiceError(
      resolveApproval({ authorizationId: original.id, parentId: parent.id, actingUserId: PRESENTER, decision: "decline" }),
      "conflict",
    );

    expect(await bucket("School")).toEqual(schoolAfterFirst);
    const retries = await db
      .select()
      .from(authorizationsTable)
      .where(eq(authorizationsTable.previousAuthorizationId, original.id));
    expect(retries).toHaveLength(1);
  });

  it("lets only one of two simultaneous approvals win", async () => {
    const original = await pendingSwipe("Apple Store", 129_00);
    const passesBefore = await passCount();
    const answer = () =>
      resolveApproval({ authorizationId: original.id, parentId: parent.id, actingUserId: PRESENTER, decision: "approve" });

    const results = await Promise.allSettled([answer(), answer()]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const failed = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect((failed.reason as FamilyServiceError).kind).toBe("conflict");
    expect(await passCount()).toBe(passesBefore + 1);
  });

  it("rejects a swipe that was never pending", async () => {
    const { authorization } = await processSwipe(swipe(await slugOf("Steam"), 14_99), NO_GUARD);
    expect(authorization.decision).toBe("REJECTED");
    await expectServiceError(
      resolveApproval({ authorizationId: authorization.id, parentId: parent.id, actingUserId: PRESENTER, decision: "approve" }),
      "conflict",
    );
  });

  it("rejects an unknown request and anyone who isn't a parent", async () => {
    await expectServiceError(
      resolveApproval({ authorizationId: 999_999, parentId: parent.id, actingUserId: PRESENTER, decision: "approve" }),
      "not_found",
    );
    const original = await pendingSwipe("Apple Store", 129_00);
    await expectServiceError(
      resolveApproval({ authorizationId: original.id, parentId: funder.id, actingUserId: PRESENTER, decision: "approve" }),
      "forbidden",
    );
    const [row] = await db.select().from(authorizationsTable).where(eq(authorizationsTable.id, original.id));
    expect(row!.status).toBe("pending");
  });

  it("binds a linked account to its own member: no one else answers as that parent", async () => {
    await db.insert(usersTable).values([{ id: "parent-account" }, { id: "funder-account" }]);
    const original = await pendingSwipe("Apple Store", 129_00);

    // The parent is linked: the unlinked presenter can no longer answer for them.
    await db.update(membersTable).set({ userId: "parent-account" }).where(eq(membersTable.id, parent.id));
    await expectServiceError(
      resolveApproval({ authorizationId: original.id, parentId: parent.id, actingUserId: PRESENTER, decision: "approve" }),
      "forbidden",
    );
    // An account linked to another member can't act as the parent either.
    await db.update(membersTable).set({ userId: null }).where(eq(membersTable.id, parent.id));
    await db.update(membersTable).set({ userId: "funder-account" }).where(eq(membersTable.id, funder.id));
    await expectServiceError(
      resolveApproval({ authorizationId: original.id, parentId: parent.id, actingUserId: "funder-account", decision: "decline" }),
      "forbidden",
    );
    const [untouched] = await db.select().from(authorizationsTable).where(eq(authorizationsTable.id, original.id));
    expect(untouched!.status).toBe("pending");

    // The parent's own account answers.
    await db.update(membersTable).set({ userId: "parent-account" }).where(eq(membersTable.id, parent.id));
    const { original: answered } = await resolveApproval({
      authorizationId: original.id,
      parentId: parent.id,
      actingUserId: "parent-account",
      decision: "decline",
    });
    expect(answered.status).toBe("parent_declined");
  });

  it("can't approve a purchase at an unlisted shop, but can decline it", async () => {
    const custom = { ...swipe(await slugOf("Trader Joe's"), 5_00), merchantId: null, merchantName: "Corner Kiosk", merchantCategory: "souvenirs", mcc: "5947" };
    const { authorization } = await processSwipe(custom, NO_GUARD);
    expect(authorization.decision).toBe("PENDING");

    await expectServiceError(
      resolveApproval({ authorizationId: authorization.id, parentId: parent.id, actingUserId: PRESENTER, decision: "approve" }),
      "rule",
    );
    const { original } = await resolveApproval({
      authorizationId: authorization.id,
      parentId: parent.id,
      actingUserId: PRESENTER,
      decision: "decline",
    });
    expect(original.status).toBe("parent_declined");
  });
});

// ---- The chain mirror, with a fake client -----------------------------------

const ADDRESS = "0x0b7d36cdb2af14db03ae947bb845d8bdf4aa9e17";

function fakeChain(options: { failPass?: boolean } = {}) {
  const calls: string[] = [];
  let n = 0;
  const hash = () => `0x${(++n).toString(16).padStart(64, "0")}`;
  const confirmed = (method: string, txHash: string, eventName: string): WriteConfirmation<object> => ({
    method,
    txHash,
    explorerUrl: `https://explorer.example/tx/${txHash}`,
    blockNumber: 200 + n,
    confirmedAt: new Date("2026-10-24T18:00:00Z"),
    confirmationMs: 800,
    gasUsed: 1n,
    ids: {},
    events: [{ eventName, contractAddress: ADDRESS, txHash, blockNumber: 200 + n, logIndex: 0, args: {} }],
  });
  const client = {
    resolvePending: async (p: { authorizationId: number; approved: boolean; parentId: string }) => {
      calls.push(`resolvePending ${p.authorizationId} ${p.approved} ${p.parentId}`);
      const txHash = hash();
      return { txHash, confirmation: Promise.resolve(confirmed("resolvePending", txHash, "AuthorizationResolved")) };
    },
    grantTemporaryPass: async (p: { cardId: number; merchantId: string; maxAmount: number; expiresAt: number }) => {
      calls.push(`grantTemporaryPass ${p.cardId} ${p.merchantId} ${p.maxAmount} ${p.expiresAt}`);
      const txHash = hash();
      const done = options.failPass
        ? Promise.reject(new Error("execution reverted"))
        : Promise.resolve(confirmed("grantTemporaryPass", txHash, "TempPassGranted"));
      done.catch(() => undefined);
      return { txHash, confirmation: done };
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

describe("mirroring a parent's answer on chain", () => {
  async function approvedOnChain() {
    const original = await pendingSwipe("Apple Store", 129_00);
    // As if authorize() had put the pending swipe on chain as #7.
    await db.update(authorizationsTable).set({ onchainAuthorizationId: 7 }).where(eq(authorizationsTable.id, original.id));
    await db.update(cardsTable).set({ onchainCardId: 1 }).where(eq(cardsTable.id, original.cardId!));
    return resolveApproval({ authorizationId: original.id, parentId: parent.id, actingUserId: PRESENTER, decision: "approve" });
  }

  it("sends resolvePending then the pass, and marks both confirmed from their receipts", async () => {
    const outcome = await approvedOnChain();
    const chain = fakeChain();

    const result = await mirrorParentDecisionOnChain(outcome, chain.deps());

    const [merchant] = await db.select().from(merchantsTable).where(eq(merchantsTable.id, outcome.pass!.merchantId));
    expect(chain.calls).toEqual([
      `resolvePending 7 true ${parent.onchainId}`,
      `grantTemporaryPass 1 ${merchant!.onchainId} 12900 ${Math.floor(outcome.pass!.expiresAt.getTime() / 1000)}`,
    ]);
    expect(result.resolve?.status).toBe("confirmed");
    expect(result.pass?.status).toBe("confirmed");

    const [original] = await db.select().from(authorizationsTable).where(eq(authorizationsTable.id, outcome.original.id));
    expect(original!.resolveChainStatus).toBe("confirmed");
    expect(original!.resolveChainTxHash).toMatch(/^0x0+1$/);
    // The swipe's own authorize record is untouched.
    expect(original!.chainStatus).toBe("not_submitted");
    const [pass] = await db.select().from(temporaryPassesTable).where(eq(temporaryPassesTable.id, outcome.pass!.id));
    expect(pass!.chainStatus).toBe("confirmed");
    const events = await db.select().from(chainEventsTable);
    expect(events.map((e) => [e.eventName, e.ownerTable]).sort()).toEqual([
      ["AuthorizationResolved", "authorization_resolutions"],
      ["TempPassGranted", "temporary_passes"],
    ]);
  });

  it("marks a failed pass failed without touching the decision", async () => {
    const outcome = await approvedOnChain();
    const result = await mirrorParentDecisionOnChain(outcome, fakeChain({ failPass: true }).deps());

    expect(result.pass?.status).toBe("failed");
    const [pass] = await db.select().from(temporaryPassesTable).where(eq(temporaryPassesTable.id, outcome.pass!.id));
    expect(pass!.chainStatus).toBe("failed");
    const [retry] = await db.select().from(authorizationsTable).where(eq(authorizationsTable.id, outcome.retry!.id));
    expect(retry!.decision).toBe("APPROVED");
  });

  it("leaves a decision off chain when the swipe never reached the chain, or the chain isn't set up", async () => {
    const original = await pendingSwipe("Apple Store", 129_00);
    const outcome = await resolveApproval({ authorizationId: original.id, parentId: parent.id, actingUserId: PRESENTER, decision: "decline" });
    const chain = fakeChain();

    expect(await mirrorParentDecisionOnChain(outcome, chain.deps())).toEqual({ resolve: null, pass: null });
    expect(chain.calls).toEqual([]);

    const approved = await approvedOnChain();
    const off = fakeChain();
    const result = await mirrorParentDecisionOnChain(approved, off.deps(false));
    expect(result.resolve?.status).toBe("not_configured");
    expect(off.calls).toEqual([]);
    const [row] = await db.select().from(authorizationsTable).where(eq(authorizationsTable.id, approved.original.id));
    expect(row!.resolveChainStatus).toBe("not_submitted");
  });
});
