---
name: Design token decisions (mockup retheme)
description: Why some BRAND colors deviate from the app mockup, and where the dark palette lives.
---
- `colors.chain` is the mockup's dark sky ink, not its mid sky (#1f6f8b): the mid sky is only 4.4:1 on the sky background.
  **Why:** chain badges put small text on sky. **How to apply:** keep chain text ≥4.5:1 on chainBg when retheming.
- Decision pairs (approved/rejected/pending) are the mockup's exact values and are 3.6–4.3:1; the user asked for the mockup's pairs. Keep them bold + icon + label; changing them is a user decision.
- The dark palette is a top-level `BRAND.darkColors`, never nested in `colors`: app CSS injection, the deck plugin and /brand iterate `colors`, and the app has no dark mode.
- Text on lime is always `onSignature`; text on primary always `onPrimary`. White-on-lime fails contrast.
