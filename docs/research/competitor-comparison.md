# Trellis vs. kids' card apps, P2P apps and cash

For the judge question "why not Greenlight or Acorns Early?"

- All competitor pages were accessed on 24 October 2026. Every competitor claim
  links to that company's own terms, pricing, fee disclosure or help page.
- **Trellis is a testnet-only demo.** It has no real money, no bank linking, no
  cards, no identity checks and no pricing. The competitors are real, regulated
  products. The Trellis row describes what the demo is built to show, and all of
  it is simulated. It describes the planned demo scope (the current build is
  Phase 0, branding only). Before the pitch, update it to match what the demo
  actually shows.
- "Not found" means we did not find the feature in the pages we read. It does
  not prove that the product lacks it.

## Bottom line

1. **Incumbents already have guardrails, spending visibility and gifts from
   relatives.** Greenlight and Acorns Early both let relatives send money and let
   parents set spending controls. Venmo and Cash App teen accounts show parents
   their teens' spending. Trellis did not invent any of these.
2. **The gaps we can source are narrower:**
   - **Funders must be in the US.** Kids' card and P2P apps require US-resident
     account holders, and Greenlight's gift and pay-link senders need a US billing
     address. Zelle needs US bank accounts on both sides. A grandparent abroad
     can't fund these accounts directly.
   - **Age limits.** Acorns Early is for ages 6–18. Venmo Teen covers ages 13–17.
     Cash App sponsorship ends when the teen verifies at 18. Greenlight states no
     upper age, so don't say "Greenlight stops at 18."
   - **Subscriptions.** Greenlight costs $5.99–$19.98 a month and Acorns Early
     costs $8 or $12 a month. Cash App's family accounts have no monthly fee, so
     cost is an argument against kids' card apps only.
3. **What the demo adds to the discussion** is spending linked to each funder
   (who put money in, and what it paid for), shown to the parent and the funders,
   plus a public testnet record for each confirmed action. We did not find
   per-funder attribution in the pages we read.

## Comparison

