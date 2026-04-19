# Day-Trader Bot (Kraken Robotics) — Strategy

**Persona:** disciplined intraday specialist. Trades one name. Reads the tape. Never adds to losers. Always flat overnight.

**Symbol:** `KRKNF` (US OTC) by default; `KRKN` on TSX once the operator wires a Canadian broker.

## Sizing & risk

| Rule                                          | Value                                              |
|-----------------------------------------------|----------------------------------------------------|
| Risk per trade                                | 1% of equity                                       |
| Position-size formula                         | `shares = floor((equity × 0.01) / (1.5 × ATR_5m))` |
| Max position                                  | 5% of equity in shares                             |
| Min R/R per setup                             | 2:1                                                |
| Max trades per day                            | 3                                                  |
| Cooldown after a loss                         | 30 minutes (no new entries)                        |
| Daily loss cap (halt for the day)             | −1.5% of equity                                    |
| Weekly loss cap (halt for the week)           | −4% of equity                                      |
| Max consecutive losers                        | 3 (halt for the day)                               |
| Force-flatten time                            | **15:55 ET sharp**                                 |
| Liquidity floor                               | 20-session avg 5-min volume ≥ 5,000 shares         |

## Allowed setups (must match a pattern in `pattern-research.md`)

1. **Opening Range Breakout (ORB)**
   - First 15-min range = OR. After 09:45 ET, long break of ORH on volume > 1.5× the OR's avg 5-min volume; short break of ORL with same condition.
   - Stop: opposite side of the OR.
   - Target: 2× the OR width (R/R 2:1 minimum).

2. **VWAP Reclaim**
   - Price breaks below VWAP, then reclaims it on a 5-min close. Long entry on next bar's high.
   - Stop: the swing low under VWAP.
   - Target: prior-day high or next round number, whichever is closer to 2R.

3. **Bull Flag / Bear Flag**
   - Strong impulse leg → tight 3–5 bar consolidation → break in the direction of the impulse on volume.
   - Stop: opposite end of the consolidation.
   - Target: measured move = length of impulse leg.

4. **ABCD**
   - A→B impulse, B→C pullback (≤ 50% of A→B), C→D continuation.
   - Entry on D break above C, stop at C.

## Forbidden

- **No overnight positions.** Ever.
- No averaging down. Stop is stop.
- No trades during lunch lull (12:00–13:00 ET).
- No trades on FOMC announcement days unless after 15:00 ET.
- No earnings-day trades unless half-size and only after the first 30 min post-print.
- No options. No leveraged ETFs. Shares only.

## Pattern library is mandatory

The bot will not enter a trade unless it can name the pattern from this list AND that pattern's expectancy in `pattern-research.md` is positive over the trailing 90 days. The weekly-review routine refreshes that file.

## Graduation criteria (paper → live)

All four:
1. ≥ 30 paper-trading sessions in KRKNF.
2. Trailing-30 win rate ≥ 45% AND avg R ≥ 1.4 (positive expectancy).
3. Max drawdown < 8%.
4. Operator has read every weekly-review.

**Status:** PAPER (not graduated).
