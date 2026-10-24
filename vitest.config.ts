import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

const root = import.meta.dirname;

/**
 * Database-backed API tests run against their own database, `<dev db>_test`
 * on the same server, never the development database. The `api-server-db`
 * project points `DATABASE_URL` there for its tests; its global setup creates
 * the database with a fresh schema and drops it after the run.
 */
function testDatabaseUrl(): string | undefined {
  const devUrl = process.env.DATABASE_URL;
  if (!devUrl) return undefined;
  const url = new URL(devUrl);
  url.pathname = `/${url.pathname.slice(1)}_test`;
  return url.toString();
}

const apiServerResolve = {
  conditions: ["workspace"],
  alias: { "@brand": path.join(root, "src/brand") },
};
// Production mode skips the pino-pretty worker; silent keeps output clean.
const apiServerEnv = { LOG_LEVEL: "silent", NODE_ENV: "production" };
const testDbUrl = testDatabaseUrl();

/**
 * Baseline regression checks. Each project runs in its owning package so
 * module resolution matches that package. Test files are typechecked by each
 * package's `tsconfig.test.json` (run via `pnpm run typecheck`), because
 * Vitest strips types without checking them.
 */
export default defineConfig({
  test: {
    projects: [
      {
        root: path.join(root, "artifacts/api-server"),
        resolve: apiServerResolve,
        test: {
          name: "api-server",
          environment: "node",
          include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
          exclude: [...configDefaults.exclude, "tests/db/**"],
          env: apiServerEnv,
        },
      },
      {
        root: path.join(root, "artifacts/api-server"),
        resolve: apiServerResolve,
        test: {
          name: "api-server-db",
          environment: "node",
          include: ["tests/db/**/*.test.ts"],
          globalSetup: ["tests/db/global-setup.ts"],
          // One shared test database: files take turns, each emptying it first.
          fileParallelism: false,
          env: { ...apiServerEnv, ...(testDbUrl ? { DATABASE_URL: testDbUrl } : {}) },
        },
      },
      {
        root: path.join(root, "artifacts/trellis"),
        resolve: {
          alias: {
            "@": path.join(root, "artifacts/trellis/src"),
            "@brand": path.join(root, "src/brand"),
          },
        },
        // Component tests (.tsx) use the same automatic JSX runtime as the app.
        esbuild: { jsx: "automatic" },
        test: {
          name: "trellis",
          environment: "node",
          include: ["*.test.ts", "src/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
        },
      },
      {
        root: path.join(root, "lib/chain"),
        test: {
          name: "chain",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        root: path.join(root, "scripts"),
        test: {
          name: "workspace",
          environment: "node",
          include: ["tests/**/*.test.ts"],
        },
      },
    ],
  },
});
