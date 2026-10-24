import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import cookieParser from "cookie-parser";
import express from "express";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { GetCurrentAuthUserResponse } from "@workspace/api-zod";
import app from "../src/app";
import { clearSession, SESSION_COOKIE } from "../src/lib/auth";
import { authMiddleware } from "../src/middlewares/authMiddleware";
import { requireAuth } from "../src/middlewares/requireAuth";

// The session store is stubbed so these tests never touch a database
// (database tests must use an explicit test database; see docs/structure.md).
// Everything else — cookie parsing, the app-wide session loader, the
// current-user route and the guard — runs for real.
const fixture = vi.hoisted(() => {
  const user = {
    id: "test-presenter",
    email: null,
    firstName: "Test",
    lastName: "Presenter",
    profileImageUrl: null,
  };
  return {
    sid: "signed-in-session",
    user,
    session: {
      user,
      access_token: "test-access-token",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    },
  };
});

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

// A route behind the guard, wired the same way family routes will be:
// cookies, then the app-wide session loader, then requireAuth.
const guardedApp = express();
guardedApp.use(cookieParser());
guardedApp.use(authMiddleware);
guardedApp.get("/guarded", requireAuth, (req, res) => {
  res.json({ userId: req.user?.id });
});

const signedIn = { cookie: `${SESSION_COOKIE}=${fixture.sid}` };

let servers: Server[] = [];
let baseUrl: string;
let guardedUrl: string;

async function listen(handler: express.Express): Promise<string> {
  const server = await new Promise<Server>((resolve) => {
    const s = handler.listen(0, "127.0.0.1", () => resolve(s));
  });
  servers.push(server);
  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

beforeAll(async () => {
  baseUrl = await listen(app);
  guardedUrl = await listen(guardedApp);
});

afterAll(async () => {
  await Promise.all(
    servers.map(
      (server) =>
        new Promise<void>((resolve, reject) =>
          server.close((err) => (err ? reject(err) : resolve())),
        ),
    ),
  );
  servers = [];
});

describe("GET /api/auth/user", () => {
  it("returns a signed-out state without a session", async () => {
    const res = await fetch(`${baseUrl}/api/auth/user`);

    expect(res.status).toBe(200);
    const body: unknown = await res.json();
    expect(body).toEqual({ user: null });
    expect(GetCurrentAuthUserResponse.safeParse(body).success).toBe(true);
  });

  it("returns the session user when signed in", async () => {
    const res = await fetch(`${baseUrl}/api/auth/user`, { headers: signedIn });

    expect(res.status).toBe(200);
    const body: unknown = await res.json();
    expect(body).toEqual({ user: fixture.user });
    expect(GetCurrentAuthUserResponse.safeParse(body).success).toBe(true);
  });

  it("treats an unknown session cookie as signed out and clears it", async () => {
    const res = await fetch(`${baseUrl}/api/auth/user`, {
      headers: { cookie: `${SESSION_COOKIE}=does-not-exist` },
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ user: null });
    expect(clearSession).toHaveBeenCalledWith(
      expect.anything(),
      "does-not-exist",
    );
  });
});

describe("requireAuth guard", () => {
  it("rejects signed-out requests with 401 JSON", async () => {
    const res = await fetch(`${guardedUrl}/guarded`);

    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("lets signed-in requests through with the session user", async () => {
    const res = await fetch(`${guardedUrl}/guarded`, { headers: signedIn });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ userId: fixture.user.id });
  });
});
