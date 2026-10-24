---
name: AI integration provisioning and live checks
description: Where Anthropic (Replit AI Integrations) can be provisioned and how AI code must behave when it isn't.
---
The Anthropic integration setup callback is not available inside isolated task environments, so the AI_INTEGRATIONS_ANTHROPIC_* env vars may be absent there. Provisioning and any live model checks must happen from the main session.

**Why:** Observed 2026-10-24 while building the policy builder and AI guard; only stubbed unit checks could run in the task.

**How to apply:** Keep the Anthropic client lazily loaded behind the stubbable model caller so a missing integration yields PENDING / "Needs a parent's review." rather than a startup crash. Before claiming AI behavior works end to end, confirm the env vars exist and run one real call.
