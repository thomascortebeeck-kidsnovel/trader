# General Bot — Reasoning

Append-only. Every routine writes a dated block (Saw / Did / Why / Watch).

## 2026-04-21 pre-market general pre-market-research

**Saw:** Fresh paper account — $100k equity, 0 positions, empty trade-log, no prior weekly-review thesis. Futures edging higher on US–Iran negotiation headlines. Biggest single-stock catalyst in the tape is AMZN's $100B AWS–Anthropic strategic pact (Cathie Wood added AMZN on it; Cramer defended it). Secondary AI-infra signal: TSM announced $56B capex expansion. AAPL is in a governance transition (Cook → Ternus, Srouji as hardware chief) — narrative-heavy, not a trade catalyst. UNH/GE/MMM/ALK report earnings today and Benzinga lists AMZN in that earnings preview block as well. Today's US calendar: 08:30 ET Retail Sales (high, est +1.4% vs prev +0.6%), 10:00 ET Warsh Fed Chair confirmation hearing, 14:30 ET Waller speech — no FOMC/CPI/NFP.

**Did:**
- Researched only — no orders placed (per routine spec).
- Appended BUY_CANDIDATES (none) / WATCH (SPY, QQQ, AMZN conditional, NVDA, AVGO, TSM) / AVOID (UNH, GE, MMM, ALK, AAPL, AMZN if reporting) to research-log.md.

**Why:** Bot has no history, no prior weekly-review, and no confirming session on any name. Entry rules require a catalyst + structure (above 50-day SMA) + max 3% above pre-market open — none of those can be verified cleanly pre-market on a cold start. AMZN has the strongest single-stock thesis but may be on earnings today, which rule #2 hard-blocks. QQQ/SPY are the cleanest default seeds under the "broad-market exposure, tilt toward quality" directive in memory/strategy.md, but the right place to enter is after the first 5-min bar post-open, not pre-market. Dissenting view: waiting risks missing a gap-up continuation if the 08:30 retail sales beat is large — I accept that risk because entering a first-ever position on a gap into macro data is exactly the scenario where the −2% daily cap becomes easy to trip.

**Watch:** Market-open routine should (1) verify AMZN earnings date before considering it; (2) read the 08:30 ET retail sales print and note the reaction; (3) wait for the 09:30 + 5 min bar before any entry; (4) if conditions hold, take QQQ as a half-size seed position (~2.5% of equity, not the 5% max) so the first trade doesn't anchor the book at full risk; (5) avoid all entries in the 30 min around the Warsh hearing (10:00) and Waller speech (14:30).
