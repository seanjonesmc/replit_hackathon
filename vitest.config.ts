import path from "node:path";
import { defineConfig } from "vitest/config";

const root = import.meta.dirname;

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
        resolve: {
          conditions: ["workspace"],
          alias: { "@brand": path.join(root, "src/brand") },
        },
        test: {
          name: "api-server",
          environment: "node",
          include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
          // Production mode skips the pino-pretty worker; silent keeps output clean.
          env: { LOG_LEVEL: "silent", NODE_ENV: "production" },
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
