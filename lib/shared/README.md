# Shared utilities (reserved)

Future pure, cross-package logic belongs in a focused library here or another
appropriately named `lib/*` package, never in an artifact imported by another app.
This folder is not an importable package yet; do not add empty exports or a package
manifest until there is actual shared behavior. See `docs/structure.md` for setup.
