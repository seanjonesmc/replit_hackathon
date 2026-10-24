import path from "node:path";
import { defineConfig } from "vitest/config";

const root = import.meta.dirname;

/**
 * Opt-in production build smoke checks, run with `pnpm test:build`.
 * Kept out of the default `vitest.config.ts` because each check runs a real
 * `vite build`. Output goes to the gitignored `generated-artifacts/`.
 */
export default defineConfig({
  test: {
    projects: [
      {
        root: path.join(root, "artifacts/trellis"),
        test: {
          name: "trellis-build",
          environment: "node",
          include: ["tests/**/*.build-test.ts"],
          testTimeout: 30_000,
          hookTimeout: 180_000,
        },
      },
    ],
  },
});
