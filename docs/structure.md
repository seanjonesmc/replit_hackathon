# Folder map

This is an additive organization of the existing scaffold, not a new app.
Directories with responsibility READMEs are reserved for later phases.

```text
artifacts/
  trellis/src/
    App.tsx                  Providers, sign-in gate and routing (one page per route-map tab)
    pages/                   Route entry points: one per tab (wraps its feature screen), /brand, not-found
    components/app-shell.tsx Role switcher and per-role tab bar around every tab URL
    features/
      shell/                 Session context, signed-out welcome, per-tab screen wrapper and header
      parent/                Parent screens: home, approvals, activity, card & policy, settings
      funder/                Grandparent screens: add money, where my money went
      dependent/             Dependent wallet and swipe simulator
      family/                Adapters from API data to the shared components; query refresh after swipes and card changes
      onboarding/            Shared role onboarding flow (later phase)
      branding/              Development-only brand preview at /brand
    components/ui/           Existing generic UI components
    components/trellis/      Shared branded primitives and composite cards/states
    hooks/                   Shared frontend hooks
    lib/                     Route map, domain types, formatting and chain-status helpers, swipe presets, explicit preview samples
    test/                    Component-test helpers only (mocked API, render with a query client); never imported by the app
  api-server/src/
    app.ts                   Express setup and middleware registration
    index.ts                 Startup
    routes/                  HTTP handlers (health, sign-in, family/banks/buckets, per-screen /family/* reads, spending)
    middlewares/             Request middleware, incl. session loader and requireAuth guard
    lib/                     Server-only infrastructure (logger, sign-in sessions)
    services/
      ai/                    Policy builder and AI guard (Anthropic via AI Integrations)
      family/                Demo family, simulated banks, deposits, contributions; startup seed;
                             read models for each screen
      policies/              Reads the family's stored policy in FamilyPolicy shape; plain-English policy lines
      decisions/             Rule engine, swipe handling, card, merchants, activity feed; spending seed
      blockchain/            Monad testnet connection from Secrets (configured flag, shared client, readiness check)
      attribution/           Future contribution/spend attribution
      events/                Chain-event indexing from transaction receipts (not called until Phase 3)
  mockup-sandbox/            Existing isolated design-preview artifact
lib/
  api-spec/openapi.yaml      API contract source of truth
  api-client-react/src/     Generated client/hooks plus custom fetch adapter
  api-zod/src/              Generated API validation
  db/src/schema/            Database models (sign-in, family, banks, buckets, contributions, merchants,
                            policies, cards, temporary passes, authorizations, chain events), exported by index.ts
  replit-auth-web/src/      Browser sign-in hook (session check, login, logout) used by the session gate
  chain/src/                Monad chain library: contract ABIs, enum names, bytes32 IDs, explorer links, ethers v6 operator client
  shared/                   Reserved pure cross-package utilities
src/brand/
  brand.config.ts           Single source for brand values
  brand-css.ts              Derived CSS variables
  brand-history.ts          Every brand value ever used, for the brand-values test only
  assets.ts                 Existing derived SVG asset helpers
public/brand/               Canonical brand assets
contracts/
  hardhat.config.ts         Hardhat 3 config (local and Monad testnet networks)
  src/                      Solidity sources
  test/                     Contract tests (Hardhat mocha + ethers)
  scripts/                  ABI export to lib/chain; Monad testnet deploy and demo-family seed
scripts/src/                Workspace maintenance commands
design/reference/           Immutable Venmo reference
docs/                       Contributor architecture documentation
  product-spec.md           User's original product spec, byte-for-byte (see below)
  stack-decisions.md        Agreed stack, with reasons and introducing phase
  plans/                    Saved, agreed phase and task plans
  research/                 Sourced pitch research (problem statement, competitor comparison)
  pitch/                    Pitch materials (demo video script)
```

## Product spec and decisions

- [`docs/product-spec.md`](product-spec.md) is the user's original master prompt,
  kept byte-for-byte. Never edit it; record changes elsewhere.
- Where they differ, [`docs/stack-decisions.md`](stack-decisions.md) and later
  agreed decisions (approved plans in [`docs/plans/`](plans/), `replit.md`) take
  precedence over the spec.
- BRAND remains the only source of brand values. The brand values written in the
  spec (and quoted in saved plans) are expected there; these files are allowed
  exceptions in any search for hardcoded brand values, alongside `src/brand/`
  and `DESIGN.md`. `scripts/tests/brand-values.test.ts` runs that search on
  every `pnpm test`; it lists each other allowed exception with its reason.

## Dependency rules

- Route entries compose features; role features use shared UI, not the reverse.
  Keep existing primitives where they are; no bulk moves are needed.
