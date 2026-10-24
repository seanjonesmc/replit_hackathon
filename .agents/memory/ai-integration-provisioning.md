---
name: AI integration provisioning and live checks
description: Where Anthropic (Replit AI Integrations) can be provisioned and how AI code must behave when it isn't.
---
The Anthropic integration setup callback is not available inside isolated task environments, so the AI_INTEGRATIONS_ANTHROPIC_* env vars may be absent there. Provisioning and any live model checks must happen from the main session.

**Why:** Task environments have no setup callback and the integration search lists no Anthropic entry, so only stubbed checks can run there. A project task created solely to provision it cannot finish either.

**Don't** plan provisioning or live AI checks as a project task; do them directly in the main chat.

The integration is provisioned for this project with the user's consent; its usage is billed to Replit credits.

**How to apply:** Keep the Anthropic client lazily loaded behind the stubbable model caller so a missing integration yields PENDING / "Needs a parent's review." rather than a startup crash. Before claiming AI behavior works end to end, confirm the env vars exist and run one real call.
