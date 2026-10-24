Build a full-stack, mobile-first web app for a hackathon demo. The working name is "Trellis," but the name, logo, colors, fonts, and demo names must ALL live in one central brand config so we can swap them instantly (see Phase 0). Build in phases, verify each phase works before moving on, and keep the code simple and readable. This is a one-day build and must demo reliably.

# PRODUCT SUMMARY
Families fund a shared "pot" of money for a dependent (a teen or college student) from multiple sources (parents, divorced co-parents, grandparents), split into spending buckets, with spending rules enforced BEFORE money is spent. The full bank + card stack is SIMULATED on the Monad blockchain (testnet): linked bank accounts, deposits, an issued card, card authorizations, and settlement to merchants. Every contribution, purchase, and approval is verifiable on-chain, so all funders can see exactly where their money went.

Problems we solve:
1. Funds come from multiple family members, and no one can see how their money is used.
2. Spending has no approval gate; parents only find out after the fact.
3. Auditing is a chore: hundreds of cryptic transactions to review.

Four pillars: POT (shared funding), ALLOCATION (buckets), APPROVAL (real-time decisions), TRANSPARENCY (plain-English, on-chain audit trail).

# ROLES
- Parent (admin): onboards, links a bank, creates the dependent profile, buckets, and policies, issues the card, invites funders, approves or rejects pending purchases, can freeze the card.
- Funder (e.g. grandparent, co-parent): links a bank, adds money to specific buckets, sees where their contributions were spent.
- Dependent: accepts the card, sees bucket balances, makes purchases (simulated card swipes), asks for approval when needed.

For the demo, add a ROLE SWITCHER pinned at the top (Parent / Grandparent / Dependent, names from the brand config) so one person can switch views instantly. Still use Replit Auth for the real login of the demo account.

# TECH STACK
- Frontend: React + Vite + Tailwind, mobile-first.
- Backend: Node.js + Express (TypeScript preferred).
- Database: Replit's built-in PostgreSQL.
- Auth: Replit Auth.
- AI: an LLM via Replit's AI integrations (or an API key in Secrets) for (a) turning plain-English rules into structured policy JSON and (b) the "AI guard" for ambiguous purchases. Always request strict JSON output and validate it.
- Blockchain: Monad TESTNET (EVM-compatible). Solidity contracts compiled, tested, and deployed with Hardhat; backend uses ethers.js v6.
- Real-time updates: Server-Sent Events, or polling every 2 seconds.

Secrets (I will fill these in): MONAD_RPC_URL, MONAD_CHAIN_ID, DEPLOYER_PRIVATE_KEY, MOCKUSD_ADDRESS and NETWORK_ADDRESS (set after deploy), MONAD_EXPLORER_URL, and an LLM API key if needed.

WALLETS: To avoid wallet-setup friction, the backend is the single on-chain operator using DEPLOYER_PRIVATE_KEY and records actions on behalf of users (user IDs stored as bytes32 in the contracts). TESTNET ONLY; no real money anywhere.

============================================================
# PHASE 0 — DESIGN SYSTEM + CENTRAL BRANDING (do this first)
============================================================

## 0.1 Reference file (read-only)
Fetch Venmo's DESIGN.md from https://www.shadcn.io/design/venmo/raw and save it unchanged as:
  /design/reference/venmo.DESIGN.md
Reference only: never edit it, never import it at runtime. If the fetch fails, stop and tell me; I'll upload it.

