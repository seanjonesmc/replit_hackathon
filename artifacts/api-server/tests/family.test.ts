import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import app from "../src/app";
import { SESSION_COOKIE } from "../src/lib/auth";

// The session store is stubbed and every request here is rejected or
// validated before a service runs, so these tests never touch a database.
const fixture = vi.hoisted(() => ({
  sid: "signed-in-session",
  session: {
    user: {
      id: "test-presenter",
      email: null,
      firstName: "Test",
      lastName: "Presenter",
      profileImageUrl: null,
    },
    access_token: "test-access-token",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  },
}));

vi.mock("../src/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lib/auth")>();
  return {
    ...actual,
    getSession: vi.fn(async (sid: string) =>
      sid === fixture.sid ? fixture.session : null,
    ),
    clearSession: vi.fn(async () => {}),
    deleteSession: vi.fn(async () => {}),
  };
});

const FAMILY_ROUTES = [
  { method: "GET", path: "/api/family" },
  { method: "GET", path: "/api/overview" },
  { method: "GET", path: "/api/members/1/bank-accounts" },
  {
    method: "POST",
    path: "/api/members/1/bank-accounts",
    body: { bankName: "x" },
  },
  {
    method: "POST",
    path: "/api/bank-accounts/1/deposits",
    body: { amountCents: 100 },
  },
  {
    method: "POST",
    path: "/api/buckets/1/contributions",
    body: { memberId: 1, bankAccountId: 1, amountCents: 100 },
  },
  {
    method: "POST",
    path: "/api/buckets/1/send-money",
    body: { memberId: 1, bankAccountId: 1, amountCents: 5000, note: "For lunch" },
  },
  { method: "GET", path: "/api/members/1/contributions" },
] as const;

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  );
});

describe("family routes when signed out", () => {
  it.each(FAMILY_ROUTES)("$method $path returns 401 JSON", async (route) => {
    const res = await fetch(`${baseUrl}${route.path}`, {
      method: route.method,
      headers: { "content-type": "application/json" },
      body: "body" in route ? JSON.stringify(route.body) : undefined,
    });

    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });
});

describe("family routes input validation", () => {
  const signedIn = {
    cookie: `${SESSION_COOKIE}=${fixture.sid}`,
    "content-type": "application/json",
  };

  it("rejects a non-numeric member id with 400 JSON", async () => {
    const res = await fetch(`${baseUrl}/api/members/abc/bank-accounts`, {
      headers: signedIn,
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/^memberId: /);
  });

  it("rejects a non-positive deposit with 400 JSON", async () => {
    const res = await fetch(`${baseUrl}/api/bank-accounts/1/deposits`, {
      method: "POST",
      headers: signedIn,
      body: JSON.stringify({ amountCents: 0 }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/^amountCents: /);
  });

  it("rejects a send-money note over 140 characters with 400 JSON", async () => {
    const res = await fetch(`${baseUrl}/api/buckets/1/send-money`, {
      method: "POST",
      headers: signedIn,
      body: JSON.stringify({
        memberId: 1,
        bankAccountId: 1,
        amountCents: 5000,
        note: "x".repeat(141),
      }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/^note: /);
  });
});
