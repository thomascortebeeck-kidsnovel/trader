# General Bot — Reasoning

Append-only. Every routine writes a dated block (Saw / Did / Why / Watch).

## 2026-04-21 pre-market general pre-market-research

**Saw:** Fresh paper account — $100k equity, 0 positions, empty trade-log, no prior weekly-review thesis. Futures edging higher on US–Iran negotiation headlines. Biggest single-stock catalyst in the tape is AMZN's $100B AWS–Anthropic strategic pact (Cathie Wood added AMZN on it; Cramer defended it). Secondary AI-infra signal: TSM announced $56B capex expansion. AAPL is in a governance transition (Cook → Ternus, Srouji as hardware chief) — narrative-heavy, not a trade catalyst. UNH/GE/MMM/ALK report earnings today and Benzinga lists AMZN in that earnings preview block as well. Today's US calendar: 08:30 ET Retail Sales (high, est +1.4% vs prev +0.6%), 10:00 ET Warsh Fed Chair confirmation hearing, 14:30 ET Waller speech — no FOMC/CPI/NFP.

**Did:**
- Researched only — no orders placed (per routine spec).
- Appended BUY_CANDIDATES (none) / WATCH (SPY, QQQ, AMZN conditional, NVDA, AVGO, TSM) / AVOID (UNH, GE, MMM, ALK, AAPL, AMZN if reporting) to research-log.md.

**Why:** Bot has no history, no prior weekly-review, and no confirming session on any name. Entry rules require a catalyst + structure (above 50-day SMA) + max 3% above pre-market open — none of those can be verified cleanly pre-market on a cold start. AMZN has the strongest single-stock thesis but may be on earnings today, which rule #2 hard-blocks. QQQ/SPY are the cleanest default seeds under the "broad-market exposure, tilt toward quality" directive in memory/strategy.md, but the right place to enter is after the first 5-min bar post-open, not pre-market. Dissenting view: waiting risks missing a gap-up continuation if the 08:30 retail sales beat is large — I accept that risk because entering a first-ever position on a gap into macro data is exactly the scenario where the −2% daily cap becomes easy to trip.

**Watch:** Market-open routine should (1) verify AMZN earnings date before considering it; (2) read the 08:30 ET retail sales print and note the reaction; (3) wait for the 09:30 + 5 min bar before any entry; (4) if conditions hold, take QQQ as a half-size seed position (~2.5% of equity, not the 5% max) so the first trade doesn't anchor the book at full risk; (5) avoid all entries in the 30 min around the Warsh hearing (10:00) and Waller speech (14:30).

## 2026-04-21 11:21 general pre-market-research (refresh)

