---
name: Demo-screen motion rules
description: Scope and test quirks for animations on the demo screens (presets, count-ups, exits, reduced motion).
---

Motion is allowed only on the demo screens (sign-in, Add money, Swipe + result, Approvals, parent home/settlement, wallet balances, card freeze). Activity history, settings, insights, /brand and route changes stay still. One curve, durations 350/600/900 only; stagger gaps are separate (90ms, settlement 140ms).

**Why:** the user asked for "simple animations" to make the 90s demo video easy to follow, but DESIGN.md forbids decorative motion; the compromise was a scoped, documented preset list.

**How to apply:**
- Prefer CSS presets; framer-motion is used only where an exit is unavoidable (answered approvals). Shared components (ChainBadge) animate only via an opt-in prop so non-demo screens stay still.
- A result card that changes decision must keep the same React key, or it remounts and jumps instead of fading in place.
- happy-dom finishes framer-motion exits instantly, so tests can't see an exit in progress; overlays that must fade out stay mounted and drop their test id when hidden.
- Count-ups animate only on change (never on first load) unless given a `from`; tests that check a balance right after it changes must wait ~1s or stub reduced motion via a window.matchMedia spy.
