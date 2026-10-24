# Family-spending demo

A testnet-only family-spending demo with parent guardrails. Bank and card
behavior is simulated; no real money moves. Contributor notes are in
[`replit.md`](replit.md), the design guide is [`DESIGN.md`](DESIGN.md), and the
folder map is [`docs/structure.md`](docs/structure.md).

## How to rebrand

1. Edit `/src/brand/brand.config.ts`.
2. Replace files in `/public/brand/` (same filenames).
3. Optionally update `/DESIGN.md`.
4. Open `/brand` to verify. No other file should need changes.

`/brand` is a development-only preview; restart the frontend workflow first so
generated logo files pick up the new values. See
[`DESIGN.md`](DESIGN.md#how-to-rebrand) for details and checks.
