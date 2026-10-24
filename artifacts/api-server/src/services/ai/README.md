# AI

Anthropic Claude through Replit AI Integrations (`@workspace/integrations-anthropic-ai`).
Import from `./index.ts` only. No routes, persistence or decision-engine wiring live here.

- `schemas.ts`: the shared `FamilyPolicy` schema (the only policy schema in the repo),
  the swipe payload, and the builder and guard contracts. Money is in whole cents.
- `policy-builder.ts`: `buildPolicyFromText` turns a parent's plain-English rules into
  a DRAFT policy for confirmation (stronger model). It saves nothing.
- `guard.ts`: `runAiGuard`, the backup check for purchases the rules didn't decide
  (fast model, thinking off, short timeout).
- `model.ts`: the stubbable model call, timeout and JSON extraction.

Guarantees:
- Model output is untrusted. It is validated with Zod before use.
- Never throws. Any failure, timeout or invalid output is PENDING with
  "Needs a parent's review."
- A hard rule always wins. A decided rule outcome is returned unchanged without a
  model call. The guard never rejects, and every AI approval is re-checked against
  the policy.
- Prompts contain no brand values. Names arrive only through inputs.
