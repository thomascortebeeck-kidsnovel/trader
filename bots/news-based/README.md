# Bot 3 — News-Based Bot

Headline-driven trader. Two distinct strategies inside one bot:

- **Micro** — react to ticker-tagged news on a curated watchlist (`watchlist.md`). Trades the underlying stock.
- **Macro** — react to broad macro news (Fed, China, energy, AI policy, defence, semis). Trades sector ETFs only.

Both share a strict filtering pipeline (`skills/news-filter/SKILL.md`): hash-dedupe, importance score 1–5, direction tag, source-tier check. Only items rated **≥ 4 from a tier-1 source with clear direction** become trades.

## Sources

- **Primary:** Alpaca News API (free with Alpaca account, ticker-tagged, near-real-time, same SDK as orders).
- **Secondary:** Finnhub `/news` (general + forex categories) for macro coverage Alpaca doesn't surface.
- **Calendars:** Finnhub `/calendar/economic` and `/calendar/earnings` to suppress trades around events that are about to happen anyway.

We are **polling**, not pushing. See `docs/news-source-comparison.md` for why and how to upgrade to a low-latency listener if needed later.

## Routines

| File                                | Cron (ET)                | Purpose                              |
|-------------------------------------|--------------------------|--------------------------------------|
| `routines/pre-market-news.md`       | `30 7 * * 1-5`           | Overnight digest, plan for the day   |
| `routines/micro-scan.md`            | `*/30 9-15 * * 1-5`      | Per-ticker headlines from watchlist  |
| `routines/macro-scan.md`            | `15 9-15/1 * * 1-5`      | Macro themes + Fed calendar          |
| `routines/eod.md`                   | `15 16 * * 1-5`          | Daily report; signal-vs-outcome      |
| `routines/weekly-review.md`         | `0 17 * * 5`             | Filter calibration; tweak rubric     |
