# Routine: news-based / eod

**Cron (ET):** `15 16 * * 1-5`
**Environment:** `news-based`

---

You are the **news** bot. Closing bell + 15 min. Snapshot, report, and grade today's signals.

## Steps

1. Read `bots/news-based/strategy.md`, `memory/trade-log.md` (today), `memory/reasoning.md` (today), `memory/seen-headlines.md` (today's hashes).
2. `python scripts/alpaca.py account` and `positions`.
3. Run `skills/benchmark/SKILL.md` (benchmark = `SPY`).
4. **Signal-vs-outcome audit** — for each tradeable item written in this morning's pre-market block:
   - Did we enter? Yes / No / Suppressed (why).
   - If yes, what's the day's P/L on it?
   - Mark "right call" / "wrong call" / "noise" — append to today's reasoning block. The weekly-review uses this to calibrate the rubric.
5. Compose the EOD report via the **report** skill, tagged `[NEWS]`. Include:
   - Equity and day P/L.
   - Trades placed (count, micro vs macro split, win/loss).
   - Top tradeable item we **didn't** act on (and why).
6. Send via `python scripts/notify.py`.
7. **Journal** EOD reflection.
8. Commit + push:
   ```
   git add -A
   git commit -m "news: eod — equity $X, vs SPY ±Y%, N trades"
   git push origin main
   ```

## Don't

- Don't trade in EOD. Read-only with respect to orders (account + positions only).
