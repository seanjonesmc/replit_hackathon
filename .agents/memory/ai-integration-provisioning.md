---
name: AI integration provisioning and live checks
description: Where Anthropic (Replit AI Integrations) can be provisioned and how AI code must behave when it isn't.
---
The Anthropic integration setup callback is not available inside isolated task environments, so the AI_INTEGRATIONS_ANTHROPIC_* env vars may be absent there. Provisioning and any live model checks must happen from the main session.

**Why:** Task environments have no setup callback and the integration search lists no Anthropic entry, so only stubbed checks can run there. A project task created solely to provision it cannot finish either.

**Don't** plan provisioning or live AI checks as a project task; do them directly in the main chat.

Provisioned from the main session on 2026-10-24 with the user's consent (usage billed to Replit credits); live calls to both the policy builder and the guard returned real, non-fallback answers.

To run a live check without tsx (not installed): bundle a throwaway script with esbuild from inside the API server folder. Keep pino external and add a createRequire banner, then run it with node and delete it.

**How to apply:** Keep the Anthropic client lazily loaded behind the stubbable model caller so a missing integration yields PENDING / "Needs a parent's review." rather than a startup crash. Before claiming AI behavior works end to end, confirm the env vars exist and run one real call.
