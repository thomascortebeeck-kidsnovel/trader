# Bot 2 — Day Trader, Kraken Robotics

Single-name intraday bot. Trades **Kraken Robotics Inc.** — `KRKN` on TSX, `KRKNF` on US OTC. Default symbol on Alpaca paper is `KRKNF`.

- Risk per trade: **1% of equity** (Aziz convention).
- R/R minimum: **2:1**.
- Max **3 trades / day**, max **3 consecutive losers** then halt.
- **Always flat by 3:55 PM ET** — no overnight risk.
- All entries must match a documented pattern in [`pattern-research.md`](./pattern-research.md).

## Why a single name

Day trading rewards depth over breadth. The bot becomes a specialist on KRKNF's typical range, opening behavior, news cadence, and float dynamics.

## A note on liquidity

KRKNF is a US OTC listing of a Canadian small-cap. Spreads are wider and bar data through Alpaca's IEX feed may be delayed or sparse during low-volume periods. The pre-market routine **gates the day** — if average 5-min volume over the trailing 20 sessions < 5,000 shares, the bot stands down for the day.

For real money, the operator should evaluate Questrade or IBKR to trade `KRKN` on TSX directly. Strategy is broker-agnostic.

## Routines

All times are **America/New_York** (Eastern Time). Belgium operator: ET = Brussels − 6h.
Benchmark for performance: **`ITA`** (iShares US Aerospace & Defense — closest single-ETF proxy).

| File                              | Cron (ET)         | Brussels | Purpose                                                  |
|-----------------------------------|-------------------|----------|----------------------------------------------------------|
| `routines/pre-market.md`          | `15 8 * * 1-5`    | 14:15    | Gap, levels, news, go/no-go for the session              |
| `routines/opening-range.md`       | `45 9 * * 1-5`    | 15:45    | After 15-min ORB forms: trade ORH/ORL break w/ volume    |
| `routines/trend-scan-1.md`        | `30 10 * * 1-5`   | 16:30    | Manage open trade; continuation patterns                 |
| `routines/trend-scan-2.md`        | `30 13 * * 1-5`   | 19:30    | Afternoon reversal scan                                  |
| `routines/close-flatten.md`       | `50 15 * * 1-5`   | 21:50    | Force-flatten any open position by 3:55 PM ET            |
| `routines/weekly-review.md`       | `30 16 * * 5`     | 22:30 Fri| Re-run pattern analysis; compute win-rate / R / expectancy |

See [`docs/day-trading-research.md`](../../docs/day-trading-research.md) for the literature these rules are grounded in.
