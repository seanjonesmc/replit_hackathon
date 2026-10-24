# Trellis

A phased, testnet-only family-spending demo with parent guardrails.

## Run & check

Use the existing managed workflows; they supply `PORT` and the frontend
`BASE_PATH`. Do not create replacement services.

- `pnpm --filter @workspace/trellis run dev` — frontend, preview `/`
- `pnpm --filter @workspace/api-server run dev` — build and start API, `/api`
- `pnpm --filter @workspace/mockup-sandbox run dev` — existing design sandbox, `/__mockup`
- `pnpm run typecheck` — build shared library declarations, then check all apps, scripts, and their tests
- `pnpm test` — baseline regression checks (Vitest, root `vitest.config.ts`); add `--project api-server|trellis|workspace` to run one
- `pnpm run build` — typecheck and build workspace packages (frontend needs `PORT` and `BASE_PATH`)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client and validation schemas after OpenAPI changes
- `curl --fail http://localhost:80/api/healthz` — API health through the shared proxy

For manual frontend commands outside the workflow, supply `PORT=20757 BASE_PATH=/`;
for the API supply `PORT=8080`. Keep these aligned with the managed artifact
configuration. The API dev command builds once; restart it after server edits.
`DATABASE_URL` is required when using `@workspace/db`, not by the current health
route. Never commit credentials. Schema push (`pnpm --filter @workspace/db run push`)
is a separate, explicitly authorized development operation, not a startup step.

## Folder map and implementation boundaries

See [docs/structure.md](docs/structure.md) for the full map, planned modules,
test locations, and phase gates.

- `artifacts/trellis/` — existing React/Vite frontend
- `artifacts/api-server/` — existing Express API
- `lib/` — API specification, generated client/validators, database, future shared logic
- `src/brand/brand.config.ts` — the single brand source
- `public/brand/` — canonical brand assets served by the frontend
- `contracts/` — reserved Solidity area; no toolchain or contracts yet
- `design/reference/venmo.DESIGN.md` — immutable reference, never a runtime import

## Architecture and scope

- Preserve this pnpm workspace and partial Phase 0 work; extend rather than rebuild.
- Frontend and API must not import one another. Shared cross-package code belongs
  in `lib/`; leaf applications and scripts are not shared libraries.
- Brand names, visual tokens, asset paths, copy, and demo identities come from the
  root brand configuration. Do not create a second theme/configuration source.
- Testnet only (Monad); bank/card behavior is simulated. No real money or bank/card
  linking, refunds, receipt uploads, recurring allowances, push notifications, or
  multiple families.
- Verify each phase before moving on. Preview samples are not on-chain proof.

## Current baseline

Phase 0 is partial: brand configuration/assets, styling, shared primitives, and
sample data exist; the homepage still displays the scaffold placeholder. The API
currently exposes health only and the database schema is empty. Directory READMEs
reserve responsibilities, not implemented functionality or authorization boundaries.
Baseline Vitest checks cover API health, BRAND asset URLs under the frontend
base path, and the byte-for-byte reference checksum. No blockchain tooling.

## Stack

pnpm workspaces, Node.js, TypeScript, React/Vite, Express 5, PostgreSQL/Drizzle,
OpenAPI/Orval, Zod, and esbuild. Keep existing package choices and workspace
security settings.
