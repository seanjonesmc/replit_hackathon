# Trellis

A phased, testnet-only family-spending demo with parent guardrails.

## Run & check

Use the existing managed workflows; they supply `PORT` and the frontend
`BASE_PATH`. Do not create replacement services.

- `pnpm --filter @workspace/trellis run dev` — frontend at `/` (sign-in and role screens; dev-only brand preview at `/brand`)
- `pnpm --filter @workspace/api-server run dev` — build and start API, `/api`
- `pnpm --filter @workspace/mockup-sandbox run dev` — existing design sandbox, `/__mockup`
- `pnpm run typecheck` — build shared library declarations, then check all apps, scripts, and their tests
- `pnpm test` — baseline regression checks (Vitest, root `vitest.config.ts`); add `--project api-server|trellis|chain|workspace` to run one
- `pnpm run contracts:compile` / `pnpm run contracts:test` — compile Solidity and run contract tests (Hardhat 3, in-process network, no secrets)
- `pnpm run contracts:export-abis` — regenerate `lib/chain/src/abis/` after a contract change
- `pnpm run contracts:deploy:dry-run` — deploy and seed the demo family on the in-process network (no secrets)
- `pnpm run contracts:deploy` — deploy and seed on Monad testnet (chain 10143 only; needs a funded `DEPLOYER_PRIVATE_KEY`)
- `pnpm run build` — typecheck and build workspace packages (frontend needs `PORT` and `BASE_PATH`)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client and validation schemas after OpenAPI changes
- `curl --fail http://localhost:80/api/healthz` — API health through the shared proxy

For manual frontend commands outside the workflow, supply `PORT=20757 BASE_PATH=/`;
for the API supply `PORT=8080`. Keep these aligned with the managed artifact
configuration. The API dev command builds once; restart it after server edits.
The API requires `DATABASE_URL` at startup (and in its tests), because sign-in
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
- `lib/` — API specification, generated client/validators, database, Monad chain client (`lib/chain`), future shared logic
- `src/brand/brand.config.ts` — the single brand source
- `public/brand/` — canonical brand assets served by the frontend
- `contracts/` — Solidity contracts on Hardhat 3 with its ethers toolbox (MockUSD and FamilyCardNetwork: simulated bank, pot buckets, cards, merchants and authorizations)
- `design/reference/trellis-app-mockup.html` — immutable current visual source (app mockup), never a runtime import
- `design/reference/venmo.DESIGN.md` — immutable historical reference, never a runtime import

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
components, an editable root `DESIGN.md`, the app shell (role switcher and
per-role tab bars) and a development-only component preview at the hidden
`/brand` route. Phase 1 adds presenter sign-in, the family data model, the
idempotent demo-family seed and read-only parent, grandparent and dependent
screens inside the app shell (the root opens the last-used role, the parent home
by default; the dependent's Swipe tab is still a coming-soon placeholder). The
API exposes health and sign-in (`/api/login`, `/api/callback`, `/api/logout`,
`/api/auth/user`), the family routes (`/api/family`, `/api/overview`, bank
linking, simulated deposits, bucket contributions), one read per screen under
`/api/family/*` (overview, buckets, activity, card-policy, wallet) and the
spending routes (`POST /api/swipes` through the rule-based decision engine,
merchants, the activity feed, approvals, card freeze/unfreeze, the policy), each
behind the `requireAuth` guard. The database holds sign-in users/sessions plus
the demo family, its simulated banks, deposits, buckets, contributions, card,
merchants, policy, temporary passes, authorizations and a `chain_events` table;
the API seeds the family from BRAND.demo at startup when none exists, then adds
any missing merchants, policy, card and purchase history. There is one shared
demo family; any signed-in account sees it. Every mirrored row stays
`not_submitted` on chain until Phase 3, and screens show "Not on chain yet";
later-phase controls (approve/decline, freeze, the policy builder) are shown
disabled. Directory READMEs reserve responsibilities, not implemented
functionality or authorization boundaries. Vitest checks cover API health,
sign-in and signed-out rejection, seeding (against a throwaway
`<db>_seed_test` database), the screen reads, BRAND asset URLs under the
frontend base path, the byte-for-byte reference checksum, and the rule engine's
preset swipes. Contracts use Hardhat 3; MockUSD and FamilyCardNetwork (simulated
bank, pot buckets, cards, merchants and authorizations) are deployed and seeded
with the demo family on Monad testnet for development only (addresses in the
development environment variables; no production deployment yet). The API's AI service layer (`services/ai/`: policy builder and AI
guard) exists; the decision engine calls the AI guard for swipes no hard rule
decided, and the policy builder is not yet wired to routes.

## Stack

Agreed decisions, with reasons and the phase that introduces each, are recorded in
[docs/stack-decisions.md](docs/stack-decisions.md); keep this summary in step with it.

- In place: pnpm workspaces, Node.js, TypeScript, React/Vite/Tailwind (mobile-first),
  Express 5 with contract-first OpenAPI/Orval and Zod, Drizzle, esbuild, Vitest.
- Phase 1: Replit's built-in PostgreSQL (separate development and production
  databases; the app seeds the demo family when none exists) and Replit Auth
  (presenter-only login).
- Phase 3: Monad testnet only (chain 10143); Hardhat 3 with its ethers toolbox in
  `contracts/`, ethers v6 in the API; configuration under the spec's names (the deployer key in
  Secrets; addresses, chain ID and URLs as per-environment variables).
- Phase 4: Anthropic Claude through Replit AI Integrations, strict validated JSON,
  failures fall back to Pending.
- Phase 6: Server-Sent Events with automatic polling fallback.
- Hosting: static front end; API on an always-on Reserved VM (publish target `vm`).
- Not used: Stripe, Plaid, email, file storage or other connectors.

Keep existing package choices and workspace security settings. Install each tool
only in the phase that introduces it.
