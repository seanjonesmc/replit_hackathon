# Visual guidelines

This is a project adaptation of the curated Venmo DESIGN.md, not an official Venmo system.
Use interactive blue for actions and signature blue only for atmospheric surfaces.
Switch white and warm sand at hard edges; use hairlines, not shadows.
Buttons are 48px high, 1000px pills with 12px 34px padding. Display headings are medium-weight with negative tracking.
Inter replaces Athletics, Scto Grotesk A, and footer fonts at the user's request.
Dark mode is derived, not extracted. Decisions use the app's semantic colors with icons and labels.
Use original project branding, never Venmo marks or regulatory claims.

Only the first five families are implemented. Read docs/references/component-inventory.md and the per-family reference before changes.
Root BRAND remains the authoring source; tokens.json and brand snapshot/variables are generated interchange outputs. Run pnpm tokens after editing BRAND. This project-specific build adapter needs root BRAND; template export must first make it self-contained.
