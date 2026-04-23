# Day-Trader Bot — Intraday Pattern Cache

Overwritten by pre-market routine. Read by the trading routines.

## Today's setup

- Date: 2026-04-23
- Pre-market gap: **-3.28%** (prior close 387.51 → pre-market latest 374.80; pre-mkt range 373.55–382.85 on 3.28M shares through 08:23 ET)
- Catalyst: **YES — TSLA Q1 2026 earnings (AH 2026-04-22).** Mixed-to-bearish tape reaction. Dilutive: 10-Q discloses an up-to-$2B stock-and-equity-awards acquisition of an AI hardware company (per Benzinga 10:22 UTC). Capex / cash-out: Tesla invested $2B into SpaceX; Musk floats Intel Terafab 14A chip deal. Sentiment: Elon confirmed HW3 cars will NOT achieve unsupervised FSD (owner-retention negative, Ross Gerber publicly called owners "screwed"); Needham reiterates Hold; Gary Black expects valuation to come down. Positive offset: EU March registrations +101.9% YoY. Finnhub company-news endpoint 503'd on two tries, so this relies on Alpaca news feed only — acceptable given the catalyst is unambiguous.
- Liquidity check: **PASS.** 20-session avg 5-min volume ≈ 877k (daily avg 68.4M / 78 bars) vs. 200k floor. Pre-market volume already 3.28M on 53 bars (session-leader pace).
- Today's plan: **HALF-SIZE.** Routine criteria (liquidity + <24h catalyst + ATR in normal band = 14.85 within the 14.25–15.91 trailing-10 band) would otherwise green-light full-size TRADE, but `strategy.md` forbids full-size on earnings-reaction days: "No earnings-day trades unless half-size and only after the first 30 min post-print." First entry therefore allowed no earlier than 10:00 ET. Position sizing: `shares = floor((equity × 0.005) / (1.5 × ATR_5m))` — half of the standard 1% risk budget.
- Levels:
  - Prior-day high: 393.01
  - Prior-day low: 385.30
  - Pre-market high: 382.85
  - Pre-market low: 373.55
  - 50-day SMA: 389.15

### Derived context for the intraday routines

- Pre-market is firmly below both prior-day low (385.30) and the 50-SMA (389.15) → gap-down structure. Bias short-side ORB / VWAP-reject until VWAP is reclaimed on a 5-min close.
- ATR(14) 5-min = 0.86 → default stop distance on a 1.5×ATR basis ≈ $1.29. Half-size R = 0.5% of equity.
- If open prints near pre-market low (373.55), the opening range will likely straddle a round number (375). Watch 375.00 as magnetic level.
- Prior-day close 387.51 is the natural gap-fill target if the tape turns — but it's ~3.4% away, so any long trigger that targets 2R beyond gap-fill needs a sub-$2 stop which is < ATR(5m), probably noise-level. Long setups should target intermediate resistance (pre-mkt high 382.85 first, then 385.30) unless a bull flag develops mid-morning.
- No FOMC today. No lunch-lull trades (12:00–13:00 ET). No new entries after 15:25 ET per strategy.

## Opening Range (filled at 09:45 ET by `opening-range.md`)

- ORH:
- ORL:
- OR width:
- 5-min avg volume during OR:

## Live trade state

- Position: NONE
- Entry:
- Stop:
- Target:
- Pattern:
