# Bot 1 — General Market Bot

Long/swing fundamentals-driven bot. Goal: **beat SPY total return** over rolling 30 / 90 / 365 days. Mirrors the AIS reference build.

- Universe: liquid US large-caps + ETFs.
- Position sizing: max **5%** per name.
- Holding period: days to weeks. Not a day trader.
- Brokerage: Alpaca paper (`https://paper-api.alpaca.markets`).
- Notifications: ClickUp.

See [`strategy.md`](./strategy.md) for the rulebook the agent loads on every routine, and [`routines/`](./routines) for the five cron prompts you paste into claude.ai/code/routines.

## Routines

| File                              | Cron (CT)         | Purpose                             |
|-----------------------------------|-------------------|-------------------------------------|
| `routines/pre-market.md`          | `0 7 * * 1-5`     | Research catalysts, draft ideas     |
| `routines/market-open.md`         | `30 8 * * 1-5`    | Execute, set trailing stops         |
| `routines/midday.md`              | `0 11 * * 1-5`    | Cut losers, tighten winners         |
| `routines/eod.md`                 | `0 15 * * 1-5`    | Snapshot + benchmark + report       |
| `routines/weekly-review.md`       | `30 15 * * 5`     | Grade week, update strategy         |

## Memory

| File                          | Owner                | Read on            | Written on              |
|-------------------------------|----------------------|--------------------|-------------------------|
| `memory/strategy.md`          | weekly-review        | every routine      | weekly-review           |
| `memory/trade-log.md`         | trade skill          | every routine      | every order             |
| `memory/research-log.md`      | research skill       | pre-market, weekly | pre-market, weekly      |
| `memory/reasoning.md`         | journal skill        | every routine      | every routine           |
| `memory/benchmark.md`         | benchmark skill      | eod, weekly        | eod                     |
| `memory/weekly-review.md`     | weekly-review        | next pre-market    | weekly-review           |
