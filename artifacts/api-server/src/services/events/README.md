# Events

Contract events, indexed into Postgres from the API's own transaction receipts
(there is no separate indexer; see `docs/stack-decisions.md`).

- `recordReceiptEvents` (in `record-receipt.ts`, exported from `index.ts`)
  stores the decoded events from one confirmed receipt in `chain_events` and
  marks each owning row `confirmed` with the transaction hash, in one database
  transaction. Re-indexing a receipt never duplicates events.
- `submitInBackground` (in `background-submit.ts`) is the one way routes send
  a write after their database commit: it marks the owning row `submitted`
  with the hash, then `confirmed` through `recordReceiptEvents` once mined, or
  `failed`. It never rejects, so routes fire it with `void`. Without chain
  Secrets the row stays `not_submitted`. A confirmed row is never downgraded.
- `toChainRecord` turns a row's chain columns into the API shape; it adds the
  explorer link only for a confirmed row with a hash, so nothing claims
  on-chain verification it doesn't have.

Infrastructure logging stays in `src/lib/`; live delivery (SSE) arrives in Phase 6.
