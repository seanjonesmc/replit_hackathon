---
name: Product scope and branding
description: User requirements governing the phased family-spending demo and brand source.
---
Build in phases and verify each before proceeding. The initial request explicitly says to start with Phase 0.

**Why:** The user needs a reliable one-day hackathon demo, not an unverified all-at-once implementation.

**How to apply:** Keep Phase 0 to branding, shared components, and the development preview; follow the uploaded master prompt for later phases.

The bank and card stack is simulated on Monad testnet only. No real money, real bank linking, real cards, refunds, receipt uploads, recurring allowances, push notifications, or multiple families.

**Why:** These are the user's explicit scope and non-goals.

**How to apply:** Label illustrative states honestly; never show blockchain verification without a confirmed transaction.

All names, visual tokens, asset paths, and demo identities must come from one central BRAND config. The Venmo design reference must remain unchanged and must never be imported at runtime.

**Why:** The user must be able to rebrand instantly and wants their own editable design specification derived from an immutable reference.

**How to apply:** Preserve the single configuration source when implementing subsequent phases rather than adding independent themes or hardcoded brand values.

The user subsequently requested a separate reusable design-system artifact based on the Venmo reference, to be presented before applying it to other artifacts.

**Why:** The visual system should be reviewed independently while folder-structure work proceeds separately. This changes the original app-only preview approach, not the central-brand requirement.

**How to apply:** Keep BRAND authoritative and generate the design system's interchange tokens from it. Complete the component review before migrating the app. Any future canvas mockup migration must use the design-system-specific sandbox entry and repoint existing frames.

The user approved the Venmo-derived first set of header, navigation, links, buttons, and hero bands with no revision notes.

**Why:** This establishes the accepted visual direction rather than reopening stylistic choices during subsequent component or app work.

**How to apply:** Extend that approved palette, geometry, typography, and flat-surface treatment consistently; retain the requested Inter substitution.
