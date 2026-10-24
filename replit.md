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
- `pnpm run contracts:compile` / `pnpm run contracts:test` — compile Solidity and run contract tests (Hardhat 3, in-process network, no secrets)
- `pnpm run build` — typecheck and build workspace packages (frontend needs `PORT` and `BASE_PATH`)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client and validation schemas after OpenAPI changes
- `curl --fail http://localhost:80/api/healthz` — API health through the shared proxy

For manual frontend commands outside the workflow, supply `PORT=20757 BASE_PATH=/`;
for the API supply `PORT=8080`. Keep these aligned with the managed artifact
configuration. The API dev command builds once; restart it after server edits.
The API now requires `DATABASE_URL` at startup (and in its tests), because sign-in
sessions live in Postgres, and it seeds the demo family on first start (the schema
must already be pushed). Never commit credentials. Schema push (`pnpm --filter @workspace/db run push`)
is a separate, explicitly authorized development operation, not a startup step.

## Folder map and implementation boundaries

See [docs/structure.md](docs/structure.md) for the full map, planned modules,
test locations, and phase gates.

- [docs/product-spec.md](docs/product-spec.md) — the user's original product spec
  (master prompt), byte-for-byte; never edit it. Where it differs, the
  [stack decision record](docs/stack-decisions.md) and later agreed decisions
  (approved plans in [docs/plans/](docs/plans/), this file) take precedence.
  BRAND remains the only source of brand values: the brand values written in the
  spec (and quoted in saved plans) are expected there, and these files are allowed
  exceptions in any search for hardcoded brand values.
- [docs/stack-decisions.md](docs/stack-decisions.md) — agreed stack, with reasons and phases
- `docs/plans/` — saved, agreed plans for individual phases and tasks
- `artifacts/trellis/` — existing React/Vite frontend
- `artifacts/api-server/` — existing Express API
- `artifacts/pitch-deck/` — judges' pitch deck (slides, `/pitch-deck/`); reads BRAND at build time and sources every number from `docs/research/problem-statement.md`
- `lib/` — API specification, generated client/validators, database, future shared logic
- `src/brand/brand.config.ts` — the single brand source
- `public/brand/` — canonical brand assets served by the frontend
- `contracts/` — Solidity contracts on Hardhat 3 with its ethers toolbox (MockUSD and FamilyCardNetwork: simulated bank, pot buckets, cards, merchants and authorizations)
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

Phase 0 provides brand configuration/assets, styling, shared primitives and app
components, an editable root `DESIGN.md`, the app shell (role switcher, per-role
tab bars and a coming-soon placeholder for every main screen; no data yet),
and a development-only component preview at the hidden `/brand` route. The API
exposes health and sign-in (`/api/login`, `/api/callback`, `/api/logout`,
`/api/auth/user`) and the family routes (`/api/family`, `/api/overview`, bank
linking, simulated deposits, bucket contributions), each behind the `requireAuth`
guard. The database holds sign-in users/sessions plus the demo family, its
simulated banks, deposits, buckets, contributions and a `chain_events` table; the
API seeds the family from BRAND.demo at startup when none exists. Every mirrored
row stays `not_submitted` on chain until Phase 3. The browser
sign-in hook (`lib/replit-auth-web`) is not yet wired into any screen. Directory
READMEs reserve responsibilities, not implemented functionality or authorization
boundaries. Baseline Vitest checks cover API health and sign-in, BRAND asset URLs
under the frontend base path, and the byte-for-byte reference checksum. Contracts
use Hardhat 3; MockUSD and FamilyCardNetwork (simulated bank, pot buckets, cards, merchants and authorizations) exist and nothing is deployed.
The API's AI service layer (`services/ai/`: policy builder and AI guard) exists
but is not yet wired to routes or a decision engine.

## Stack

Agreed decisions, with reasons and the phase that introduces each, are recorded in
[docs/stack-decisions.md](docs/stack-decisions.md); keep this summary in step with it.

- In place: pnpm workspaces, Node.js, TypeScript, React/Vite/Tailwind (mobile-first),
  Express 5 with contract-first OpenAPI/Orval and Zod, Drizzle, esbuild, Vitest.
- Phase 1: Replit's built-in PostgreSQL (separate development and production
  databases; the app seeds the demo family when none exists) and Replit Auth
  (presenter-only login).
- Phase 3: Monad testnet only (chain 10143); Hardhat 3 with its ethers toolbox in
  `contracts/`, ethers v6 in the API; configuration in Secrets under the spec's names.
- Phase 4: Anthropic Claude through Replit AI Integrations, strict validated JSON,
  failures fall back to Pending.
- Phase 6: Server-Sent Events with automatic polling fallback.
- Hosting: static front end; API on an always-on Reserved VM (publish target `vm`).
- Not used: Stripe, Plaid, email, file storage or other connectors.

Keep existing package choices and workspace security settings. Install each tool
only in the phase that introduces it.