- The API reads BRAND through the same `@brand/*` alias (its `tsconfig.json`
  paths and the root Vitest config), importing `brand.config` only.
- `features/branding` consumes root `@brand` configuration and shared components.
  It is not another source of brand values. The existing Vite brand plugin uses
  root `public/`, so do not duplicate brand assets in artifact public folders.
- Frontend and API never import each other (or another artifact). The frontend
  calls the API through `/api` using shared contracts; no localhost URLs or Vite
  proxy are needed. Respect each artifact's base path for its own assets/routes.
- Routes translate HTTP input/output; services own future business operations.
  Keep request validation, middleware, and logging in their existing locations.
  Server services may consume `@workspace/db` and `@workspace/api-zod`.
  Never import database connections or server-only code into the browser.
- OpenAPI changes precede API implementation and client usage; run codegen rather
  than hand-editing generated code. Keep the specification title `Api`.
- `lib/shared/` is documentation only, not an importable package yet. Introduce a
  focused workspace library only when real shared logic exists (as `lib/chain/`
  does for the API and the contracts' scripts). Give it package
  exports, a composite TS config and root project reference; declare each consumer's
  `workspace:*` dependency. Shared code must not depend on artifacts.
- Database models belong in `lib/db/src/schema/`, one model per file, exported from
  its existing index. Schema changes are pushed to the development database only.
- Every family route mounts behind the API's `requireAuth` guard (401 JSON when
  signed out). Browser sign-in state and redirects use `@workspace/replit-auth-web`,
  never the generated API client.

## Build phases and gates

1. **Structure baseline:** preserve existing files, document boundaries, check
   types and startup. No product functionality is implied by placeholders.
2. **Phase 0:** central-brand-driven design specification in root `DESIGN.md`
   and development component preview (hidden `/brand` route) in
   `features/branding`. Preserve the
   reference byte-for-byte; maintain editable design guidance separately.
3. **Phase 1:** presenter sign-in, family data model, idempotent demo seed,
   read-only role screens behind a role switcher; preview moved to dev-only `/brand`.
4. **Later product phases:** implement onboarding/access, models/contracts,
   policies/decisions, simulated funding and testnet integration only under their
   approved phase requirements. This map does not invent phase numbering or policy.
5. **Demo verification:** check the completed role flows and confirmed testnet
   evidence before describing them as working. Never imply real-money capability.

Do not deploy contracts or implement any
of these later features merely to populate the reserved folders.

## Test locations

- Frontend: colocate component/hook tests as `*.test.tsx`/`*.test.ts` with the owning
  feature or shared component. Future browser flows belong in `artifacts/trellis/tests/`.
- API: service unit tests alongside services; HTTP/integration tests in
  `artifacts/api-server/tests/`.
- Libraries: colocate tests with their source; database integration tests belong
  in `lib/db/tests/` and must use an explicit test database.
- Solidity: `contracts/test/`, run by Hardhat 3 with `pnpm run contracts:test`.
  This includes the `lib/chain` client driven against the in-process network
  (`ChainClient.ts`) and the committed-ABI check (`ChainAbis.ts`).

Baseline checks (Vitest, configured once in root `vitest.config.ts`) run with
`pnpm test`; select one project with `pnpm test --project <name>`:

