# Skill: benchmark

**Purpose.** Snapshot portfolio value vs benchmark and append to the bot's tracking sheet.

## Inputs

- Benchmark ticker (default `SPY` for general bot, **`ITA`** for day-trader-kraken — iShares US Aerospace & Defense, the closest single-ETF proxy for Kraken Robotics' defence + subsea exposure — and `SPY` for news bot).

## Steps

1. `scripts/alpaca.py account` → grab `equity` and `last_equity`.
2. `scripts/alpaca.py snapshot SPY,<benchmark>` → grab benchmark close.
3. Append a row to `memory/benchmark.md`:

```
| date       | equity     | day_pl   | benchmark | bench_close | bot_vs_bench |
| 2026-04-19 | 102345.12  | +234.10  | SPY       | 521.34      | +0.18%       |
```

4. Compute trailing 7d / 30d / 90d outperformance from the file's history.
5. Return the numbers to the calling routine — the report skill needs them.

## Don't

- Don't fudge the close if the snapshot returned stale data. Log "stale benchmark data, skipping today's row" instead.
- Don't compare to a different benchmark mid-stream — that breaks the timeseries.
