# Stack decisions

The agreed technology choices for every build phase. Each decision lists why it
was made and the phase that introduces it. Phase numbers are the build phases in
the [product spec](product-spec.md#build-phases-verify-each-before-moving-on):

| Phase | Scope                                                                          |
| ----- | ------------------------------------------------------------------------------ |
| 0     | Design system and central branding (done)                                      |
| 1     | App shell, sign-in, database schema, seed data, role switcher, main screens    |
| 2     | Decision engine, swipe simulator, result cards (no chain or AI)                |
| 3     | Contracts, Hardhat tests, Monad testnet deploy and wiring                      |
| 4     | AI guard and plain-English policy builder                                      |
| 5     | Onboarding flows and the two Reset demo actions                                |
| 6     | Live updates, approval chain with temporary pass and auto-retry, attribution   |

**Precedence:** where this record differs from the product spec, this record
wins (see [Differences from the product spec](#differences-from-the-product-spec)).
Decisions agreed later, in an approved phase plan under [plans/](plans/) or in
`replit.md`, win over both. Update this file when a decision changes.

Recording a decision does not install anything. Each tool or integration is set
up by the phase that introduces it, not earlier.

## Front end

- **React + Vite + Tailwind, mobile-first, in the existing `artifacts/trellis` app.**
  _Why:_ it already carries the approved Phase 0 brand components, and the demo
  is shown at phone width. _Phase:_ 0 (in place).
- **BRAND (`src/brand/brand.config.ts`) is the only source of names, colors,
  fonts and assets.** _Why:_ rebranding must be a one-file change.
  _Phase:_ 0 (in place); every later phase must keep it.

## API

- **The existing Express API, contract-first through `lib/api-spec/openapi.yaml`,
  with generated client hooks (`lib/api-client-react`) and validators (`lib/api-zod`).**
  _Why:_ the front end and API share one typed contract, so they cannot drift and
  nobody hand-writes fetch code. _Phase:_ 0 (scaffold, health only); the first
  product endpoints arrive in Phase 1.

## Database

- **Replit's built-in PostgreSQL through the existing Drizzle library (`lib/db`).**
  _Why:_ it is already in the workspace and needs no outside account.
  _Phase:_ 1.
- **Development and production databases are separate; Publish applies schema
  changes to production.** _Why:_ that is how the platform provisions databases,
  so schema changes are made and pushed in development, never by hand in
  production. _Phase:_ 1 (first schema), effective at the first publish.
- **Production starts without demo data. The app seeds the demo family itself
  when none exists, and the Reset demo action re-seeds it.** _Why:_ the published
  demo must work on first visit with no manual data entry, and the same seeding
  code serves both cases. _Phase:_ 1 (self-seeding); 5 (Reset demo).

## Login

- **Replit Auth. Only the presenter signs in; the role switcher shows the other
  roles.** _Why:_ it is built in and the spec requires it, while one person
  presents all three roles. Everyone who signs in needs a Replit account, which
  is acceptable for a presenter-only login. _Phase:_ 1.

## AI

- **Anthropic Claude through Replit AI Integrations.** _Why:_ it needs no
  Anthropic account or API key; usage is billed to the user's Replit credits.
  _Phase:_ 4.
- **A fast Claude model for the AI guard; a stronger one for the plain-English
  policy builder.** _Why:_ the guard sits in the purchase decision path, where
  latency matters; the policy builder runs rarely and accuracy matters more.
  _Phase:_ 4.
- **Output is strict structured JSON, validated before use.** _Why:_ model output
  is untrusted input. _Phase:_ 4.
- **Any failure or invalid output falls back to Pending with "Needs a parent's
  review".** _Why:_ an AI problem must never approve a purchase or block the demo.
  _Phase:_ 4.
- **The AI never overrides a hard rule.** _Why:_ deterministic rules are the
  guarantee parents rely on; the AI may only approve within them or escalate.
  _Phase:_ 2 (rules run first), enforced again in 4.

## Blockchain

- **Monad testnet only (chain ID 10143).** _Why:_ the spec is testnet-only; no
  real money anywhere. _Phase:_ 3.
- **Solidity contracts are built, tested and deployed with Hardhat 3 and its
  ethers toolbox, in the reserved `contracts/` area. The API uses ethers v6.**
  _Why:_ the spec names Hardhat and ethers v6; the ethers toolbox keeps contract
  scripts and the API on the same library. _Phase:_ 3.
- **Configuration lives in Secrets under the spec's names: `MONAD_RPC_URL`,
  `MONAD_CHAIN_ID`, `DEPLOYER_PRIVATE_KEY`, `MOCKUSD_ADDRESS`, `NETWORK_ADDRESS`,
  `MONAD_EXPLORER_URL`.** _Why:_ Replit has no blockchain connector, and the
  operator key must never be in the repo. _Phase:_ 3.
- **Defaults from Monad's docs:** public RPC `https://testnet-rpc.monad.xyz`,
  the MonadVision explorer at `https://testnet.monadvision.com`, and test gas
  from `https://faucet.monad.xyz`. _Why:_ they are the official testnet
  endpoints. _Phase:_ 3.
- **A paid RPC URL can replace the public one through the same secret.**
  _Why:_ the public endpoint may be rate-limited during the demo; switching needs
  no code change. _Phase:_ 3.

## On-chain rules

- **The API refuses to start unless it is connected to chain 10143.** _Why:_ it
  makes a wrong-network or mainnet connection impossible rather than unlikely.
  _Phase:_ 3.
- **One operator wallet, so transactions go out one at a time from a single
  queue.** _Why:_ one sender needs strictly ordered nonces; parallel sends
  collide. _Phase:_ 3.
- **Events are written to Postgres from our own transaction receipts; there is
  no separate indexer.** _Why:_ the API is the only writer, so its receipts
  already contain every event, and there is one less service to run.
  _Phase:_ 3.
- **Development and production use separate contract deployments and, ideally,
  separate operator wallets, set through environment-specific secrets.**
  _Why:_ demo resets and test swipes in development must not touch the published
  demo's on-chain state or nonces. _Phase:_ 3.

## Live updates

- **Server push (Server-Sent Events) tells open screens to refresh their data.
  If the connection drops, screens automatically fall back to polling every
  1–2 seconds.** _Why:_ updates only flow from server to screen, so SSE is
  enough and simpler than WebSockets; the fallback keeps the approval flip
  within about a second when push is unavailable. _Phase:_ 6.

## Hosting

- **The front end is served as static files, and the API runs on an always-on
  Reserved VM.** _Why:_ the front end needs no server; the transaction queue,
  background confirmation retries and server push need a process that stays up,
  which Autoscale does not guarantee. _Phase:_ publish target set before
  Phase 1; the always-on need starts in Phase 3 and grows in Phase 6.

## Testing

- **The existing Vitest setup (`pnpm test`), plus Hardhat contract tests.**
  _Why:_ one runner for app, API and workspace checks is already in place;
  contract behavior is best tested in Hardhat itself. _Phase:_ 0 (Vitest, in
  place); 3 (Hardhat tests in `contracts/test/`).

## Not used

- **Stripe, Plaid, email, file storage and other connectors.** _Why:_ real money,
  notifications and uploads are non-goals; the bank and card stack is simulated
  on Monad testnet.
- **GitHub** is available for pushing the repo when the user is ready; nothing
  in the build depends on it.

## Differences from the product spec

The spec text is kept unchanged. These decisions refine it:

| Spec says                                                        | Decided                                                            |
| ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| "An LLM via Replit's AI integrations (or an API key in Secrets)" | Anthropic Claude through Replit AI Integrations; no LLM API key    |
| "Server-Sent Events, or polling every 2 seconds"                 | SSE first, with automatic polling every 1–2 seconds as a fallback  |
| "Hardhat"                                                        | Hardhat 3 with its ethers toolbox                                  |
| "Index all events into Postgres"                                 | Written from our own transaction receipts; no separate indexer     |
| Seed data on first run                                           | Production starts empty and the app seeds itself when none exists  |
| Hosting not specified                                            | Static front end; API on an always-on Reserved VM                  |

Known conflicts in the spec's seed data and preset swipes are settled when
Phase 2 is planned, not here.
