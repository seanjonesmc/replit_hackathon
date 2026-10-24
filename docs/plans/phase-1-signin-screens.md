# Phase 1: sign-in and main screens

## What & Why
Phase 0 (brand config, design guide, brand preview) is merged. Phase 1 turns the preview into the working app shell:
- the presenter signs in;
- the database holds the demo family, seeded from BRAND;
- every main screen for the three roles shows that data, with a role switcher to move between them.

Purchases, decisions, on-chain activity and AI arrive in Phases 2–4, so this phase is read-only apart from sign-in. Verify it before Phase 2 starts.

Agreed stack for this phase:
- Replit Auth for login.
- Replit's built-in PostgreSQL through the existing Drizzle library.
- The existing OpenAPI-first Express API and its generated client hooks.
- The existing React app and its brand components.
- BRAND as the only source of names, colors, fonts and bank names.

This plan authorizes pushing the new schema to the development database.

## Done looks like
- **Sign-in:** When signed out, the app shows a branded welcome screen (logo, tagline, "Log in"). Signing in with Replit Auth lands on the parent home, and "Log out" works. UI text never names the login provider.
- **Access:** Every family endpoint rejects signed-out requests. There is one shared demo family, since multiple families are a non-goal, and any signed-in account sees it.
- **Seeding:** The demo family is created automatically when none exists. Running seeding again never duplicates data. The seed contains:
  - the parent (admin), the two funders (grandparent and co-parent) and the dependent (age from BRAND.demo, college freshman), all with onboarding marked complete
  - linked demo bank accounts, named from BRAND.demo.banks, with deposits for the parent and each funder
  - three buckets funded by different funders:
    - Food: $150, per-purchase limit $60, approval over $75
    - School: $200, limit $150, approval over $100
    - Social: $60, limit $40, approval over $30
  - blocked categories: bar, liquor, gambling, nightclub, gaming
  - merchants (MCC, category):
    - Trader Joe's: 5411, grocery
    - Campus Bookstore: 5942, bookstore
    - The Tipsy Tavern: 5813, bar
    - Liquor Barn: 5921, liquor
    - Lucky Star Casino: 7995, gambling
    - Steam: 5816, gaming
    - Uber: 4121, rideshare
    - Apple Store: 5732, electronics
    - AMC: 7832, movies
  - a card issued and active for the dependent, ending in BRAND.demo.cardLast4
  - about 8 purchases from the past few days: a mix of approved and declined, plus one that went pending, was approved by the parent, and then settled
  - bucket balances (available, held, spent) that agree with the seeded deposits and purchases
- **Role switcher:** It is pinned at the top and switches instantly between parent, grandparent and dependent, with names from BRAND.demo. Each role has its own bottom tab bar.
- **Parent screens:**
  - Home: hero total-pot card; bucket cards showing available, held and spent this week, with a progress bar; a pending-approvals badge.
  - Approvals: an inbox with an empty state.
  - Activity: plain-English rows such as "Leo spent $18.40 on groceries at Trader Joe's — paid from Food", each with a status pill. The approval chain shows as a mini timeline.
  - Card & policy: the virtual card, the current policy card and the blocked categories.
  - Settings: a "How this maps to production" panel (simulated bank → Plaid/ACH, test dollars → fiat balance, card issuing → Stripe Issuing, authorization → real-time authorization webhook, capture → settlement) and a greyed "Coming soon" roadmap (receipt requirements, recurring allowances, real bank linking).
- **Funder screens:**
  - Add money: their linked bank and bucket choices.
  - Where my money went: their contributions. With none, it shows "You'll see every purchase your money covers, right here."
- **Dependent screen:** Wallet, with the virtual card, hero balance and balance per bucket.
- **Later-phase controls:** Approve/decline, freeze, add money, the policy builder, reset demo and swipe are visible but disabled, never faked.
- **No chain claims:** No row shows "Verified on Monad" or an explorer link. Records show an honest "not on chain yet" state.
- **Layout and formatting:** Mobile-first at 390px. On desktop the app sits in a centred 430px column on the sand background. Money is stored in cents and shown with tabular numbers. Loading skeletons and empty states follow the design guide.
- **Brand preview:** The Phase 0 preview moves to a hidden /brand route that is development-only and not in any tab bar.
- **Checks:** Typecheck and all existing tests pass, including the brand and sub-path build checks.

## Out of scope
- Swipe simulator, decision engine and result cards (Phase 2).
- Contracts, Hardhat, and any on-chain call or explorer link (Phase 3).
- Anthropic setup, the AI guard and the policy builder (Phase 4).
- Onboarding flows and the two Reset demo actions (Phase 5).
- Live updates, temporary pass with auto-retry, and the contribution-attribution math behind "Where my money went" (Phase 6).
- Restricting the demo to specific accounts.
- Moving the app onto the shared design-system package.
- Resolving spec conflicts that affect Phase 2's preset swipes. Seed the values as written. The conflicts (since settled in [demo-preset-swipes.md](demo-preset-swipes.md)):
  - Food's per-purchase limit is below its approval threshold.
  - There is no Transit bucket or late-night window for the 2:10am Uber preset.
  - Electronics is missing from the category-to-bucket map.

## Steps
1. **Sign-in:** Add Replit Auth to the API and the web app using the platform's standard setup. Store sessions in Postgres, add a branded signed-out screen, and require sign-in on all family endpoints.
2. **Data model:** Define the family data model in the shared database library and push it to the development database. It covers family, members and roles, linked demo banks and deposits, buckets, contributions, card, merchants, blocked categories and policy. Purchases carry decision fields, approval-chain links, and empty on-chain status and transaction fields for Phase 3.
3. **Seeding:** Create the demo family from BRAND.demo and the values above when none exists. Make it idempotent and reusable by Phase 5's reset.
4. **Read API:** Define read endpoints in the OpenAPI spec, each shaped for a screen: overview, buckets, activity, approvals, card and policy, funder contributions, dependent wallet. Implement them and regenerate the client hooks and validators.
5. **App shell:** Replace the root preview with the signed-in app: a phone-width column, the role switcher, and per-role tab bars and routes. Move the brand preview to development-only /brand.
6. **Shared pieces:** Extract the hero balance card, bucket card, activity row, virtual card and policy card from the Phase 0 preview into shared components that both the screens and the preview use.
7. **Screens:** Build the parent, funder and dependent screens on the generated hooks, with loading, empty and disabled states.
8. **Verify:**
   - Run typecheck and tests. Where practical, add focused tests for rejecting signed-out requests and for seeding idempotency.
   - Click through every role and screen at phone width.
   - Search for hardcoded brand, demo or bank names outside the brand config.

## Relevant files
- `.local/conversation-workspace/files/attached_assets/master-prompt_1792855308530.md`
- `DESIGN.md`
- `docs/structure.md`
- `src/brand/brand.config.ts`
- `lib/api-spec/openapi.yaml`
- `lib/db/src/schema/index.ts`
- `lib/db/drizzle.config.ts`
- `artifacts/api-server/src/app.ts`
- `artifacts/api-server/src/routes/index.ts`
- `artifacts/trellis/src/App.tsx`
- `artifacts/trellis/src/features/branding/BrandPreview.tsx`
- `artifacts/trellis/src/components/trellis/primitives.tsx`
- `artifacts/trellis/src/lib/preview-data.ts`