## 0.2 Our own DESIGN.md (the file we override)
Create /DESIGN.md at the project root, derived from the Venmo reference. It is the single source of truth for design and the file we edit whenever we want a new look. Include:
- Header note: "Derived from /design/reference/venmo.DESIGN.md. Edit this file, not the reference. All values live in /src/brand/brand.config.ts."
- Brand feel and principles, adapted from the reference.
- Colors, typography, spacing, radius, elevation, components, do's and don'ts, written as TOKEN NAMES (e.g. color.primary, radius.card), with current values shown for readability.
- Keep the reference's key rules: signature blue #008cff is atmospheric only (header gradient, hero balance card, virtual card), never a button fill; buttons are #0074de pills (1000px radius, 48px tall, padding 12px 34px); white and warm sand #f1efea surfaces with hard edges; hairline borders instead of shadows; 32px main card radius.
- An "App layer" section for everything the reference lacks:
  * Fonts: Venmo's fonts aren't available; use Inter (Google Fonts) with the reference's sizes, weights, line heights, and negative heading letter-spacing. Tabular numbers for money.
  * Decision colors: approved #16A34A on #DCFCE7, rejected #DC2626 on #FEE2E2, pending #D97706 on #FEF3C7, always paired with an icon and a label.
  * Layout: mobile-first at 390px; on desktop, center the app in a 430px phone-width column on the sand background.
  * App components: hero balance card, virtual card visual, bucket cards, activity feed rows, "Verified on Monad" badge (pale-blue pill linking to the explorer), role switcher (pill segmented control), bottom tab bar per role, onboarding step layout with progress dots, full-screen decision result card, swipe-simulator merchant grid, policy card, empty states, loading skeletons.
  * Motion: 150–250ms ease-out; decision card scales in from 0.95; virtual card animates in on "Accept card"; one subtle celebration when a funder adds money, nothing else.
  * Copy: short, friendly, plain English. Never show raw tx hashes as main text, only behind the "Verified on Monad" link.
- A "How to rebrand" section (see 0.5).

## 0.3 Central brand config (one file controls everything)
Create /src/brand/brand.config.ts exporting one typed object:

export const BRAND = {
  appName: "Trellis",
  tagline: "Family money, with guardrails.",
  logo: { mark: "/brand/logo-mark.svg", wordmark: "/brand/logo-wordmark.svg", alt: "Trellis logo" },
  favicon: "/brand/favicon.svg",
  ogImage: "/brand/og.png",
  colors: {
    signature: "#008cff", primary: "#0074de", primaryHover: "#005ba4", tint: "#deefff",
    ink: "#000000", inkMuted: "#2f3033",
    surface: "#ffffff", surfaceAlt: "#f1efea", hairline: "rgba(0,0,0,0.12)",
    approved: "#16A34A", approvedBg: "#DCFCE7",
    rejected: "#DC2626", rejectedBg: "#FEE2E2",
    pending: "#D97706", pendingBg: "#FEF3C7",
    chain: "#0074de", chainBg: "#deefff"
  },
  fonts: { heading: "Inter", body: "Inter", googleFontsUrl: "<Inter 400/500/600/700 URL>" },
  radius: { pill: "1000px", card: "32px", cardSm: "24px", tag: "4px", input: "8px" },
  spacing: [4, 8, 12, 16, 24, 32, 48],
  demo: {
    familyName: "The Rivera Family",
    parent: "Maya", funders: ["Grandma Rose", "Carlos"], dependent: "Leo", dependentAge: 19,
    cardLast4: "4242",
    banks: ["Demo Bank", "Sample Credit Union", "Test Savings"]
  },
  copy: { verifiedLabel: "Verified on Monad", askParentLabel: "Ask Parent" }
};

Rules:
- NO hardcoded app name, colors, fonts, radii, logo paths, demo names, or bank names anywhere else. Everything reads from BRAND.
- At startup, generate CSS variables from BRAND (--color-primary, --radius-card, etc.) and point the Tailwind theme at those variables.
- Page title, favicon, meta/OG tags, header logo, splash screen, virtual card art, and any copy mentioning the app name come from BRAND.
- All brand assets live in /public/brand/. Generate simple original placeholder SVGs for logo-mark, logo-wordmark (BRAND.appName in the heading font), and favicon. No Venmo logos or imagery.
- Seed data uses BRAND.demo values.

## 0.4 Brand preview page (dev only)
Hidden route /brand showing the logo, app name, tagline, color swatches with hex values, the type scale, buttons in every state, the virtual card, a bucket card, an activity row, the status pills, an onboarding step, and a decision result card. Not in the tab bar.

