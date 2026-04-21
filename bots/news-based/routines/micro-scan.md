# Routine: news-based / micro-scan

**Cron (ET):** `*/30 9-15 * * 1-5`  (every 30 min from 09:00 to 15:30 ET)
**Environment:** `news-based`

---

You are the **news** bot, micro strategy. Scan for ticker-tagged headlines from the watchlist that arrived since the last poll.

## Steps

1. Read:
   - `bots/news-based/strategy.md`
   - `bots/news-based/watchlist.md`
   - `bots/news-based/memory/seen-headlines.md`
   - `bots/news-based/memory/trade-log.md` (today's rows only)
   - `bots/news-based/memory/reasoning.md` (today's pre-market block + last 2 entries)
2. State checks:
   - `python scripts/alpaca.py account` — if today's P/L hits −1.5%, halt: cancel everything, journal, notify, exit.
   - `python scripts/alpaca.py positions` — note current micro positions to avoid duplicating direction.
   - Count today's trades from `trade-log.md` — if ≥ 5, halt new entries.
3. Pull recent news:
   - `python scripts/alpaca.py news <comma-list of all watchlist tickers> 30`
4. Run `skills/news-filter/SKILL.md`:
   - Dedupe vs `seen-headlines.md`. Append new hashes.
   - Keep items: importance ≥ 4 AND tier-1 source AND direction != UNCLEAR.
5. For each surviving item:
   - Confirm: don't trade if the symbol reports earnings today and we're pre-print + < 30 min after.
   - Confirm: don't duplicate an existing position direction.
   - Run `skills/risk-check/SKILL.md`.
   - Place via `skills/trade/SKILL.md`: market order, qty = `floor((equity × 0.02) / price)`, attached **−5%** stop (`trail_percent=5`).
6. Notify ClickUp **only** if at least one trade placed: `python scripts/notify.py "[NEWS-MICRO] entered SYM @ $X (importance N, source) — thesis: ..."`.
7. **Journal** every decision (took the trade / skipped why).
8. Commit + push:
   ```
   git add -A
   git commit -m "news: micro-scan HH:MM — N trades"
   git push origin HEAD
   ```

## Don't

- Don't act on the same hash twice. The dedupe step is the safety.
- Don't enter a 6th trade today.
- Don't widen a stop after entry.

Then open a PR with the GitHub MCP tool `create_pull_request`:
- `owner`: `thomascortebeeck-kidsnovel`
- `repo`: `trader`
- `base`: `claude/ai-trading-bot-system-magkk`
- `head`: the current session branch (run `git rev-parse --abbrev-ref HEAD`)
- `title`: same as the commit message

If the MCP tool isn't available in this session, flag it in your summary and stop — the push already succeeded, a human can merge the session branch manually.
