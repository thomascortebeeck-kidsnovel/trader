# General Bot — Weekly Review

Append-only. Friday weekly-review writes one block per week. The first block
below is an **operator seed**, written before the bot had traded its first
session, to unblock market-open's WATCH → BUY conversion. Future blocks are
written by the `weekly-review` routine every Friday.

---

## Week of 2026-04-20 — operator seed thesis

**Author:** operator (Thomas) via Claude Code assist
**Status:** signed off — market-open is permitted to convert WATCH to BUY per the rules below
**Valid through:** 2026-04-24 end-of-day (next Friday's weekly-review block supersedes this one)

### Thesis

Cold-start $100k paper book. The point of this week is to take the **first actual fills** so we have real data to grade next Friday — not to maximise return. A single clean, disciplined entry is worth more than three speculative ones. If nothing qualifies under the rules below, stay in cash; the cost of a blank week is zero, the cost of a bad first fill that anchors the book is real.

Macro regime: chip/AI capex cycle running hot (SOXX +27% MTD — chase warning, not entry signal), Strait-of-Hormuz headline risk live, AMZN reports 2026-04-30 (hard earnings-rule blackout 04-29/04-30), no FOMC/CPI/NFP on the calendar through Friday.

### Permitted WATCH → BUY conversions this week

Market-open may convert the following WATCH names into BUYs **if and only if** every rule below passes at entry time:

| Symbol | Role | Max size | Notes |
|---|---|---|---|
| **QQQ** | Preferred first seed | **half-size = 2.5% equity** | Broad AI-infra exposure, avoids single-stock earnings risk. Take first. |
| **AMZN** | Optional second seed | **half-size = 2.5% equity** | Only if (a) QQQ has already filled or is disqualified today, (b) today is ≤ 2026-04-28 (earnings blackout starts 04-29), (c) it passes rule #3 independently. |

**No other WATCH names convert to BUY this week.** NVDA / AVGO / TSM / SMH / SOXX / XRT / XLE / XOM / COP / CVX remain WATCH-only — on the list for context, not execution. Re-evaluate next Friday.

### Entry rules (all must pass per fill)

1. Strategy rule #1 catalyst — QQQ = AI-infra cycle + retail-sales beat; AMZN = AWS–Anthropic pact + Anthropic Mythos commercialisation + One Medical GLP-1.
2. Strategy rule #2 no earnings day — AMZN clean through 04-28; QQQ is an ETF so N/A.
3. Strategy rule #3 no-chase — entry price ≤ 3% above today's pre-market open.
4. Strategy rule #4 structure — above 50-day SMA (verify with `scripts/alpaca.py snapshot` + bars). Ideally above 200-day too.
5. Cap: **2 new positions this week total**, not the 3 the strategy allows — cold-start conservatism override.
6. Every fill **must** attach a 10% `trail_percent` stop per strategy sizing table.
7. Every fill **must** log to `trade-log.md` with an explicit thesis string referencing this weekly-review block.

### Do-nothing tripwires (any one = stand down for the session)

- Crude (CL=F / USO) gaps past $95 intraday. Hormuz escalation dominates tape.
- Live US Fed speaker on today's calendar and entry would fall within 30 min of their slot.
- QQQ or AMZN is already > 3% above pre-market open at the 10:00 ET fire time (rule #3 hard-no).
- Alpaca `/account` returns `trading_blocked=true` or `account_blocked=true`.
- Weekly P/L already ≤ −1.5% going into a new potential entry — save capital for next week's review.

### What market-open does if nothing qualifies

Stay flat. Log the reason in `reasoning.md`. Do **not** loosen these rules intraday. The rules are permissive by design (QQQ half-size on a mature AI cycle is almost always qualifying somewhere this week) — a day where even that doesn't fire is a genuine "do nothing" day, not a rule-stretching day.

### Open questions for Friday's weekly-review

- Does QQQ half-size as a first fill earn positive alpha vs SPY for the week, or just track it?
- Is the AMZN earnings-blackout rule the right shape, or should we allow a half-size entry through 04-28 regardless of IV-crush risk?
- Benchmark data drift (2026-04-21 SPY close recorded 707.41 vs Alpaca snapshot's prevDailyBar 703.91) — pick one source and stick with it.

### Sign-off

*Operator, 2026-04-22 — permitting QQQ/AMZN half-size conversions per the table above. Any rule changes go through a new weekly-review block, not intraday edits.*

---
