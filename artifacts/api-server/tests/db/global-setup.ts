import { execFileSync } from "node:child_process";
import path from "node:path";
import type { TestProject } from "vitest/node";
import { createDatabase } from "@workspace/db";

/**
 * Creates the test database before the `api-server-db` tests run and drops it
 * after. Its URL is the project's `env.DATABASE_URL` (`<dev db>_test`, set in
 * the root vitest.config.ts); the schema is pushed fresh each run, so a schema
 * change that breaks these tests fails here. CREATE and DROP go through the
 * server's `postgres` maintenance database: the development database is never
 * opened.
 */
const workspaceRoot = path.resolve(import.meta.dirname, "../../../..");

export default async function setup(project: TestProject) {
  const devUrl = process.env.DATABASE_URL;
  const testUrl = project.config.env.DATABASE_URL;
  if (!devUrl || !testUrl) {
    throw new Error("DATABASE_URL must be set to run the database tests.");
  }
  const devName = new URL(devUrl).pathname.slice(1);
  const testName = new URL(testUrl).pathname.slice(1);
  if (!testName.endsWith("_test") || testName === devName) {
    throw new Error(`Refusing to use "${testName}" as the test database.`);
  }

  const adminUrl = new URL(testUrl);
  adminUrl.pathname = "/postgres";
  const quoted = `"${testName.replace(/"/g, '""')}"`;
  const admin = async (statement: string) => {
    const conn = createDatabase(adminUrl.toString());
    try {
      await conn.pool.query(statement);
    } finally {
      await conn.pool.end();
    }
  };

  await admin(`DROP DATABASE IF EXISTS ${quoted} WITH (FORCE)`);
  await admin(`CREATE DATABASE ${quoted}`);
  execFileSync("pnpm", ["--filter", "@workspace/db", "run", "push-force"], {
    cwd: workspaceRoot,
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: "pipe",
  });

  return async () => {
    await admin(`DROP DATABASE IF EXISTS ${quoted} WITH (FORCE)`);
  };
}
