# Events

Contract events, indexed into Postgres from the API's own transaction receipts
(there is no separate indexer; see `docs/stack-decisions.md`).

- `recordReceiptEvents` (in `record-receipt.ts`, exported from `index.ts`)
  stores the decoded events from one confirmed receipt in `chain_events` and
  marks each owning row `confirmed` with the transaction hash, in one database
  transaction. Re-indexing a receipt never duplicates events.
- Nothing calls it yet; the Phase 3 chain adapter will. Until then every
  mirrored row stays `not_submitted`, and nothing may claim on-chain verification.

Infrastructure logging stays in `src/lib/`; live delivery (SSE) arrives in Phase 6.
