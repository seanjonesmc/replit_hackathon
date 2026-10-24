# Policies

Server-side policy management. HTTP handlers stay in `routes/`, database models
in `lib/db`. The `FamilyPolicy` schema and the plain-English policy builder live
in `../ai/`; reuse that schema rather than defining another.

- `policy.ts`: `getFamilyPolicy` loads the family's stored policy (one row per
  family, plus its time zone and preset name) and its buckets, and returns the
  policy in FamilyPolicy shape, validated. Per-bucket limits and approval
  thresholds stay on the buckets.

Saving a policy (the policy builder's confirm step) is not implemented yet.
