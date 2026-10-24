import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import app from "../src/app";

// The session store is stubbed to know no sessions, so every request is
// rejected before a service runs and these tests never touch a database.
vi.mock("../src/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lib/auth")>();
  return {
    ...actual,
    getSession: vi.fn(async () => null),
    clearSession: vi.fn(async () => {}),
    deleteSession: vi.fn(async () => {}),
  };
});

const SPENDING_ROUTES = [
  {
    method: "POST",
    path: "/api/swipes",
    body: {
      cardId: 1,
      dependentId: 1,
      merchantId: 1,
      merchantName: "Trader Joe's",
      mcc: "5411",
      merchantCategory: "grocery",
      items: [],
      amount: 1840,
      location: "",
      timestamp: "2026-10-24T14:30:00-07:00",
    },
  },
  { method: "POST", path: "/api/settlements" },
  { method: "GET", path: "/api/settlements/1" },
  { method: "GET", path: "/api/merchants" },
  { method: "GET", path: "/api/authorizations" },
  { method: "GET", path: "/api/authorizations/1" },
  { method: "GET", path: "/api/approvals" },
  {
    method: "POST",
    path: "/api/approvals/1/resolve",
    body: { parentId: 1, decision: "approve" },
  },
  { method: "GET", path: "/api/card" },
  { method: "POST", path: "/api/card/freeze" },
  { method: "POST", path: "/api/card/unfreeze" },
  { method: "GET", path: "/api/policy" },
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

describe("spending routes when signed out", () => {
  it.each(SPENDING_ROUTES)("$method $path returns 401 JSON", async (route) => {
    const res = await fetch(`${baseUrl}${route.path}`, {
      method: route.method,
      headers: { "content-type": "application/json" },
      body: "body" in route ? JSON.stringify(route.body) : undefined,
    });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });
});
