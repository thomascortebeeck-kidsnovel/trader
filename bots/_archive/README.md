# Archived bots

`day-trader-kraken/` and `news-based/` were deactivated on **2026-04-24** to consolidate the system on a single bot — `bots/general/`.

The decision was data-driven. See PLAN.md → "Consolidation 2026-04-24" for the full rationale and citations. Short version: retail day trading and retail news-based trading are documented losing strategies (89-95% of retail day traders lose money within a year; news-driven retail flow shows negative alpha). Swing trading on a fundamentals + trend-following frame has documented retail-accessible alpha and is the only style that fits cleanly under Anthropic's 15-routine/day quota.

## What was kept

- All memory files (`reasoning.md`, `trade-log.md`, `pattern-cache.md`, `weekly-review.md`, `seen-headlines.md`, `benchmark.md`).
- All routine prompts (`pre-market.md`, `intraday-event.md`, `close-flatten.md`, `news-event.md`, `pre-market-news.md`, `eod.md`, `weekly-review.md`).
- Strategy + research docs (`strategy.md`, `pattern-research-tsla.md`, `pattern-research-krknf.md`, `watchlist.md`, `macro-themes.md`).

## What was deleted

- `scripts/intraday_poller.py`, `scripts/news_poller.py` (the GitHub Actions pollers that fired the API-trigger routines)
- `.github/workflows/intraday-poller.yml`, `.github/workflows/news-poller.yml`
- `docs/testing-pollers.md`

These can be recovered from git history if a bot is revived. They were also tightly coupled to symbol-specific config that has since been superseded.

## What the operator did manually

- Set the 7 routines below to **Inactive** in `claude.ai/code/routines`:
  - `news-based / pre-market-news`
  - `news-based / eod`
  - `news-based / weekly-review`
  - `news / news-event` (API trigger)
  - `day-trader-kraken / pre-market`
  - `day-trader-kraken / close-flatten`
  - `day-trader-kraken / weekly-review`
  - `kraken / intraday-event` (API trigger)
- Paused the two Cloud Scheduler jobs:
  - `news-poller-trigger`
  - `intraday-poller-trigger`
- Closed the 18 stale routine PRs (#50-#68) that had piled up due to the auto-merge draft bug (fixed in PR #69).

## How to revive a bot

If after a few months of measured general-bot performance you want to reactivate one of these:

1. `git mv bots/_archive/<bot> bots/<bot>`
2. Re-add the slug to `BOT_SLUGS` in `ui/lib/bots.ts`.
3. Re-create the routines in `claude.ai/code/routines` from the `routines/*.md` specs.
4. (For day-trader-kraken or news-based) Recover `scripts/<poller>.py` and `.github/workflows/<poller>.yml` from git history (e.g. `git show <pre-archive-sha>:scripts/intraday_poller.py > scripts/intraday_poller.py`).
5. Re-create the Cloud Scheduler jobs (run `scripts/setup-cloud-scheduler.sh` after restoring it from git history; it was removed too).
6. Re-add the relevant GitHub repo secrets + the routine API trigger URLs.

In practice, by the time a revival makes sense, the routine spec / strategy probably needs a refresh anyway — treat the archived files as historical context, not as a literal restore target.

## What never traded

- `day-trader-kraken/`: zero fills across its entire deployment. Symbol issues (KRKNF on Alpaca paper had no OTC feed; switched to TSLA, then quota issues + an auto-merge bug stranded all routine outputs on session branches that never reached main).
- `news-based/`: zero fills. The layer-1 filter eventually started passing tier-1 articles after `TIER1_DOMAINS` was widened, but the layer-2 routine ran with no fills landing on main due to the same auto-merge bug.

The `general/` bot did produce two real fills (QQQ + AMZN, both half-size, 2026-04-22) and remains active.
