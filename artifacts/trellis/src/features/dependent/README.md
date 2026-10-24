# Dependent

The dependent's wallet (virtual card, spendable total and per-bucket limits)
and the swipe simulator: the seeded merchants as tiles, each tap sent to
`POST /api/swipes`, the server's decision shown full screen, and recent swipes.
A pending result shows the request as sent and checks
`GET /api/authorizations/{id}` every second until the parent answers, then
shows the retry's decision or "Parent declined". The custom purchase sheet
swipes any store, items, amount and family-clock time.
Server decisions remain authoritative; the browser never decides or predicts a
purchase. Preset purchases live in `lib/swipe-presets.ts`.