**Saw:** Routine re-invoked ~3h after the scheduled 08:00 ET slot — market is open and mid-morning. Account still $100k cash, zero positions, zero orders (market-open routine hasn't yet run on this branch). Big tape updates since the first pre-market block: March Retail Sales printed +1.7% MoM vs +1.4% est (biggest jump since Jan 2023, control group beat by 3.5x), Pending Home Sales +1.5% vs 0.0% est, Business Inventories +0.4% vs +0.3%. The Warsh confirmation hearing is live at the Senate — he's striking a measured, credibility-first tone, refusing to pre-commit on rates, committing to divest to cash/T-bills, and calling Fed independence "something that must be earned." Senator Tillis separately flagged that a US Assistant Attorney is investigating Powell — institutional-credibility tail risk. AMZN stacked two incremental positives (Anthropic "Mythos" rolling out to European banks per Reuters; Amazon One Medical launched a GLP-1 program). Munster/Deepwater called for +50% hyperscaler AI capex in 2026, reinforcing the NVDA/AVGO/TSM thesis. I verified AMZN does NOT report today (April 30 per public calendar) — rule #2 no longer blocks it.
**Did:**
- No orders (pre-market routine researches only).
- Appended a refresh block to research-log.md: lifted AMZN from conditional-AVOID to clean WATCH; added XRT to WATCH (retail beat); kept QQQ as the preferred first-seed; reiterated the 14:30 ET Waller 30-min avoidance window and the elevated-headline posture through 12:00 ET while the Warsh hearing runs.
- Refreshed next-routine guidance for market-open (QQQ first half-size, then AMZN half-size only if it independently meets entry rules; cap new positions at 2 for day-one).

**Why:** The macro tape is net bullish (strong retail sales, strong pending home sales, AI-infra thesis reinforced) but the Warsh hearing is producing live Fed-policy headlines and the Powell-investigation angle is the kind of institutional wildcard that rewards patience on a cold-start book. No position today beats a forced entry into headline-driven chop. The strategy's entry rules (catalyst + structure + ≤3% above pre-market open + no earnings-day) are all verifiable by market-open, which is the right place to actually pull the trigger. Dissenting view I'm discounting: the retail-sales beat could mark the high-water risk-on print of the week and waiting could cost the first entry ~0.5–1% — accepted, because on a fresh book the opportunity cost of one missed bar is tiny vs. the cost of anchoring day one at a bad entry.

**Watch:** Market-open routine should (1) confirm post-Warsh tape by 12:30 ET; (2) verify QQQ and AMZN structure (above 50-day SMA) and rule #3 (≤3% above pre-market open) at entry; (3) prefer QQQ first half-size (~2.5% equity), then AMZN half-size only if independently qualifying; (4) hard-avoid the 14:00–15:00 ET Waller window; (5) cap today's new entries at 2 vs the strategy's weekly max of 3; (6) set 10% trailing stops on any fill and log to trade-log.md.

## 2026-04-21 16:02 general eod

**Saw:** Closing-bell snapshot on a cold-start book. Alpaca reports equity $100,000.00, last_equity $100,000.00, cash $100,000.00, long/short market value $0, zero positions, zero filled orders. Market-open and midday routines never ran on this branch, so the two pre-market research refreshes were the only activity of the day. SPY daily close 707.41 vs prev close 708.79 = −0.19% on the day; intraday range 706.09–711.25, opened 710.165 (so SPY gapped up on the retail-sales beat then faded through the session). Tape color from the earlier refresh: Retail Sales +1.7% (well above +1.4% est), Pending Home Sales +1.5% vs 0.0% est, Warsh hearing measured/slightly-hawkish, Powell-investigation tail-risk headline, AMZN earnings confirmed April 30 (not today). Benchmark row appended for 2026-04-21: equity 100000.00, day_pl +0.00, SPY 707.41, bot_vs_bench +0.19% (bot was flat while SPY gave back 0.19% — outperformance is mechanical, not earned).

**Did:**
- Read strategy.md, today's trade-log (empty), benchmark.md (empty until today), today's reasoning blocks.
- Ran `scripts/alpaca.py account` and `positions` — confirmed flat $100k book, zero positions.
- Ran `scripts/alpaca.py snapshot SPY` — captured 707.41 daily close.
- Appended today's row to `memory/benchmark.md` per benchmark skill.
- Sent EOD ClickUp message via `scripts/notify.py` per report skill.
- No trades placed (EOD routine is read-only on Alpaca order endpoints; also market-open/midday never ran so there was nothing to close or trim).
- Journaled this block and will commit + push on `claude/awesome-wright-Jk0ET`, then open a PR.

**Why:** Day-one of a fresh paper book ended with zero fills because the market-open and midday routines did not execute — only the two pre-market research passes ran. Given the routine definition (EOD is read-only with respect to order endpoints), nothing I could legitimately do at 16:02 ET would have improved today's outcome; the right action was to snapshot, report, and journal the fact so tomorrow's market-open routine doesn't repeat the execution gap. The +0.19% vs SPY is not a signal — it is a coincidence of being in cash while the index faded 0.19%, and it should not be cited as "alpha." Dissenting view I am logging: one could argue the prudent move on day one is exactly this — research, sit out, preserve 100% of capital, reassess. That framing is consistent with the strategy's "when unsure, do nothing" rule and with the cold-start posture. Accepted as the generous reading; still, the harder truth is that the execution scheduler (market-open/midday) failed to fire and that operational issue is the real story of today.

**Watch:** Tomorrow's pre-market / market-open should (1) verify market-open routine is actually scheduled and will fire at 09:30 ET — the execution gap is the #1 issue to close; (2) re-read the refreshed WATCH list from today's 11:21 research block (QQQ as first half-size seed, AMZN clean after earnings-date confirmation, SPY as broader alternative, NVDA/AVGO/TSM on pullback only, XRT lower-conviction); (3) re-verify AMZN April 30 earnings date and ensure no entries on 04-29/04-30; (4) if tomorrow has any FOMC/CPI/NFP print, tighten entry discipline further; (5) cap day-one (i.e. first-actual-fills day) entries at 2 half-size positions per today's final guidance; (6) confirm 10% trailing stops on any fills and log every fill to trade-log.md; (7) start a weekly-review stub for the week so the Friday routine has a thesis to close against.

[GENERAL] EOD 2026-04-21
Equity: $100000.00 (today: +0.00%)
Bench (SPY): -0.19% — bot vs bench: +0.19%
Trades today: 0 (0 winners, 0 losers, 0 B&E)
Best: — none   Worst: — none
Notes: Market-open routine never ran; book stayed in cash. SPY dipped -0.19% so idle beat it by coincidence. Watch tomorrow: re-read refreshed WATCH list (QQQ seed, AMZN clean) and actually execute market-open if conditions hold.

## 2026-04-21 12:00 general midday

**Saw:** Midday routine invoked on a fresh branch (`claude/beautiful-wright-CZGHr`). Alpaca account reports equity $100,000.00, last_equity $100,000.00, cash $100,000.00, long_market_value $0, zero positions. Day-P/L is exactly 0.00% — nowhere near the −2% daily loss cap. Trade log is empty. Nothing to defend because there is nothing in the book.

**Did:**
- Read CLAUDE.md, strategy.md, trade-log.md (empty), today's reasoning blocks (pre-market, 11:21 refresh, 16:02 EOD from prior branch).
- Ran `scripts/alpaca.py account` — confirmed flat $100k, 0 P/L.
- Ran `scripts/alpaca.py positions` — empty list.
- No loss-cap halt triggered. No losers to cut (no positions). No winners to tighten stops on (no positions). No new entries allowed at midday per routine.
- Journaled this block. Skipping ClickUp notification (no loser cut, no cap hit, per step 6).
- Will commit + push + open PR.

**Why:** Midday is a defensive routine — its only legitimate actions are loss-cap halt, cut losers ≤ −7%, tighten stops on winners ≥ +15%. With zero positions, all three branches are no-ops. The only work at midday on a flat book is to record the state so downstream routines (EOD, weekly-review) have continuity. The prior EOD block (16:02 on a different branch) flagged the execution gap where market-open/midday didn't fire — today's midday is firing on this branch but there were still no market-open fills for it to defend.

**Watch:** (1) Market-open routine still hasn't fired today on this branch — if it doesn't run by ~14:00 ET the book will close flat again; (2) EOD routine on this branch should capture SPY close and append benchmark row; (3) tomorrow's pre-market should re-verify AMZN earnings date (April 30) and refresh the WATCH list; (4) avoid entries around the 14:30 ET Waller speech window flagged in the 11:21 refresh.
