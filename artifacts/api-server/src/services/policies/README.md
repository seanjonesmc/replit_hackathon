# Policies

Reserved for server-side policy management. HTTP handlers stay in `routes/`,
database models in `lib/db`. The `FamilyPolicy` schema and the plain-English
policy builder live in `../ai/`; reuse that schema rather than defining another.