| Project      | File                                                   | Guards                                                      |
| ------------ | ------------------------------------------------------ | ----------------------------------------------------------- |
| `api-server` | `artifacts/api-server/tests/health.test.ts`            | `GET /api/healthz` status and contract-valid payload         |
| `api-server` | `artifacts/api-server/src/services/ai/*.test.ts`       | policy builder and AI guard with the model stubbed: valid parse, PENDING fallback, rule pass-through |
| `api-server` | `artifacts/api-server/tests/auth.test.ts`              | `GET /api/auth/user` signed in/out; `requireAuth` 401 JSON (session store stubbed, no database) |
| `api-server` | `artifacts/api-server/tests/family.test.ts`            | every family route returns 401 JSON signed out; 400 for invalid ids/amounts (no database) |
| `api-server` | `artifacts/api-server/src/services/blockchain/blockchain.test.ts` | chain Secrets: not configured without them (never throws), problems named without values, Monad testnet defaults, readiness accepts only chain 10143 (local stub RPC) |
| `chain`      | `lib/chain/src/*.test.ts`                              | SHA-256 bytes32 IDs, explorer links, enum names, JSON-safe args, RPC error classification and retries, write queue ordering |
| `api-server` | `artifacts/api-server/src/services/decisions/rules.test.ts` | the rule function decides the six preset swipes and a frozen-card swipe as `docs/plans/demo-preset-swipes.md` expects, including the parent-approved Apple Store and Uber retries and Food's $60 limit (no database) |
| `api-server` | `artifacts/api-server/src/services/decisions/outcome.test.ts` | the AI guard can't pay from a bucket other than the category's, and its approvals stay within bucket limits; a card frozen or a bucket drained before the swipe is stored rejects it (no database) |
| `api-server` | `artifacts/api-server/tests/spending.test.ts`          | every spending route returns 401 JSON signed out (no database) |
| `api-server` | `artifacts/api-server/tests/family-auth.test.ts`       | every per-screen `/family/*` read returns 401 without a valid session |
| `api-server` | `artifacts/api-server/tests/demo-seed.test.ts`         | seeding (family, then spending) is idempotent (also concurrently); BRAND identities, agreed limits (including Transit and the late-night window), merchants, blocked categories, authorizations; funding dated before the history; every screen read returns contract-valid data. Uses a throwaway `<dev db>_seed_test` database, pushed fresh each run and dropped after |
| `trellis`    | `artifacts/trellis/vite-brand-plugin.test.ts`          | BRAND-filled `index.html`, base-path asset URLs, SVG output  |
| `trellis`    | `artifacts/trellis/src/components/trellis/primitives.test.ts` | runtime `brandAsset` URLs under `BASE_URL`            |
| `trellis`    | `artifacts/trellis/src/lib/route-map.test.ts`          | roles, tabs and URLs; BRAND.demo names; last-used role       |
| `trellis`    | `artifacts/trellis/src/components/trellis/shell-nav.test.tsx` | role switcher and tab bar links, current marks, count badge |
| `trellis`    | `artifacts/trellis/src/App.test.tsx`                   | root and deep-link routing, role/tab switching, not-found, the swipe tab, sub-path base |
| `trellis`    | `artifacts/trellis/src/lib/swipe-presets.test.ts`      | the spec's six demo swipes and amounts, grid order, 2:10am on the family clock (never in the future), swipe payloads |
| `trellis`    | `artifacts/trellis/src/features/dependent/SwipeSimulator.test.tsx` | grid from `GET /api/merchants`, the swipe request, the result card (decision, Rule/AI guard, ms), feed and approvals refetch, frozen card, server errors (`fetch` mocked) |
| `trellis`    | `artifacts/trellis/src/features/parent/CardFreezeControl.test.tsx` | freeze and unfreeze from the parent's card screen, inactive card, server errors (`fetch` mocked) |
| `trellis`    | `artifacts/trellis/src/index-css.test.ts`              | every CSS variable `index.css` reads is defined or has a fallback; safe-area padding present |
| `workspace`  | `scripts/tests/design-reference.test.ts`               | reference checksum; no code references the reference        |
| `workspace`  | `scripts/tests/product-spec.test.ts`                   | `docs/product-spec.md` size and checksum (never edit it)     |
| `workspace`  | `scripts/tests/brand-values.test.ts`                   | no hex colors, or current or past BRAND app name, demo/bank names or fonts, in source outside `src/brand/`, generated files and listed exceptions; BRAND values recorded in `src/brand/brand-history.ts` |

A production build smoke check is opt-in because it runs a real `vite build`
(a few seconds). Run it with `pnpm test:build` (root `vitest.build.config.ts`)
after changing `artifacts/trellis/vite.config.ts`, the brand plugin, `public/`,
or BRAND asset paths:

| Project         | File                                               | Guards                                                                 |
| --------------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| `trellis-build` | `artifacts/trellis/tests/build-smoke.build-test.ts` | build with `BASE_PATH=/smoke/sub-path/`: favicon, `og:image` and entry script are prefixed; every BRAND asset is in the output and matches root `public/`; the app shell ships and the /brand preview does not |

It writes to the gitignored `generated-artifacts/trellis-build-smoke/`, never to
the artifact's real `dist/`. The `.build-test.ts` suffix keeps it out of `pnpm test`.

Tests derive expected values from `BRAND`, so rebranding does not break them.
The reference checksum must never be updated to accommodate an edit.

Vitest does not typecheck. Each package with tests has a `tsconfig.test.json`
(the frontend's main config excludes `*.test.ts`), and its `typecheck` script
checks both configs, so `pnpm run typecheck` covers tests. A new test location
in another package needs a Vitest project entry and a matching test TS config.
For startup, still use managed services and proxy health/frontend checks.

## Generated files and credentials

Keep dependencies, `dist/`, TS build metadata, coverage, local environment files,
keys, and contract artifacts/cache/typechain/deployment outputs out of Git.
The Hardhat configuration at `contracts/hardhat.config.ts` reads secrets from the
environment and must never include keys.
Do not ignore the entire top-level `artifacts/` directory: it contains application
source. OpenAPI-generated TypeScript already tracked by the project is preserved;
it is distinct from disposable compiler and contract output.
