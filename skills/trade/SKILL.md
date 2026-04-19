# Skill: trade

**Purpose.** Place orders against Alpaca with all guardrails enforced. Every order goes through this skill. Never call `scripts/alpaca.py order` from a routine without first running `risk-check`.

## Pre-flight (always)

1. Confirm `ALPACA_BASE_URL` is the paper host **unless** `LIVE_MODE=true` AND the bot's `strategy.md` documents it has graduated.
2. Pull `scripts/alpaca.py account` — confirm `trading_blocked == false`, `daytrade_count` is in budget, and equity is what we expect.
3. Pull `scripts/alpaca.py positions` — never duplicate an existing position direction; if a position already exists, this is a *resize*, not a *new entry*.
4. Run `skills/risk-check/SKILL.md` against the proposed order. If it fails, do not place the order — log and exit.

## Sizing

- General bot: `qty = floor((equity × 0.05) / current_price)`, capped at portfolio max-position.
- Day trader: `qty = floor((equity × 0.01) / (1.5 × ATR_5min))`. Never more than 5% of equity in shares.
- News bot (micro): `qty = floor((equity × 0.02) / current_price)`.
- News bot (macro, ETF): `qty = floor((equity × 0.03) / current_price)`.

## Order types

- **Entries:** market order at the open is fine for liquid names; use limit order at mid-spread for OTC (KRKNF) and any name with > $0.05 spread.
- **Stops:** trailing stop with `trail_percent` matching the bot's strategy file (general 10%, day-trader 1.5×ATR, news micro 5%).
- **Time in force:** `day` for day trader (must flatten); `gtc` for general/news bot stops.

## After placing

1. Echo the order JSON to `reasoning.md` with one line of why.
2. Append to `trade-log.md`: timestamp, symbol, side, qty, price, order_id, thesis (≤ 20 words).
3. Commit + push.

## Refuse to trade if

- Daily loss cap already hit.
- More than 3 consecutive losing trades today (day-trader rule).
- Symbol's average 5-min volume < liquidity floor in `strategy.md`.
- It's an earnings day for the symbol and the bot's strategy disallows earnings trades.
