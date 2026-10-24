---
name: pnpm installs in this workspace
description: Constraints when adding packages with pnpm here (workspace file, peer deps).
---
Do not pass a `catalog:` specifier to `pnpm add`; write the catalog reference into package.json and run `pnpm install`.

**Why:** `pnpm add <pkg>@catalog:` rewrites `pnpm-workspace.yaml`, dropping its security comments and pinning catalog ranges.

**How to apply:** After any `pnpm add`, `git diff pnpm-workspace.yaml` should show only intended lines.

`autoInstallPeers` is false, so plugin bundles (e.g. the Hardhat ethers toolbox) need every peer dependency listed explicitly in the consuming package.

**Why:** Missing peers are not installed, and plugins that import them fail at load time.

If `vite.config.ts` typecheck fails in mockup-sandbox or trellis-design with "Plugin is not assignable… two different types with this name exist", run `pnpm install --frozen-lockfile --offline`; it changes no tracked files.

**Why:** The lockfile has two vite variants (yaml 2.8.3 vs 2.9.1); an install from another package can leave the hoisted `node_modules/.pnpm/node_modules/vite` pointing at the wrong one, so plugins without a vite peer resolve a different vite.

**How to apply:** Check `readlink -f node_modules/.pnpm/node_modules/vite` before touching configs; it should be the yaml@2.9.1 variant.