## 0.5 How to rebrand (document in DESIGN.md and README)
1. Edit /src/brand/brand.config.ts.
2. Replace files in /public/brand/ (same filenames).
3. Optionally update /DESIGN.md.
4. Open /brand to verify. No other file should need changes.

Then build a shared component library from DESIGN.md + BRAND and use it on every screen.

============================================================
# SMART CONTRACTS — SIMULATED BANK + CARD STACK ON MONAD
============================================================
Every on-chain concept mirrors a real-world card-issuing concept, so Monad's simulated rails can later be swapped for real ones (Plaid/ACH + Stripe Issuing).

## 1. MockUSD.sol — simulated dollars
- ERC20 "Test USD" (symbol tUSD), 2 decimals so 1 unit = 1 cent.
- Only the operator can mint (stands in for money arriving from a bank).

## 2. FamilyCardNetwork.sol — simulated bank + card issuer + network
Holds all tUSD and keeps internal ledgers. Only the operator (backend) can call write functions.

A) SIMULATED BANK (stands in for Plaid + ACH)
- linkBankAccount(userId, bankName, last4) → emits BankLinked (e.g. "Demo Bank ••4417")
- bankDeposit(userId, amount) → mints tUSD into the user's bank balance (simulated ACH); emits BankDeposit
- bankBalanceOf(userId) view

B) POT + BUCKETS
- createBucket(name, perTxLimit, approvalThreshold)
- fundBucket(funderId, bucketId, amount) → moves funds from the funder's bank balance into the bucket; records the contribution; emits BucketFunded
- Each bucket tracks: available, held (authorized, not yet settled), spent

C) SIMULATED CARD ISSUING (stands in for Stripe Issuing cards)
- issueCard(dependentId, last4, expiryMonth, expiryYear) → status Issued; emits CardIssued
- activateCard(cardId) → called when the dependent taps "Accept card"; status Active; emits CardActivated
- freezeCard(cardId) / unfreezeCard(cardId) → parent controls; emits CardFrozen / CardUnfrozen
- setBlockedCategory(category, blocked); emits CategoryBlocked

D) SIMULATED MERCHANTS (stands in for card-network merchant data)
- registerMerchant(merchantId, name, mcc, category, payoutAddress); emits MerchantRegistered
- Seed merchants with real MCC codes:
  Trader Joe's 5411 grocery · Campus Bookstore 5942 bookstore · The Tipsy Tavern 5813 bar · Liquor Barn 5921 liquor · Lucky Star Casino 7995 gambling · Steam 5816 gaming · Uber 4121 rideshare · Apple Store 5732 electronics · AMC 7832 movies

