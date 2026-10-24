---
name: Screen background image decisions
description: How the BRAND background image sits behind the phone column, the user's chosen strength, and the card-surface rule on top of it.
---
The user asked twice to make the cream-and-lime screen background lighter; it now shows at 35% over the plain surface (BRAND opacity setting, set 2026-10-24).

**Why:** at full strength the lime shapes competed with content; the user wants it subtle.

**How to apply:** don't raise the strength without asking. On a rebrand with a new image, re-tune the opacity alongside it.

Cards sitting on the background use the plain surface with a hairline border, not the off-white surface; small fills inside those cards (avatars, icon circles) flip to the off-white so they still read.

**Why:** off-white cards vanished into the cream.

**How to apply:** new panels on role screens follow the same rule.

The background is a fixed layer the width of the column inside an `isolate` column, not `background-attachment: fixed` (that sizes to the viewport and is ignored on iOS). Test ids for it must not start with `screen-`, which App tests use to find the active tab screen.

The user asked for a black bottom tab bar (primary fill, onPrimary text, signature pill on the active tab, white count badge).

**Why:** user preference stated while reviewing the lime background.

**How to apply:** keep the tab bar dark; anything placed on it uses onPrimary or signature/onSignature, never ink or inkMuted.
