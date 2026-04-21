# Routine: day-trader-kraken / close-flatten

**Cron (ET):** `50 15 * * 1-5`
**Environment:** `day-trader-kraken`

---

You are the **day-trader** bot. **Force flat by 15:55 ET**, no exceptions, even if the trade is profitable and "looks good for tomorrow."

## Steps

1. `python scripts/alpaca.py orders open` — cancel **all** open KRKNF orders (`scripts/alpaca.py cancel <id>` for each).
2. `python scripts/alpaca.py positions` — for any KRKNF position, `python scripts/alpaca.py close KRKNF`.
3. Wait for fill confirmation — re-poll `positions` until KRKNF count == 0 or until 15:58 ET.
4. Snapshot the day:
   - `python scripts/alpaca.py account` for end-of-day equity.
   - Compute today's R from `memory/trade-log.md` rows with today's date.
   - Run the **benchmark** skill against `ITA` (the day-trader's benchmark) and append today's row to `memory/benchmark.md`.
5. Notify ClickUp via the **report** skill (use the EOD format, but tagged `[KRAKEN]`):
   ```
   [KRAKEN] EOD YYYY-MM-DD
   Equity: $X (today: ±Y%)
   Trades: N (W winners, L losers)  Total R: ±aR
   Best: pattern @ $X = +Z R   Worst: pattern @ $X = −W R
   Plan today: TRADE / HALF / SKIP   Adhered: yes/no
   Notes: one short sentence on what surprised / worked.
   ```
6. **Reset** `memory/pattern-cache.md` — wipe today's setup, OR, and live-trade-state sections so tomorrow's pre-market starts clean.
7. **Journal** EOD reflection.
8. Commit + push:
   ```
   git add -A
   git commit -m "kraken: close-flatten — N trades, total ±aR, equity $X"
   git push origin HEAD
   ```

## Don't

- Don't carry "just a small position" overnight. The strategy is intraday only.
- Don't alter `pattern-research.md` from this routine. That's the weekly-review's job.

Then open a PR with the GitHub MCP tool `create_pull_request`:
- `owner`: `thomascortebeeck-kidsnovel`
- `repo`: `trader`
- `base`: `claude/ai-trading-bot-system-magkk`
- `head`: the current session branch (run `git rev-parse --abbrev-ref HEAD`)
- `title`: same as the commit message

If the MCP tool isn't available in this session, flag it in your summary and stop — the push already succeeded, a human can merge the session branch manually.
