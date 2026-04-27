# TSLA — Pattern Research

> **Seeded 2026-04-23.** Empty skeleton. Content is populated by `routines/weekly-review.md` every Friday from measured values on Alpaca bars, NOT hand-researched from third-party sources. Pre-seeding with outside priors would bias early sessions. Wait for the first weekly-review run after TSLA has been active for one full trading week.

> **Archived KRKNF research** lives in `pattern-research-krknf.md` — retained for reference if the bot ever switches back to KRKN / KRKNF.

## Regime classification

_TBD — first weekly-review writes this. One paragraph with an ADX(14) number justifying trending / range-bound / chop._

## Headline statistics

| Metric | Value | Source / Notes |
|---|---|---|
| Price (most recent close) | — | Populated weekly |
| ATR(14) 5-min | — | Populated weekly |
| ATR(14) daily | — | Populated weekly |
| Median OR(15) width | — | First 15 min of session |
| 75th-percentile OR(15) width | — | Tail-risk sizing |
| Gap statistics (% > 1%, > 2%, > 3%) | — | Populated weekly |
| Gap-fill rate within 2 hrs | — | Populated weekly |
| Volume by 30-min bucket | — | Session-profile heat map |
| ADX(14) median | — | Trending / chop regime split |
| Correlation with ITA / XLE / XLI (5d, 20d) | — | Benchmark drift check |

## Per-pattern expectancy (trailing 30 days)

_TBD — the weekly-review computes these from `memory/trade-log.md`._

| Pattern | N | Win % | Avg R | Expectancy |
|---|---|---|---|---|
| Opening Range Breakout (ORB) | 0 | — | — | — |
| VWAP Reclaim (long) | 0 | — | — | — |
| VWAP Reclaim (short) | 0 | — | — | — |
| Bull Flag | 0 | — | — | — |
| Bear Flag | 0 | — | — | — |
| ABCD | 0 | — | — | — |

A pattern must show positive expectancy over the trailing 90 days before the intraday-event routine is allowed to enter on it (per `strategy.md` — "Pattern library is mandatory").

## Don'ts (survive the weekly refresh)

- **Don't chase a breakout more than 3% above its trigger level.** Strategy rule #3 equivalent for the day trader.
- **Don't trade during the 12:00–13:00 ET lunch lull** — volume profile collapses and patterns decompose into noise.
- **Don't enter a new position after 15:25 ET** — the close-flatten routine fires at 15:50 ET and a 25-min window isn't enough runway for a 2R target.
- **Don't add to a losing position.** The stop is the stop.
- **Don't trade on FOMC announcement days before 15:00 ET.** Day-of-Fed intraday is reserved for operator-supervised sessions.

## Notes / open questions (operator-maintained)

_Use this section for non-numeric observations that aren't captured by the weekly-review routine. Example entries:_

- _[yyyy-mm-dd] TSLA spreads were unusually wide between 13:30-14:00 ET — check Finnhub for an earnings / guidance event that coincided._
- _[yyyy-mm-dd] ORB fired but the 5-min avg volume was 3x the trailing 20-session median — investigate whether the poller's session-avg baseline needs an outlier trim._

---
