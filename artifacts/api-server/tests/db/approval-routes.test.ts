import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cardsTable, db, membersTable, merchantsTable, pool, usersTable } from "@workspace/db";
import app from "../../src/app";
import { seedSpendingDemo } from "../../src/services/decisions";
import { seedDemoFamily } from "../../src/services/family";
import { resetTestDatabase } from "./test-database";

/**
 * The approval routes over HTTP, signed in through a stubbed session, against
 * the test database: approve returns the retry, a second answer is a 409,
 * bad input is a 400, the dependent's poll sees the outcome, and only a
 * parent (from their own linked account, if any) can answer: 403 otherwise.
 */

vi.mock("../../src/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/lib/auth")>();
  return {
    ...actual,
    getSession: vi.fn(async () => ({
      user: { id: "presenter", email: null, firstName: null, lastName: null, profileImageUrl: null },
      access_token: "test",
    })),
  };
});
vi.mock("../../src/services/decisions/chain-handoff", () => ({
  handOffToChain: vi.fn(async () => {}),
  waitForAuthorize: vi.fn(async () => {}),
}));
// No chain Secrets in tests: the mirror leaves everything off chain.
vi.mock("../../src/services/blockchain", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/services/blockchain")>();
  return { ...actual, isChainConfigured: () => false };
});

let server: Server;
let baseUrl: string;
let parentId: number;
let dependentId: number;
let swipeBody: Record<string, unknown>;

beforeAll(async () => {
  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  await pool.end();
});

beforeEach(async () => {
  await resetTestDatabase();
  await seedDemoFamily();
  await seedSpendingDemo();
  const members = await db.select().from(membersTable);
  parentId = members.find((m) => m.role === "parent")!.id;
  const dependent = members.find((m) => m.role === "dependent")!;
  dependentId = dependent.id;
  const [card] = await db.select().from(cardsTable).where(eq(cardsTable.dependentMemberId, dependent.id));
  const [apple] = await db.select().from(merchantsTable).where(eq(merchantsTable.category, "electronics"));
  swipeBody = {
    cardId: card!.id,
    dependentId: dependent.id,
    merchantId: apple!.id,
    merchantName: apple!.name,
    mcc: apple!.mcc,
    merchantCategory: apple!.category,
    items: ["laptop case"],
    amount: 129_00,
    location: "Test location",
    timestamp: "2026-10-23T14:30:00",
  };
});

const call = async (method: string, path: string, body?: unknown) => {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "content-type": "application/json", cookie: "sid=test" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as Record<string, any> };
};

async function pendingId() {
  // Rules only: the Apple Store purchase is over School's approval threshold.
  const swiped = await call("POST", "/api/swipes", swipeBody);
  expect(swiped.body.decision).toBe("PENDING");
  return swiped.body.authorizationId as number;
}

describe("POST /api/approvals/:id/resolve", () => {
  it("approves, returns the retry, and empties the approvals list", async () => {
    const id = await pendingId();
    expect((await call("GET", "/api/approvals")).body.map((a: { id: number }) => a.id)).toContain(id);

    const res = await call("POST", `/api/approvals/${id}/resolve`, { parentId, decision: "approve" });
    expect(res.status).toBe(200);
    expect(res.body.authorization).toMatchObject({ id, status: "parent_approved", resolveChain: { status: "not_submitted" } });
    expect(res.body.retry).toMatchObject({ decision: "APPROVED", bucketName: "School", previousAuthorizationId: id });

    expect((await call("GET", "/api/approvals")).body).toEqual([]);
    const polled = await call("GET", `/api/authorizations/${id}`);
    expect(polled.body.retry.id).toBe(res.body.retry.id);
  });

  it("answers a second answer with 409 and a clear message", async () => {
    const id = await pendingId();
    await call("POST", `/api/approvals/${id}/resolve`, { parentId, decision: "decline" });
    const again = await call("POST", `/api/approvals/${id}/resolve`, { parentId, decision: "approve" });
    expect(again).toEqual({ status: 409, body: { error: "A parent already declined this purchase." } });
  });

  it("rejects a bad decision with 400 and an unknown purchase with 404", async () => {
    const id = await pendingId();
    expect((await call("POST", `/api/approvals/${id}/resolve`, { parentId, decision: "maybe" })).status).toBe(400);
    expect((await call("POST", `/api/approvals/999999/resolve`, { parentId, decision: "approve" })).status).toBe(404);
    expect((await call("GET", "/api/authorizations/999999")).status).toBe(404);
  });

  it("forbids a signed-in account from answering as a non-parent or as someone else's parent", async () => {
    const id = await pendingId();
    for (const decision of ["approve", "decline"]) {
      const asDependent = await call("POST", `/api/approvals/${id}/resolve`, { parentId: dependentId, decision });
      expect(asDependent).toEqual({ status: 403, body: { error: "Only a parent can approve or decline a purchase." } });
    }

    // Once the parent is linked to another account, the signed-in presenter
    // can no longer answer for them, either way.
    await db.insert(usersTable).values({ id: "parent-account" });
    await db.update(membersTable).set({ userId: "parent-account" }).where(eq(membersTable.id, parentId));
    for (const decision of ["approve", "decline"]) {
      expect((await call("POST", `/api/approvals/${id}/resolve`, { parentId, decision })).status).toBe(403);
    }

    // An account linked to the dependent can't act as the (unlinked) parent.
    await db.update(membersTable).set({ userId: null }).where(eq(membersTable.id, parentId));
    await db.insert(usersTable).values({ id: "presenter" });
    await db.update(membersTable).set({ userId: "presenter" }).where(eq(membersTable.id, dependentId));
    expect((await call("POST", `/api/approvals/${id}/resolve`, { parentId, decision: "approve" })).status).toBe(403);

    expect((await call("GET", `/api/authorizations/${id}`)).body.authorization.status).toBe("pending");
    expect((await call("GET", "/api/approvals")).body.map((a: { id: number }) => a.id)).toContain(id);
  });

  it("lets a parent linked to the signed-in account answer", async () => {
    const id = await pendingId();
    await db.insert(usersTable).values({ id: "presenter" });
    await db.update(membersTable).set({ userId: "presenter" }).where(eq(membersTable.id, parentId));
    const res = await call("POST", `/api/approvals/${id}/resolve`, { parentId, decision: "decline" });
    expect(res.status).toBe(200);
    expect(res.body.authorization.status).toBe("parent_declined");
  });
});
