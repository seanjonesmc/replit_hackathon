# Folder map

This is an additive organization of the existing scaffold, not a new app.
Directories with responsibility READMEs are reserved for later phases.

```text
artifacts/
  trellis/src/
    App.tsx                  Application providers and routing
    pages/                   Route entry points
    features/
      parent/                Parent-specific screens and interactions
      funder/                Funder-specific screens and interactions
      dependent/             Dependent-specific screens and interactions
      onboarding/            Shared role onboarding flow
      branding/              Development brand-preview composition only
    components/ui/           Existing generic UI components
    components/trellis/      Existing shared branded primitives
    hooks/                   Shared frontend hooks
    lib/                     Frontend-only helpers and explicit preview samples
  api-server/src/
    app.ts                   Express setup and middleware registration
    index.ts                 Startup
    routes/                  HTTP handlers (currently health only)
    middlewares/             Request middleware
    lib/                     Server-only infrastructure, including logger
    services/
      ai/                    Policy builder and AI guard (Anthropic via AI Integrations)
      policies/              Future policy management
      decisions/             Future spending decision orchestration
      blockchain/            Future testnet adapter
      attribution/           Future contribution/spend attribution
      events/                Future domain event handling
  mockup-sandbox/            Existing isolated design-preview artifact
lib/
  api-spec/openapi.yaml      API contract source of truth
  api-client-react/src/     Generated client/hooks plus custom fetch adapter
  api-zod/src/              Generated API validation
  db/src/schema/            Future database models, exported by index.ts
  shared/                   Reserved pure cross-package utilities
src/brand/
  brand.config.ts           Single source for brand values
  brand-css.ts              Derived CSS variables
  assets.ts                 Existing derived SVG asset helpers
public/brand/               Canonical brand assets
contracts/
  src/                      Future Solidity sources
  test/                     Future contract tests
  scripts/                  Future testnet deployment scripts
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
  and `DESIGN.md`.

## Dependency rules

- Route entries compose features; role features use shared UI, not the reverse.
  Keep existing primitives where they are; no bulk moves are needed.
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
  focused workspace library only when real shared logic exists. Give it package
  exports, a composite TS config and root project reference; declare each consumer's
  `workspace:*` dependency. Shared code must not depend on artifacts.
- Database models belong in `lib/db/src/schema/`, one model per file, exported from
  its existing index. No models, migrations, or database changes are part of this task.

## Build phases and gates

1. **Structure baseline:** preserve existing files, document boundaries, check
   types and startup. No product functionality is implied by placeholders.
2. **Phase 0:** central-brand-driven design specification in root `DESIGN.md`
   and development component preview in `features/branding`. Preserve the
   reference byte-for-byte; maintain editable design guidance separately.
3. **Later product phases:** implement onboarding/access, models/contracts,
   policies/decisions, simulated funding and testnet integration only under their
   approved phase requirements. This map does not invent phase numbering or policy.
4. **Demo verification:** check the completed role flows and confirmed testnet
   evidence before describing them as working. Never imply real-money capability.

Do not install Hardhat, deploy contracts, add authentication/AI, or implement any
of these later features merely to populate the reserved folders.

## Test locations

- Frontend: colocate component/hook tests as `*.test.tsx`/`*.test.ts` with the owning
  feature or shared component. Future browser flows belong in `artifacts/trellis/tests/`.
- API: service unit tests alongside services; HTTP/integration tests in
  `artifacts/api-server/tests/`.
- Libraries: colocate tests with their source; database integration tests belong
  in `lib/db/tests/` and must use an explicit test database.
- Solidity: `contracts/test/`, once Phase 3 installs the agreed toolchain (Hardhat 3).

Baseline checks (Vitest, configured once in root `vitest.config.ts`) run with
`pnpm test`; select one project with `pnpm test --project <name>`:

| Project      | File                                                   | Guards                                                      |
| ------------ | ------------------------------------------------------ | ----------------------------------------------------------- |
| `api-server` | `artifacts/api-server/tests/health.test.ts`            | `GET /api/healthz` status and contract-valid payload         |
| `api-server` | `artifacts/api-server/src/services/ai/*.test.ts`       | policy builder and AI guard with the model stubbed: valid parse, PENDING fallback, rule pass-through |
| `trellis`    | `artifacts/trellis/vite-brand-plugin.test.ts`          | BRAND-filled `index.html`, base-path asset URLs, SVG output  |
| `trellis`    | `artifacts/trellis/src/components/trellis/primitives.test.ts` | runtime `brandAsset` URLs under `BASE_URL`            |
| `workspace`  | `scripts/tests/design-reference.test.ts`               | reference checksum; no code references the reference        |
| `workspace`  | `scripts/tests/product-spec.test.ts`                   | `docs/product-spec.md` size and checksum (never edit it)     |

A production build smoke check is opt-in because it runs a real `vite build`
(a few seconds). Run it with `pnpm test:build` (root `vitest.build.config.ts`)
after changing `artifacts/trellis/vite.config.ts`, the brand plugin, `public/`,
or BRAND asset paths:

| Project         | File                                               | Guards                                                                 |
| --------------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| `trellis-build` | `artifacts/trellis/tests/build-smoke.build-test.ts` | build with `BASE_PATH=/smoke/sub-path/`: favicon, `og:image` and entry script are prefixed; every BRAND asset is in the output and matches root `public/` |

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
Future Hardhat configuration belongs at `contracts/hardhat.config.ts` and must
read secrets from the environment, never include keys. There is intentionally no
contract package manifest or workspace/toolchain configuration yet.
Do not ignore the entire top-level `artifacts/` directory: it contains application
source. OpenAPI-generated TypeScript already tracked by the project is preserved;
it is distinct from disposable compiler and contract output.
