import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "../src/app";

/**
 * Every screen read (`/family/*`). All must refuse signed-out callers; the
 * other family routes are covered in family.test.ts.
 */
const FAMILY_ENDPOINTS = [
  "/api/family/overview",
  "/api/family/buckets",
  "/api/family/activity",
  "/api/family/card-policy",
  "/api/family/wallet",
  "/api/family/insights",
  "/api/family/insights?period=30d&dependentId=1",
  "/api/members/1/funding-insights",
];

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

describe("family endpoints when signed out", () => {
  it.each(FAMILY_ENDPOINTS)("GET %s responds 401 with no session", async (path) => {
    const res = await fetch(`${baseUrl}${path}`);
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
  });

  it.each(FAMILY_ENDPOINTS)("GET %s responds 401 with an unknown session cookie", async (path) => {
    const res = await fetch(`${baseUrl}${path}`, { headers: { cookie: "sid=not-a-real-session" } });
    expect(res.status).toBe(401);
  });

  it("reports no signed-in user on the auth endpoint", async () => {
    const res = await fetch(`${baseUrl}/api/auth/user`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ user: null });
  });
});
