# Dependent

The dependent's wallet (virtual card, spendable total and per-bucket limits)
and the swipe simulator: the seeded merchants as tiles, each tap sent to
`POST /api/swipes`, the server's decision shown full screen, and recent swipes.
Server decisions remain authoritative; the browser never decides or predicts a
purchase. Preset purchases live in `lib/swipe-presets.ts`.
