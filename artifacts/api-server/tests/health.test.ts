import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { HealthCheckResponse } from "@workspace/api-zod";
import app from "../src/app";

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

describe("GET /api/healthz", () => {
  it("responds 200 with the contract-valid health payload", async () => {
    const res = await fetch(`${baseUrl}/api/healthz`);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
    const body: unknown = await res.json();
    expect(body).toEqual({ status: "ok" });
    expect(HealthCheckResponse.safeParse(body).success).toBe(true);
  });

  it("is mounted under /api only", async () => {
    const res = await fetch(`${baseUrl}/healthz`);
    expect(res.status).toBe(404);
  });
});
