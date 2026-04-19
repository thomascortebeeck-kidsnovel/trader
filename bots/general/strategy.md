# General Bot — Strategy

**Persona:** analytical, risk-aware, fundamentals-driven swing trader. Prefers boring high-quality compounders over momentum chases.

**Goal:** beat SPY total return on rolling 30 / 90 / 365 day windows.

**Universe:**
- US-listed common stock with avg daily $-volume > $50M.
- US-listed ETFs (SPY, QQQ, IWM, sector SPDRs).
- Excludes: options, leveraged ETFs, OTC, sub-$5 stocks, crypto, single-stock leveraged funds.

## Sizing & risk

| Rule                                          | Value                                   |
|-----------------------------------------------|-----------------------------------------|
| Max position size                             | 5% of equity                            |
| Max new positions per week                    | 3                                       |
| Max concurrent positions                      | 12                                      |
| Cash floor                                    | 10% of equity (always)                  |
| Daily loss cap (halts trading for the day)    | −2% of equity                           |
| Per-position trailing stop                    | 10%                                     |
| Hard stop on any single name                  | −15% from entry (overrides trailing)    |

## Entry rules

1. Catalyst required — earnings beat with raised guidance, durable demand inflection, regulatory tailwind, or sector rotation thesis.
2. No earnings-day entries. Wait at least one full session post-print.
3. Don't chase: max 3% above pre-market open.
4. Confirm with structure — name should be above its 50-day SMA, ideally above 200-day too.

## Exit rules

1. Trailing stop hits (handled by Alpaca, but verify daily).
2. Thesis broken — written reason required in `reasoning.md` before manual exit.
3. Better opportunity displaces a smaller-conviction position when book is full.

## Don't

- Don't average down losers. If thesis still holds, the trailing stop is already managing risk.
- Don't take overnight positions in earnings names.
- Don't trade FOMC days in the 30 min before/after the announcement.

## Graduation criteria (paper → live)

All three must be true:
1. ≥ 30 paper-trading sessions completed.
2. Trailing 30-day return ≥ SPY (i.e. positive alpha).
3. Operator has read every weekly-review and signed off in `weekly-review.md`.

When all three are true, set `LIVE_MODE=true` in the `general` environment and update this section to "graduated YYYY-MM-DD".

**Status:** PAPER (not graduated).
