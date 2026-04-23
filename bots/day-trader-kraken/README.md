# Bot 2 — Day Trader

> **2026-04-23: default symbol switched to `TSLA`.** The bot was originally configured for Kraken Robotics (`KRKNF` US OTC / `KRKN` TSX) but Alpaca's paper-trading data feed does not carry KRKNF's OTC quotes — every poll returned 403 and every pre-market logged `plan=SKIP`. TSLA is a NASDAQ mega-cap with full Alpaca paper support, so the pipeline can actually produce bars and fills. The folder name and codename stay `kraken` for repo-path continuity. Archived KRKNF research lives in [`pattern-research-krknf.md`](./pattern-research-krknf.md).

Single-name intraday bot. Current default on Alpaca paper: `TSLA`.

- Risk per trade: **1% of equity** (Aziz convention).
- R/R minimum: **2:1**.
- Max **3 trades / day**, max **3 consecutive losers** then halt.
- **Always flat by 3:55 PM ET** — no overnight risk.
- All entries must match a documented pattern in [`pattern-research-tsla.md`](./pattern-research-tsla.md).

## Why a single name

Day trading rewards depth over breadth. The bot becomes a specialist on TSLA's typical range, opening behavior, news cadence, and float dynamics.

## A note on liquidity

TSLA is a NASDAQ mega-cap with ~67-80M average daily volume — plenty of liquidity on Alpaca's IEX feed during market hours. The pre-market routine still **gates the day** — if average 5-min volume over the trailing 20 sessions < 200,000 shares, the bot stands down for the day (that threshold should never trip for TSLA under normal conditions; it only fires if Alpaca's feed is degraded).

For real money, the operator should evaluate a broker that can route to NASDAQ with tight spreads (Alpaca live / IBKR / Tastytrade). Strategy is broker-agnostic. If a Canadian broker is ever wired for `KRKN` on TSX, the archived research in `pattern-research-krknf.md` is the starting point.

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