| | Who can add money | Where funders must be | Dependent's age | Parent guardrails | Spending visibility | Price |
|---|---|---|---|---|---|---|
| **Greenlight** | Parent; an "Authorized Approver" (e.g. a relative) can link a funding account ([agreement][gl-terms]); anyone with a [pay link or Gift][gl-ff] | Account holder: US citizen or lawful resident, 18+, SSN/ITIN ([§3.4][gl-terms]). Pay-link/Gift senders need a [US billing address][gl-ff]; Gift senders must be [18+ US citizens][gl-gift] | No upper limit stated. Cards go to a "child or other individual" the parent/guardian is responsible for, with re-verification at 18 ([agreement][gl-terms]) | [Category- or store-level spend controls][gl-spend] | Parent can "monitor and approve" card transactions ([agreement][gl-terms]) | [$5.99–$19.98/month][gl-plans], up to 5 kids |
| **Acorns Early** | Parent, co-parent, ["Relative" accounts and Giftlinks][ac-gift] ([terms §11][ac-terms]) | Platform is for US citizens/lawful residents located in the US with a US-issued SSN/TIN ([terms §11.9][ac-terms]). Relatives' location rules: not found | Cards for ages [6–18][ac-terms] | [Spending limits, card block][ac-early]; merchant-category blocks ([terms][ac-terms]) | [Real-time spending notifications][ac-early] | [$8 or $12/month][ac-fees] per parent, up to 4 kids |
| **Venmo Teen** | Parent; teens can receive [P2P payments from friends and family][vm-teen] | Account holders must be [US residents, 18+][vm-ua] | [13–17][vm-teen] | Venmo-set [limits][vm-limits] and [merchant restrictions][vm-teen]; parent can [lock the card][vm-manage]. Parent-set budgets: not found | Parent can ["view all spending activity"][vm-teen] and is notified | Not checked |
| **Cash App** (family accounts) | Sponsoring parent/guardian; sponsor controls ["approved contacts"][ca-fam] | Account holders must be [US residents, 18+][ca-tos] | Managed 6–12, sponsored 13–17 ([families][ca-fam]); sponsor loses visibility once the teen verifies at 18 ([turning 18][ca-18]) | Parents set ["how much … and where"][ca-fam] | [Real-time transactions and history][ca-fam] | [No monthly fees][ca-fam] |
| **Zelle** | Anyone with an eligible US bank account | Sender and recipient need [US bank accounts][z-intl] | [Set by the bank][z-age] | Not a Zelle feature in the [FAQ][z-intl]; depends on the recipient's bank | Same: depends on the recipient's bank | [Typically no fees][z-intl] (check with the bank) |
| **Cash** | Anyone in person | In person | Any | None after handover | None. Still used by 73% of parents who give an allowance ([problem statement C1](problem-statement.md#c-cash-vs-digital-and-how-much-parents-can-see)) | Free |
| **Trellis (demo)** | Parent and other funders (simulated roles) | Not restricted in the demo **because there are no identity checks**. A real product would need its own compliance, which could bring residency rules back | Not modeled | Parent sets spending rules; the server decides | Parent sees spending; funders see what their money paid for | None (not a product) |

Card use abroad isn't a gap. Greenlight cards work in most countries with
[no foreign-transaction fees][gl-intl] (31 countries unsupported), and Acorns
Early charges [0% on international transactions][ac-fees].

## What not to say

| Avoid | Why | Say instead |
|---|---|---|
| "Kids' cards don't work abroad" | False. See above | "The cards work abroad, but the funders have to be in the US." |
| "Trellis lets grandparents abroad send money" | The demo has no real money and no identity checks | "In our demo, a funder anywhere can contribute testnet funds. A real version would need its own compliance." |
| "Greenlight can't do guardrails / gifts / visibility" | It can: spend controls, pay links, monitoring | "Incumbents do guardrails well. We're exploring who-funded-what across several funders." |
| "Trellis is cheaper" | Trellis has no price. Cash App is free | "Kids' card apps charge $6–$20 a month. Our demo explores a model without a subscription." |
| "Trellis connects to your bank or card" | Bank and card behavior is simulated on Monad testnet | "Bank and card steps are simulated. Each confirmed action has a testnet transaction you can check." |
| "Greenlight stops at 18" | Its agreement sets no upper age | "Acorns Early stops at 18, Venmo Teen covers 13–17, and Cash App sponsorship ends at 18." |

## 20-second answer to "Why not Greenlight?"

> Greenlight and Acorns Early are good at parent controls, and they charge $6–$20
> a month for them. But the account holder has to be a US resident, Greenlight's
> gift senders need a US billing address, and Acorns Early stops at 18. Our demo explores the case they don't
> cover: several funders, including family abroad, putting money toward one
> dependent, with the parent setting the rules and everyone seeing what their
> money paid for. It runs on testnet, so no real money moves.

[gl-plans]: https://greenlight.com/plans
[gl-terms]: https://greenlight.com/cardholder
[gl-ff]: https://help.greenlight.com/hc/en-us/articles/10257522661659-Can-friends-or-family-send-money-to-my-child-s-Greenlight-account
[gl-gift]: https://help.greenlight.com/hc/en-us/articles/360020182193-What-is-a-Greenlight-Gift-How-do-I-give-a-Greenlight-Gift
[gl-spend]: https://greenlight.com/spend
[gl-intl]: https://help.greenlight.com/hc/en-us/articles/234742128-Can-the-Greenlight-card-be-used-internationally
[ac-early]: https://www.acorns.com/early
[ac-gift]: https://www.acorns.com/gift-money-kids
[ac-terms]: https://sqy7rm.media.zestyio.com/Acorns-Early-Terms-and-Conditions--With-Nbkc-Cardholder-Terms-v2-Dec-3rd-2025.pdf
[ac-fees]: https://sqy7rm.media.zestyio.com/-FINAL--Acorns-Early-short-form-disclosure-12.3.25.pdf
[vm-ua]: https://venmo.com/legal/us-user-agreement/
[vm-teen]: https://help.venmo.com/cs/articles/teen-account-faq-for-parents-guardians-vhel117
[vm-limits]: https://help.venmo.com/cs/articles/teen-account-limits-vhel176
[vm-manage]: https://help.venmo.com/cs/articles/managing-my-linked-teen-account-vhel157
[ca-tos]: https://cash.app/us/en/legal/tos
[ca-fam]: https://cash.app/families
[ca-18]: https://cash.app/help/us/en-US/6537-sponsored-accounts-turning-18
[z-intl]: https://www.zelle.com/faq/can-i-use-zelle-internationally
[z-age]: https://www.zelle.com/faq/what-age-requirement-enroll-zelle
