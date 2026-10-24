# Record stack decisions and product spec

## What & Why
The user has agreed the tech stack for the remaining phases. Record each decision in the project docs, with a one-line reason and the phase that introduces it, so every later task builds on the same choices.

Also save the user's original product spec (their uploaded master prompt) in the repo. Today it exists only among the uploaded files, which git ignores, so later phases and anyone cloning the repo don't have the full requirements.

Finally, switch the published app to an always-on server. The transaction queue, background confirmation retries and server push depend on one.

## Decisions to record
- **Front end:** the existing React + Vite + Tailwind app, mobile-first. BRAND is the only source of names, colors, fonts and assets.
- **API:** the existing Express API, contract-first through the OpenAPI spec, with generated client hooks and validators.
- **Database:** Replit's built-in PostgreSQL through the existing Drizzle library.
  - Development and production databases are separate, and Publish applies schema changes to production.
  - Production starts without demo data. The app seeds the demo family itself when none exists, and the Reset demo action re-seeds it.
- **Login:** Replit Auth. Only the presenter signs in; the role switcher shows the other roles. Everyone who signs in needs a Replit account, which is acceptable for a presenter-only login.
- **AI:** Anthropic Claude through Replit AI Integrations. It needs no Anthropic account or API key, and usage is billed to the user's Replit credits.
  - Use a fast Claude model for the AI guard, because it sits in the purchase decision path. Use a stronger one for the plain-English policy builder.
  - Output must be strict structured JSON, validated before use.
  - Any failure or invalid output falls back to Pending with "Needs a parent's review".
  - The AI never overrides a hard rule.
- **Blockchain:** Monad testnet only (chain ID 10143).
  - Solidity contracts are built, tested and deployed with Hardhat 3 and its ethers toolbox, in the reserved contracts area. The API uses ethers v6.
  - Replit has no blockchain connector. The RPC URL, operator key, contract addresses and explorer URL live in Secrets under the names in the product spec: MONAD_RPC_URL, MONAD_CHAIN_ID, DEPLOYER_PRIVATE_KEY, MOCKUSD_ADDRESS, NETWORK_ADDRESS, MONAD_EXPLORER_URL.
  - Defaults from Monad's docs: public RPC https://testnet-rpc.monad.xyz, the MonadVision explorer at https://testnet.monadvision.com, and test gas from https://faucet.monad.xyz.
  - A paid RPC URL can replace the public one through the same secret.
- **On-chain rules:**
  - The API refuses to start unless it is connected to chain 10143.
  - There is one operator wallet, so transactions go out one at a time from a single queue.
  - Events are written to Postgres from our own transaction receipts; there is no separate indexer.
  - Development and production use separate contract deployments and, ideally, separate operator wallets, set through environment-specific secrets.
- **Live updates:** server push (Server-Sent Events) tells open screens to refresh their data. If the connection drops, screens automatically fall back to polling every 1–2 seconds.
- **Hosting:** the front end is served as static files, and the API runs on an always-on Reserved VM.
- **Testing:** the existing Vitest setup, plus Hardhat contract tests in Phase 3.
- **Not used:** Stripe, Plaid, email, file storage and other connectors, because real money, notifications and uploads are non-goals. GitHub is available for pushing the repo when the user is ready.

## Done looks like
- **Stack record:** One stack decision record in the docs lists every decision above, with its reason and the phase that introduces it. replit.md's stack summary links to it and agrees with it.
- **Product spec:** The original master prompt is in the repo at `docs/product-spec.md`, byte-for-byte identical to the upload. The plans for this task and Phase 1 are saved under `docs/plans/`.
  - replit.md and the folder map link to it.
  - Notes beside those links say that the stack record and later agreed decisions take precedence where they differ.
  - The notes also say BRAND remains the only source of brand values. The brand values written in the spec are expected there, and the spec is an allowed exception in any search for hardcoded brand values.
- **Hosting:** The project's publish configuration targets an always-on Reserved VM. The front end still publishes as static files, and the API keeps its health check.
- **Checks:** Nothing new is installed or wired up. Typecheck and the existing tests still pass, including the reference checks.

## Out of scope
- Setting up Replit Auth, the Anthropic integration, Hardhat, contracts, live updates or secrets. Each arrives in its own phase.
- Editing or reconciling the spec text. Known seed-data conflicts are settled when Phase 2 is planned.
- Publishing the app.
- Any application code changes.

## Steps
1. **Decision record:** Write the stack decision record from the list above, with the reason for each choice and the phase that introduces it. Link it from replit.md.
2. **Product spec:** Copy the uploaded master prompt byte-for-byte into the docs as the product spec, and verify the copy matches the original. The spec and the saved plans may already be committed; if so, verify them and don't add duplicates. Link it from replit.md and the folder map, with the notes described above. If the upload isn't available in your environment, don't reconstruct it from memory or from this plan; report that it's missing instead.
3. **Align existing docs:** Update replit.md's stack and baseline notes, and the folder map, only where they contradict these decisions. Keep the existing boundaries and phase gates.
4. **Hosting:** Change the project's publish target from Autoscale to Reserved VM using the platform's deployment configuration. Leave each artifact's build and serve settings unchanged.
5. **Check:** Run typecheck and the existing tests.

## Relevant files
- `.local/conversation-workspace/files/attached_assets/master-prompt_1792855308530.md`
- `replit.md`
- `docs/structure.md`
- `contracts/README.md`
- `scripts/tests/design-reference.test.ts`
- `.replit`
- `artifacts/api-server/.replit-artifact/artifact.toml`
- `artifacts/trellis/.replit-artifact/artifact.toml`
