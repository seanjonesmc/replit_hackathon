---
name: pnpm installs in this workspace
description: Constraints when adding packages with pnpm here (workspace file, peer deps).
---
Do not pass a `catalog:` specifier to `pnpm add`; write the catalog reference into package.json and run `pnpm install`.

**Why:** `pnpm add <pkg>@catalog:` rewrites `pnpm-workspace.yaml`, dropping its security comments and pinning catalog ranges.

**How to apply:** After any `pnpm add`, `git diff pnpm-workspace.yaml` should show only intended lines.

`autoInstallPeers` is false, so plugin bundles (e.g. the Hardhat ethers toolbox) need every peer dependency listed explicitly in the consuming package.

**Why:** Missing peers are not installed, and plugins that import them fail at load time.