E) AUTHORIZATIONS (stands in for Stripe's real-time issuing_authorization.request)
- authorize(cardId, merchantId, amount, engineDecision, reasonCode, reason) → creates an Authorization {id, cardId, merchantId, amount, bucketId, status, reasonCode, reason, timestamp}
  On-chain hard checks, enforced even if the backend says "approve" (defense in depth). Decline with the reason code if:
    card not Active or frozen → card_inactive
    merchant category blocked → blocked_category
    amount > bucket available → insufficient_funds
    amount > perTxLimit → over_limit
  If approved: move amount from bucket.available to bucket.held (an authorization hold, like a real card).
  If pending: no hold; status Pending (needs_approval or outside_hours).
  Emits AuthorizationCreated.
- capture(authId) → settles: transfers tUSD from held to the merchant's payoutAddress; held → spent; emits AuthorizationCaptured. The backend auto-captures right after approval.
- resolvePending(authId, approved, parentId) → parent decision; emits AuthorizationResolved.
- grantTemporaryPass(cardId, merchantId, maxAmount, expiresAt) → mirrors the real-world flow (decline → ask → parent approves → retry). A matching authorize() within the pass limits is approved even above the approval threshold. Emits TempPassGranted.

Reason codes (mirror card-network decline reasons): approved, blocked_category, insufficient_funds, over_limit, card_inactive, needs_approval, outside_hours.

## Approval flow (realistic, like real cards)
Dependent swipes → Pending → taps "Ask Parent" → parent approves → backend calls resolvePending + grantTemporaryPass (that merchant, that amount, 10 minutes) → backend AUTOMATICALLY re-runs the same authorization → Approved → captured. The dependent's screen flips to Approved within ~1 second, and the activity feed shows the full chain: Pending → Parent approved → Approved → Settled, each with an explorer link.

## Events → Postgres
Index all events into Postgres for fast UI reads. Every UI row stores its tx hash.

## Hardhat tests
- Blocked category declines (blocked_category)
- Frozen card declines (card_inactive)
- Insufficient funds declines
- Approve → hold → capture moves tUSD to the merchant payout address
- Pending → resolvePending + temp pass → retry approves
- Funding a bucket attributes the contribution to the funder

## Deploy script
Deploys MockUSD + FamilyCardNetwork, then seeds: linked demo bank accounts for each funder and the parent, bank deposits, the three buckets funded by different funders, the blocked categories, all merchants, and an issued + activated card for the dependent (last4 from BRAND.demo.cardLast4).

============================================================
# DECISION ENGINE (backend — the core of the product)
============================================================
Swipe payload:
{ cardId, dependentId, merchantId, merchantName, mcc, merchantCategory, items: [string], amount (cents), location, timestamp }

Evaluate in this order (explain it in code comments):
1. DETERMINISTIC RULES FIRST (instant, same result every time):
   - Card frozen or inactive → REJECT (card_inactive)
   - Category blacklist (bar, liquor, gambling, nightclub, gaming) → REJECT (blocked_category)
   - Merchant blacklist → REJECT; merchant whitelist → skip the AI guard
   - Map category → bucket via a lookup table (grocery/restaurant → Food, bookstore/school supplies → School, movies/bowling/concerts → Social, rideshare/transit → Transit)
   - Insufficient bucket balance → REJECT (insufficient_funds; "Not enough left in Food: $6.20 remaining")
   - Amount > perTxLimit → REJECT (over_limit)
   - Valid temporary pass for this merchant and amount → APPROVE
   - Time window (e.g. no purchases 11pm–6am) → PENDING (outside_hours)
   - Amount > approvalThreshold → PENDING (needs_approval)
2. AI GUARD (only if no hard rule decided AND the category mapping is ambiguous or the items look suspicious): send the payload + family policy to the LLM. It returns JSON { bucket, confidence (0–1), verdict: "approve" | "flag", reason }. If confidence < 0.7 or verdict = "flag" → PENDING. THE AI CAN NEVER OVERRIDE A HARD RULE; it can only approve within the rules or escalate to the parent.
3. RESULT: APPROVED / REJECTED / PENDING, always with a one-sentence plain-English reason a teenager would understand, the reason code, and "decided by: Rule" or "decided by: AI guard".
4. Call authorize() on Monad (then capture() if approved), store the result + tx hashes in Postgres, and push a real-time update to all screens.

============================================================
# NATURAL-LANGUAGE POLICY BUILDER
============================================================
The parent types rules in plain English, e.g.:
"Leo gets $100 a week for food, nothing at bars or casinos, no gaming, and ask me before anything over $75."
The LLM converts this into structured JSON (buckets, limits, blocked categories, approval threshold, time windows). Show a POLICY CARD summarizing the parsed rules for the parent to confirm. On confirm, save to Postgres and write hard limits + blocked categories on-chain.

============================================================
# ONBOARDING FLOWS (all three roles)
============================================================
Keep each flow to max 5 steps, skippable, built from DESIGN.md + BRAND, with progress dots, one question per screen, big pill buttons, a back button on every step, and inputs that keep their values. Store onboarding progress in Postgres so users resume where they left off. Add a "Skip to demo" link on every onboarding screen. Every on-chain step shows "Confirming…" then "Verified on Monad"; never block progress on the chain.

## Parent onboarding (primary user)
1. Welcome: logo, BRAND.tagline, "Get started" (Replit Auth sign-in).
2. Two quick questions, single-tap answers:
   - "How much do you want to guide your dependent's spending?" → Light touch / Balanced / Hands-on
   - "How much visibility do you have into their spending today?" → None / Some / A lot
   Use the answers to pick a starting policy preset:
   - Light touch: high approval thresholds, only hard blocks (bars, casinos, liquor)
   - Balanced: default limits from seed data
   - Hands-on: low approval thresholds, also block gaming, late-night time window on
   Show "We set you up as Balanced. You can change this anytime."
3. Link bank account (simulated on Monad): pick from BRAND.demo.banks → "Demo Bank ••4417 linked" with a Verified on Monad badge → choose a starting deposit ($100 / $250 / $500) → bankDeposit on-chain.
4. Create dependent profile: first name, age, relationship (child / student / other), and what they need money for (multi-select buckets: Food, School, Social, Transit, Rent & Utilities, Tuition). Set each bucket's starting amount with a slider, plus an optional plain-English policy box ("anything else?") that goes through the NL policy builder and shows the policy card to confirm.
5. Issue card + invite: virtual card preview with the dependent's name → "Issue card" (issueCard on-chain) → invite link + QR code for the dependent, and an optional invite link for funders ("Invite Grandma"). Finish on the parent home screen.

## Dependent onboarding (from the invite link / QR)
Friendly, teen-appropriate tone. No personal info collected beyond the first name the parent already set.
1. Welcome: "{parent} set up a card for you." Three icons: "Spend from your buckets," "Some things need a quick OK," "Everyone can see where money goes."
2. Your buckets: each bucket with its balance and what it's for.
3. Your rules, in plain English: render the policy as friendly lines ("Bars and casinos are off-limits," "Purchases over $75 need a quick OK from {parent}"). Button: "Got it."
4. Accept your card: the virtual card animates in → "Accept card" calls activateCard on-chain → "Your card is active" with a Verified on Monad badge.
5. Try it: drop them into the swipe simulator with a tip: "Try a purchase to see how it works."

## Funder onboarding (from the parent's invite link)
1. Welcome: "{parent} invited you to help fund {dependent}'s pot."
2. Link bank account (same simulated flow as the parent).
3. Choose bucket(s) to support + amount → fundBucket on-chain → the one celebration animation.
4. Land on "Where my money went" (empty state: "You'll see every purchase your money covers, right here.").

Roadmap items (receipt requirements, recurring allowances, real bank linking) appear as greyed "Coming soon" options where relevant, not as working features.

============================================================
# MAIN SCREENS
============================================================
Parent:
1. Home: hero balance card (total pot), bucket cards (balance, held, spent this week, progress bar), pending approvals badge.
2. Approvals inbox: merchant, MCC, amount, items, bucket, AI reason; big Approve / Decline buttons. Approve triggers the temporary-pass + auto-retry flow.
3. Activity feed: every transaction in plain English, e.g. "Leo spent $18.40 on groceries at Trader Joe's — paid from Food (Grandma Rose's contribution)". Status pill + "Verified on Monad ↗" link per row; approval chains shown as a mini timeline.
4. Card & policy: virtual card with a Freeze toggle (instant, on-chain), NL policy builder, current policy card, blocked categories.
5. Settings: "Reset demo" with two options — "Reset with seeded family" (skips onboarding) and "Start fresh" (wipes the demo family to show onboarding live); a "How this maps to production" panel: Simulated bank → Plaid/ACH · tUSD → fiat balance · issueCard → Stripe Issuing card · authorize() → real-time authorization webhook · capture() → settlement; and a small "Coming soon" roadmap.

Funder:
1. Add money: from their linked demo bank into a chosen bucket → on-chain, with the celebration animation.
2. "Where my money went": purchases attributed to their contributions (FIFO per bucket, computed in the backend from events), e.g. "Your $50 → groceries ($18.40), textbooks ($24.00), $7.60 remaining."

Dependent:
1. Wallet: virtual card + hero balance + balance per bucket.
2. Swipe simulator: 2-column grid of the seeded merchants, each showing name, category + MCC (e.g. "Bar · MCC 5813"), and price, sending realistic payloads through the REAL decision engine:
   - Trader Joe's — $18.40 → APPROVED
   - Campus Bookstore — $24.00 → APPROVED
   - The Tipsy Tavern — $32.00 → REJECTED (blocked_category)
   - Steam — $14.99 → REJECTED (blocked_category)
   - Uber at 2:10am — $22.00 → PENDING (outside_hours / AI guard)
   - Apple Store — $129.00 → PENDING (needs_approval)
   - "Custom swipe" form for any merchant, category, items, amount
3. Decision result card: full-screen, animated, with the plain-English reason, the reason code in small text, decision time in ms, and on-chain status. For REJECTED or PENDING, an "Ask Parent" button that creates or highlights a pending request and notifies the parent screen in real time.

============================================================
# SEED DATA (first run, and "Reset with seeded family")
============================================================
Use BRAND.demo values. Family with a parent (admin), two funders (grandparent + co-parent in a separate household), and one dependent (19, college freshman). All onboarding marked complete.
- Linked demo bank accounts + deposits for the parent and each funder
- Buckets: Food ($150, per-tx limit $60, approval over $75), School ($200, per-tx $150, approval over $100), Social ($60, per-tx $40, approval over $30), funded by different funders
- Blocked categories: bar, liquor, gambling, nightclub, gaming
- All seeded merchants registered
- Card issued and activated for the dependent
- ~8 historical authorizations (mix of approved, declined, and one parent-approved chain) so dashboards aren't empty

============================================================
# RELIABILITY (this is a live demo)
============================================================
- The decision engine decides first (in milliseconds) and the UI shows it immediately. On-chain calls run right after: show "Confirming…", retry in the background, update to "Verified on Monad" when it lands. Never block the UI on the chain.
- Show measured decision time (ms) and on-chain confirmation time on result cards.
- LLM failure → fall back to PENDING with the reason "Needs a parent's review."

============================================================
# NON-GOALS (do not build)
============================================================
Real cards, real Plaid or bank linking, real money, receipt upload, returns/refunds, recurring allowances, push notifications, multiple families. Mention these only as "Coming soon."

============================================================
# BUILD PHASES (verify each before moving on)
============================================================
0. Design system + central branding. Verify /brand renders correctly.
1. Scaffold app, Replit Auth, Postgres schema, seed data, role switcher, all main screens with seeded data.
2. Decision engine + swipe simulator + result cards (no chain or AI yet). Verify all 6 preset swipes give the expected outcome.
3. MockUSD + FamilyCardNetwork contracts, Hardhat tests, deploy + seed on Monad testnet; wire bank, funding, card, authorize/capture, approvals, freeze, with tx hashes and explorer links.
4. AI guard + NL policy builder.
5. Onboarding flows for parent, dependent, and funder, plus the two Reset demo options.
6. Real-time updates, approval chain with temporary pass + auto-retry, "Where my money went" attribution, polish.
Final check: search the codebase for hardcoded hex colors, the string "Trellis", demo names, bank names, and font names outside /src/brand/ and DESIGN.md, and fix any you find. Then run "Start fresh" and complete all three onboarding flows plus one swipe in under 3 minutes.

============================================================
# DEMO SCRIPT THAT MUST WORK END TO END (seeded family)
============================================================
1. Grandparent: "Add money" $50 from Demo Bank into Food → on-chain.
2. Dependent: swipe The Tipsy Tavern (MCC 5813) → instant decline: blocked_category.
3. Dependent: swipe Trader Joe's → approved → settled to the merchant; the grandparent's "Where my money went" shows it.
4. Dependent: swipe Apple Store $129 → Pending → "Ask Parent."
5. Parent: approve → temporary pass → auto-retry → approved and settled within ~1 second, full chain visible in the activity feed.
6. Parent: freeze the card → dependent swipes anything → instant decline: card_inactive.

Start with Phase 0 now.
