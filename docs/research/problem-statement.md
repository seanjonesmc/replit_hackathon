# Trellis — quantified problem statement

Research for the pitch: how families give money to dependents today, how little
parents can see of it, and what it costs to send money to students abroad.

- Sources accessed 24 October 2026. The newest available edition was used where
  one exists (2025–2026 data).
- Product name follows the central brand config (`BRAND.appName` = "Trellis").
- Trellis is a **testnet-only demo**. Nothing here should be read as a claim that
  Trellis moves real money or connects to real banks or cards. The problem
  statements describe the problem; where Trellis is mentioned, it is described
  as a demo.

Conventions: "weekly → monthly" conversions use × 52 ÷ 12 (= × 4.33). All money
is USD unless stated. **D** = directly reported by the source. **C** = computed
by us from reported figures (math shown). **E** = estimate or proxy (math shown).

---

## 1. Stats table

### A. Who gives an allowance, and how many households

| # | Number | What it measures | Source | Year | Geography | Confidence |
|---|---|---|---|---|---|---|
| A1 | **71%** | Parents of 5–17-year-olds who give an allowance regularly (43%) or occasionally (28%) | Wells Fargo / Ipsos, *Family Banking* survey — [topline PDF](https://www.ipsos.com/sites/default/files/ct/news/documents/2025-06/Ipsos%20Wells%20Fargo%20Family%20Banking%20Findings%205.28.2025_Final.pdf), [press release](https://newsroom.wf.com/news-releases/news-details/2025/New-Wells-Fargo-Study-Shows-Parents-Give-Their-Kids-an-Average-Weekly-Allowance-of-37/default.aspx) | 2025 (fielded 28 Apr–8 May) | US | **D.** n = 1,587 parents, online non-probability panel weighted to Census, credibility interval ±3.0 pts. Funded by Wells Fargo (a bank with a youth-banking product). |
| A2 | 58% / 79% / 73% / 75% | Allowance prevalence for kids aged 5–8 / 9–11 / 12–14 / 15–17 | Same as A1 | 2025 | US | **D.** Subgroup n = 484 / 343 / 333 / 427. |
| A3 | **57%** | Parents of children ≤ 18 who give a *regular* allowance | Achieve / Talker Research — [press release](https://www.achieve.com/about/press/from-digital-dollars-to-real-world-debt-31-percent-of-parents-catch-their-kids-on-unapproved-online-shopping-sprees) | 2025 (fielded 14–23 Apr) | US | **D.** n = 2,000 parents, online. Funded by Achieve (a consumer-lending company). Broader age range (0–18) and "regular" wording explain part of the gap with A1. |
| A4 | **33.56 million** | US families with their own children under 18 | US Census Bureau, *Families and Living Arrangements* (CPS), via [FRED series TTLFMCU](https://fred.stlouisfed.org/series/TTLFMCU) | 2025 | US | **D.** Official government statistic. |
| A5 | **~23.8 million** (upper-bound proxy) | US families that give some allowance | **E** — see estimate E1 | — | US | Upper bound only. Applies a 5–17 prevalence rate to all families with children under 18. |

### B. How much allowance (normalized to per month)

| # | Number | What it measures | Source | Year | Geography | Confidence |
|---|---|---|---|---|---|---|
| B1 | **Median $20/week ≈ $87/month**; mean $37.19/week ≈ $161/month | Allowance, children 5–17, among parents who give one | Wells Fargo / Ipsos (A1) | 2025 | US | **D** (weekly) / **C** (monthly). n = 1,073. Top 4% of outliers removed. Mean is pulled up by the 28% who give $50+/week, so use the **median**. |
| B2 | Median **$15 / $20 / $20 / $25** per week ≈ **$65 / $87 / $87 / $108** per month | Median allowance by age: 5–8 / 9–11 / 12–14 / 15–17 | Wells Fargo / Ipsos (A1) | 2025 | US | **D / C.** Subgroup n = 281 / 256 / 236 / 300. |
| B3 | Mean $31.50 / $34.32 / $36.05 / $44.88 per week ≈ $137 / $149 / $156 / $194 per month | Mean allowance by the same age bands | Wells Fargo / Ipsos (A1) | 2025 | US | **D / C.** Means are skewed; prefer B2. |
| B4 | **$119/month** "typical"; 14% of kids get more than $250/month | Monthly allowance, children ≤ 18 | Achieve / Talker Research (A3) | 2025 | US | **D.** The release does not say whether "typical" means the mean or the median. **Conflict:** lower than the B1 mean ($161) and higher than the B1 median ($87). |
| B5 | 29% | Parents who raised allowance in the past year because of inflation | Wells Fargo / Ipsos (A1) | 2025 | US | **D.** n = 1,121. |
| B6 | **$13,087/year** (39% of college costs) | Average contribution from parent income and savings per undergraduate family; 73% of families use this source | Sallie Mae / Ipsos, [*How America Pays for College 2026*](https://www.salliemae.com/about/leading-research/how-america-pays-for-college) | 2026 (AY 2025–26) | US | **D.** n = 1,000 students + 1,000 parents, online, weighted to CPS. Funded by Sallie Mae (a student lender). Covers tuition and living costs, not "spending money" alone. It is the best available proxy for 18+ dependents. |

### C. Cash vs digital, and how much parents can see

| # | Number | What it measures | Source | Year | Geography | Confidence |
|---|---|---|---|---|---|---|
| C1 | **73%** cash; 24% P2P apps; 20% bank direct deposit; 14% prepaid debit card | How allowance-giving parents pay it (multi-select; 1.3 methods on average) | Wells Fargo / Ipsos (A1) | 2025 | US | **D.** n = 1,121. Multi-select, so the shares add up to more than 100%. |
| C2 | Cash: **80% / 77% / 74% / 62%** | Cash use by age 5–8 / 9–11 / 12–14 / 15–17 | Wells Fargo / Ipsos (A1) | 2025 | US | **D.** Cash stays the majority method even for 15–17-year-olds. |
| C3 | 73% | Allowance "usually paid in cash" | Achieve / Talker Research (A3) | 2025 | US | **D.** Second, independent survey matches C1. |
| C4 | **87%** agree / **50%** agree | "Monitoring my kid's spending helps me guide them" / "I find it challenging to track my kid's spending without feeling overly controlling" | Wells Fargo / Ipsos (A1) | 2025 | US | **D.** n = 1,587. Attitude questions, not measured behavior. |
| C5 | **23%** | Parents who rarely or never check their child's debit/credit card activity | Achieve / Talker Research (A3) | 2025 | US | **D.** Lender-funded. The base (all parents vs parents whose child has a card) is not stated. |
| C6 | **31%**; average cost **$170** | Parents who caught their kids making unapproved online purchases, and the average cost | Achieve / Talker Research (A3) | 2025 | US | **D.** Same caveats as C5. |
| C7 | 44% | Parents who say it is harder to teach money lessons with digital money than with cash | Achieve / Talker Research (A3) | 2025 | US | **D.** |
| C8 | Not available | Share of allowance spending that parents can actually see | — | — | — | **No direct statistic found.** We found no survey that measures parents' real visibility into dependents' spending. The closest proxies are C1 (cash is untracked by design), C4 and C5. See E2. |

### D. International students and the money families send

| # | Number | What it measures | Source | Year | Geography | Confidence |
|---|---|---|---|---|---|---|
| D1 | **1,177,766** | International students at US colleges (incl. 294,253 on OPT work authorization) | IIE *Open Doors 2025* — [press release](https://www.iie.org/news/open-doors-2025-press-release) | 2025 (AY 2024/25) | US | **D.** Institutional census sponsored by the US State Department. |
| D2 | **606,781 (51.5%)**; **81.9%** of undergraduates | International students whose *primary* funding is personal and family money | IIE *Open Doors 2025*, Table 1.20 ([report PDF via ERIC](https://files.eric.ed.gov/fulltext/ED681019.pdf); [data page](https://opendoorsdata.org/data/international-students/international-students-primary-source-of-funding)) | 2025 (AY 2024/25) | US | **D.** Measures the *primary* source only. Students funded mostly by family may also have other sources. |
| D3 | **−17%** | New international enrollments, fall 2025 vs fall 2024 | IIE Fall 2025 Snapshot (in D1 release) | 2025 | US | **D.** Snapshot of 825+ institutions, not the full census. |
| D4 | **$42.9 billion** | International students' spending contribution to the US economy (tuition + living) | NAFSA / JB International — [release](https://www.nafsa.org/about/about-nafsa/international-students-contributed-43-billion-us-economy-2024-2025-fall-2025) | 2025 (AY 2024/25) | US | **E (by source).** Economic model, not measured transfers. NAFSA is an advocacy association. US Commerce Dept. gives "nearly $55B" for 2024 on a different basis (exports of education services). |
| D5 | **298,180** | US students who studied abroad for credit | IIE *Open Doors 2025* (D1) | 2025 (AY 2023/24) | US outbound | **D.** Mostly short-term (semester or less). This is the outbound case for US parents. |
| D6 | **~7.3 million** | Internationally mobile tertiary students worldwide; 7 countries (US, UK, Australia, Germany, Canada, Russia, France) host half | UNESCO *Higher Education Global Trends Report* — [press release](https://www.unesco.org/en/articles/number-students-higher-education-more-doubled-20-years-inequalities-remain) | 2026 (data year 2023) | Global | **D.** UN statistical source. |
| D7 | UK 10%, Germany 6%, Australia 6%, Canada 5%, France 4% | Share of global international students by destination | Migration Data Portal, from UNESCO UIS — [page](https://www.migrationdataportal.org/themes/international-students-trends) | data year 2022 | Global | **D.** Older (2022) than D6. The US share was not shown in the page extract, so use D1 for the US. |
| D8 | **$2.92 billion** (down 16% from $3.48B) | Money sent abroad by Indian residents for "studies abroad" | Reserve Bank of India, LRS data — [RBI Bulletin table](https://rbidocs.rbi.org.in/rdocs/Bulletin/PDFs/36T_BULT23042026902079AC9C4F41FB84C53A943FFEE689.PDF) | FY 2024–25 | India → world | **D.** Official central-bank data. India is the top sender of students to the US (363,019 in D1). One country only; covers tuition and living. |
| D9 | **~$22.1 billion/year** (rough) | Spending by US-based international students who are primarily family-funded | **E** — see estimate E3 | — | US | Crude proportional estimate. |

### E. Cross-border transfer cost and speed

| # | Number | What it measures | Source | Year | Geography | Confidence |
|---|---|---|---|---|---|---|
| E-1 | **6.36%** | Global average total cost (fee + FX margin) to send $200 | World Bank, *Remittance Prices Worldwide* Issue 54 — [report PDF](https://remittanceprices.worldbank.org/sites/default/files/2026-04/RPW_main_report_and_annex_Q325.pdf) | Q3 2025 (published 2026) | Global (358 corridors) | **D.** Mystery-shopping data (FXC Intelligence) across about 19 services per corridor. Simple average, not volume-weighted. Measures migrant remittances, not tuition. |
| E-2 | **14.99%** | Average total cost to send $200 through **banks** (vs 4.72% for money-transfer operators) | Same as E-1 | Q3 2025 | Global | **D.** Banks are the most expensive provider type. |
| E-3 | **4.08%** global; **3.44%** from the US | Average total cost to send $500 | Same as E-1, Annex II | Q3 2025 | Global / US-origin | **D.** Larger transfers cost less as a percentage. |
| E-4 | **5.04%** | Average cost to send $200 *from the US* | Same as E-1 | Q3 2025 | US-origin | **D.** |
| E-5 | 3% | UN SDG 10.c / G20 target for remittance cost by 2030. The current global average is more than 2× this target | Same as E-1 | — | Global | **D.** |
| E-6 | FX margin ≈ 1.0–2.4% (digital), 1.6–2.9% (cash) of the $200 sent, by region | FX-margin part of the remittance cost | Same as E-1, Figure 13 | Q3 2025 | Global, by region | **D.** Fees are the larger part. FX margin is the "hidden" part. |
| E-7 | **82%** of bank digital services take **more than one day**; 3% arrive within an hour (vs 63% within an hour for money-transfer operators) | Speed of remittance services, by provider type | Same as E-1, Figure 12 Panel B | Q3 2025 | Global | **D.** Share of *services* tracked, not share of transactions. |
| E-8 | **35.4%** within one hour; **67.3%** within one business day | Retail cross-border payment services crediting recipients (G20 target: 75% within one hour by 2027) | Financial Stability Board, *G20 Roadmap consolidated progress report 2025* — [PDF](https://www.fsb.org/uploads/P091025-1.pdf) | 2025 | Global | **D.** Excludes remittances. The FSB notes the one-hour gain came mostly from changes in the sample. |
| E-9 | ~**2.5%** | Average cost of a $1,000 person-to-person retail cross-border payment (highest of all use cases; about 30% of corridors above 3%) | FSB 2025 (E-8) | 2025 | Global | **D.** FX costs are the largest component. Receiver-side fees of 0.1–1.3% come on top and are not included. |

### F. Kids' debit cards and teen spending apps

| # | Number | What it measures | Source | Year | Geography | Confidence |
|---|---|---|---|---|---|---|
| F1 | 14% prepaid debit card; 24% P2P apps | Allowance-giving parents using these methods (see C1). Greenlight is named by 5% of the parents who use P2P | Wells Fargo / Ipsos (A1) | 2025 | US | **D.** P2P subgroup n = 270 (small). |
| F2 | **85%** cash, **67%** debit card, 26% credit card; **35%** have no traditional bank account | Payment methods teens used in the past month | Piper Sandler, *Taking Stock With Teens* Fall 2023 — [PDF](https://www.pipersandler.com/sites/default/files/document/319321.2.pdf) | 2023 | US | **D.** Large sample, but most respondents come through DECA chapters, so it is not nationally representative. Two years old. The Fall 2025 release did not publish payment-method data. |
| F3 | **6.5 million** | Greenlight "family members and counting" (parents + kids) | [greenlight.com](https://greenlight.com/) homepage | Accessed 2026 | US | **D, self-reported marketing figure.** Not audited. |
| F4 | **$5.99–$19.98/month** | Greenlight subscription price (Core → Family Shield), up to 5 kids | [Greenlight plans](https://greenlight.com/plans) | Accessed 2026 | US | **D.** |
| F5 | **$8 or $12/month**; ages **6–18** only | Acorns Early (formerly GoHenry) subscription and eligible age | [Acorns Early fee disclosure](https://sqy7rm.media.zestyio.com/-FINAL--Acorns-Early-short-form-disclosure-12.3.25.pdf) (Dec 2025); [Acorns Early page](https://www.acorns.com/early) | 2025–2026 | US | **D.** College-age dependents (19+) are outside this product's age range. |
| F6 | Primary account holder must be a **US citizen or lawful resident with an SSN or ITIN** | Greenlight eligibility | [Greenlight Cardholder Agreement](https://greenlight.com/cardholder) | Accessed 2026 | US | **D.** A parent or grandparent living abroad cannot open the account that funds the card. |
| F7 | **No foreign-transaction fees** (Greenlight; Acorns Early: 0%); Greenlight unsupported in ~30 countries | Card use abroad | [Greenlight help](https://help.greenlight.com/hc/en-us/articles/234742128-Can-the-Greenlight-card-be-used-internationally); Acorns Early disclosure (F5) | Accessed 2026 | US cards abroad | **D.** **The cards work abroad.** The gap is on the *funding* side (F6) and the age limit (F5). Do not say "kids' cards don't work abroad." |

---

## 2. Estimates and proxies (math shown)

These are back-of-envelope figures. Each one says what it combines and which way
it is likely to be biased. Present them as "roughly" or "on the order of" in a pitch.

**E1 — US families giving any allowance (upper bound)**
33.56M families with children < 18 (A4) × 71% give any allowance (A1)
= **≈ 23.8M families.**
Regular givers only: 33.56M × 43% = **≈ 14.4M families.**
Bias: likely **overstates**. A4 includes families whose only children are under
5, and the A1 rate covers ages 5–17 only.

**E2 — Annual allowance flow and the cash share (very rough)**
- Low: 14.4M regular-giving families × $20 median/week × 52 = **≈ $15.0B/year**
- High: 23.8M families × $37.19 mean/week × 52 = **≈ $46.1B/year**
- Crude cash share: cash is 73 of the 133 multi-select mentions (C1) ≈ 55%.
  → **≈ $8B–$25B/year handed over in cash**, i.e. spending parents cannot track by design.

Bias: one child per family is assumed (understates), and occasional givers are
counted as paying weekly in the high case (overstates). The cash share uses
method mentions, not dollars. Use only as "**tens of billions of dollars a year,
much of it in cash**." Do not quote a precise figure.

**E3 — Family money for international students in the US**
$42.9B total spending (D4) × 51.5% primarily family-funded (D2) ≈ **$22.1B/year.**
Fee drag: each 1 percentage point of transfer cost ≈ **$221M/year**. At the
US-origin $500 benchmark of 3.44% (E-3) it would be about $760M. At the
$1,000 P2P benchmark of 2.5% (E-9) it would be about $552M.
Bias: assumes equal spending per student (undergraduates rely more on family
and often pay more, so this may understate). Assumes all family funds cross a
border (some families already live in the US, so this overstates). Benchmark
rates are for $200–$1,000 transfers; large tuition wires are usually cheaper
as a percentage. Use only as "**hundreds of millions of dollars a year in
transfer costs**."

**E4 — What one transfer costs (illustration, directly from benchmarks)**
- $200 via the average bank: 14.99% → **≈ $30 lost** (E-2)
- $200 global average: 6.36% → ≈ $12.72 (E-1)
- $500 global average: 4.08% → ≈ $20.40 (E-3)

---

## 3. Conflicts between sources

| Topic | Values | How to handle |
|---|---|---|
| Share of parents giving allowance | 71% any (WF/Ipsos 2025, ages 5–17); 57% regular (Achieve 2025, ages ≤ 18); ~79% widely quoted from T. Rowe Price 2022 (ages 8–14) | Use **71%** with its age range. The T. Rowe Price primary deck now returns a 404, so we could not verify the 79% figure. Do not use it. |
| Allowance amount | Median $87/month vs mean $161/month (WF); "typical" $119/month (Achieve) | Use the **median** ("about $20 a week"). |
| Cash use | 73% (WF); 73% (Achieve); 85% of teens used cash last month (Piper 2023) | Consistent. Use **"nearly three in four."** |
| International-student economic value | $42.9B (NAFSA, AY 2024/25) vs "nearly $55B" (US Commerce, 2024) | Different methods. Name the source if you quote either. |
| Global mobile students | 7.3M (UNESCO, 2023 data) vs 6.9M (UIS, 2022 data) | Use **7.3M**, the newer figure. |

---

## 4. Headline numbers (pick 2–4)

1. **Nearly 3 in 4 parents who give an allowance still use cash (73%).**
   *Why it works:* it is one easy number, and two independent 2025 surveys agree
   on it. Cash cannot be seen once it is spent, so this is the visibility problem
   in one fact.

2. **87% of parents say monitoring their kid's spending helps, but half (50%)
   find it hard to do without feeling controlling.**
   *Why it works:* parents want guidance without surveillance, which is what
   "guardrails" means. It comes from the same survey as #1, so the story holds
   together.

3. **More than 600,000 international students in the US are funded mainly by
   their families, including 82% of international undergraduates.**
   *Why it works:* it comes from the US government-sponsored census (Open Doors
   2025). It shows the cross-border family-money problem at real scale.

4. **Sending $200 across borders through a bank costs about 15% on average,
   more than double the 6.4% global average and five times the UN's 3% target.
   82% of bank digital transfer services take more than a day.**
   *Why it works:* World Bank data, very recent, and easy to grasp ("$30 of
   every $200"). Say "remittances" or "small family transfers," not "tuition."

---

## 5. Problem statements

### One-sentence hook (slide)

> Nearly three in four parents still hand over allowance in cash, half say they
> struggle to keep an eye on their kids' spending without feeling controlling,
> and families sending money abroad through a bank pay about 15% to move $200.

### 30-second spoken version (~80 words)

> Parents want to guide how their kids spend money. 87% say keeping an eye on it
> helps. But nearly three in four still pay allowance in cash, so once it's handed
> over, it's invisible. Half find tracking spending hard without feeling
> controlling. And for the 600,000 international students in the US who rely on
> family money, every transfer has another cost: banks charge about 15% to send
> $200 across borders, and most bank transfer services take more than a day. Trellis is
> our testnet demo of family money with guardrails.

### Written paragraph (README / submission form)

> Families give dependents a lot of money, but they can rarely see or guide how
> it is spent. In a 2025 Wells Fargo/Ipsos survey of 1,587 US parents, 71% gave
> their 5–17-year-olds an allowance (median about $20 a week), and 73% of those
> parents paid at least partly in cash. 87% said monitoring their kid's spending
> helps them guide better habits, yet half said they find it hard to do without
> feeling overly controlling. The problem grows when dependents leave home. Open
> Doors 2025 counts more than 600,000 international students in the US who rely
> mainly on personal and family funds. World Bank data for Q3 2025 shows that
> sending $200 across borders costs 6.36% on average and 14.99% through banks,
> and 82% of bank digital transfer services take more than a day. Trellis is a
> testnet-only demo of a different model: family members fund a dependent, and
> parents set spending guardrails they can see. No real money or real bank or
> card accounts are involved.

---

## 6. Weak spots — what not to lean on in front of judges

| Stat | Weakness | Safer phrasing |
|---|---|---|
| Wells Fargo/Ipsos figures (A1, B1–B3, C1, C2, C4) | Bank-funded. Online non-probability panel (credibility interval, not a true margin of error). Attitude questions are not behavior. | "A 2025 Wells Fargo/Ipsos survey of about 1,600 US parents found…" Name the source and say "about." |
| Allowance **mean** $37/week | Skewed by the 28% who give $50+/week | Use the median: "about $20 a week." |
| Achieve/Talker figures (A3, B4, C5–C7) | Commissioned by a lender. "Typical $119/month" is undefined. Survey bases are unclear. | Use only as support: "another 2025 survey found nearly a quarter of parents rarely check their kids' card activity." |
| T. Rowe Price "79% give allowance" | 2022 data, ages 8–14 only, primary source no longer online | Don't use. |
| Piper Sandler teen payment data (F2) | Fall 2023. Sample comes mostly through DECA, so not representative | "Cash and debit cards are still teens' most-used payment methods (Piper Sandler, 2023)." Avoid exact percentages. |
| Greenlight "6.5M family members" (F3) | Self-reported marketing counter. Includes parents. | "Millions of families already pay for kids' card apps," or drop it. |
| "Kids' cards don't work abroad" | **False.** Greenlight and Acorns Early cards work abroad with no FX fees. | "Kids' card apps require a US-resident account holder and (Acorns Early) stop at 18, so a grandparent abroad or a 19-year-old student falls outside them." |
| World Bank 14.99% bank cost (E-2) | Simple average over migrant-remittance services, $200 benchmark. Not tuition-sized, not volume-weighted. | "Banks charge about 15% on average to send $200 abroad (World Bank)." Never say "tuition costs 15% to send." |
| Speed (E-7, E-8) | Share of *services*, not transactions. The FSB's one-hour gain came mostly from sample changes. | "Most bank transfer services take more than a day." |
| NAFSA $42.9B (D4) and E3 | Modeled economic impact from an advocacy group. E3 stacks assumptions. | "Tens of billions a year," or skip and use D2 (a direct count). |
| UNESCO 7.3M (D6), destination shares (D7) | Data years 2023 and 2022 | "About 7 million students study abroad worldwide." |
| India LRS $2.92B (D8) | One country. Falling year over year. Covers living costs too. | "Indian families alone sent almost $3B abroad for studies in FY2024–25 (RBI)." |
| E1/E2 household and cash-flow estimates | Our own back-of-envelope figures with a wide range | "Tens of billions of dollars a year in allowance, much of it cash." Always say it's an estimate. |
| Visibility (C8) | No direct measure of how much spending parents can actually see | Don't claim "parents can see X% of spending." Use cash share + attitudes. |
