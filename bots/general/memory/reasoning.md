# General Bot — Reasoning

Append-only. Every routine writes a dated block (Saw / Did / Why / Watch).

## 2026-04-21 pre-market general pre-market-research

**Saw:** Fresh paper account — $100k equity, 0 positions, empty trade-log, no prior weekly-review thesis. Futures edging higher on US–Iran negotiation headlines. Biggest single-stock catalyst in the tape is AMZN's $100B AWS–Anthropic strategic pact (Cathie Wood added AMZN on it; Cramer defended it). Secondary AI-infra signal: TSM announced $56B capex expansion. AAPL is in a governance transition (Cook → Ternus, Srouji as hardware chief) — narrative-heavy, not a trade catalyst. UNH/GE/MMM/ALK report earnings today and Benzinga lists AMZN in that earnings preview block as well. Today's US calendar: 08:30 ET Retail Sales (high, est +1.4% vs prev +0.6%), 10:00 ET Warsh Fed Chair confirmation hearing, 14:30 ET Waller speech — no FOMC/CPI/NFP.

**Did:**
- Researched only — no orders placed (per routine spec).
- Appended BUY_CANDIDATES (none) / WATCH (SPY, QQQ, AMZN conditional, NVDA, AVGO, TSM) / AVOID (UNH, GE, MMM, ALK, AAPL, AMZN if reporting) to research-log.md.

**Why:** Bot has no history, no prior weekly-review, and no confirming session on any name. Entry rules require a catalyst + structure (above 50-day SMA) + max 3% above pre-market open — none of those can be verified cleanly pre-market on a cold start. AMZN has the strongest single-stock thesis but may be on earnings today, which rule #2 hard-blocks. QQQ/SPY are the cleanest default seeds under the "broad-market exposure, tilt toward quality" directive in memory/strategy.md, but the right place to enter is after the first 5-min bar post-open, not pre-market. Dissenting view: waiting risks missing a gap-up continuation if the 08:30 retail sales beat is large — I accept that risk because entering a first-ever position on a gap into macro data is exactly the scenario where the −2% daily cap becomes easy to trip.

**Watch:** Market-open routine should (1) verify AMZN earnings date before considering it; (2) read the 08:30 ET retail sales print and note the reaction; (3) wait for the 09:30 + 5 min bar before any entry; (4) if conditions hold, take QQQ as a half-size seed position (~2.5% of equity, not the 5% max) so the first trade doesn't anchor the book at full risk; (5) avoid all entries in the 30 min around the Warsh hearing (10:00) and Waller speech (14:30).

## 2026-04-21 pre-market general pre-market-research (refresh)

**Saw:** Account state unchanged — $100k, 0 positions. Finnhub calendar confirms yesterday's notes: 08:30 ET Retail Sales (est +1.4% vs +0.6% prev, HIGH), 10:00 Warsh hearing + Pending Home Sales + Business Inventories, 14:30 Waller, no FOMC/CPI/NFP. News delta is mostly AMZN-centric: a new California AG price-fixing lawsuit against AMZN ("evidence is clear as day") arrived this morning and materially complicates the otherwise-bullish Anthropic tape; Jensen Huang publicly boosted Adobe's AI opportunity (tangential NVDA positive); Benzinga confirmed TSM's $56B capex is explicitly AI-driven. Earnings names today remain UNH/GE/MMM/ALK; AMZN's inclusion in the "stocks to watch" earnings block is still ambiguous, but the pre-market move is clearly attributed to the Anthropic deal rather than a print, suggesting AMZN is not reporting today — still needs explicit verification.

**Did:**
- Researched only — no orders (per routine spec).
- Refreshed BUY_CANDIDATES (still none) / WATCH (QQQ primary seed, SPY backup, AMZN downgraded to conditional, NVDA/AVGO/TSM basket unchanged) / AVOID (UNH/GE/MMM/ALK earnings; AAPL governance noise; AMZN if earnings confirmed or gap >3%; blackouts around 10:00 and 14:30) in research-log.md.

**Why:** Two reasons to stand down on entries: (a) Strategy rules still unsatisfied — no prior weekly-review sign-off, no post-open confirming bar, and pre-market gap-risk into a HIGH-impact 08:30 retail sales print is exactly the scenario that trips the −2% daily cap on a cold book. (b) The AMZN thesis, which was the strongest single-name catalyst, is now a two-sided signal: the $100B Anthropic deal plus Cathie Wood buying on one side; a fresh California price-fixing suit on the other. A conflicted thesis is not a tradeable thesis on day one. Dissenting view: if retail sales prints strongly above consensus and QQQ holds above its 50-day SMA with a constructive first 5-min bar, the market-open routine still has a defensible half-size QQQ seed; I'm not vetoing that, just refusing to pre-commit to it from pre-market.

**Watch:** Market-open routine priorities: (1) verify AMZN earnings status before any consideration; (2) read the 08:30 retail sales print and note direction/magnitude; (3) wait for the first 5-min bar post-09:30 before any entry; (4) if constructive, seed QQQ at half size (~2.5% equity) with a 10% trailing stop per strategy; (5) hard blackout in the 30 min around 10:00 (Warsh) and 14:30 (Waller); (6) do not touch any earnings name today; (7) if AMZN is confirmed not reporting AND holds above its 50-day SMA post-open AND isn't >3% above pre-market open, it can be re-evaluated as a second-slot candidate — but only after the seed position is established and the California suit's price impact is visible.
