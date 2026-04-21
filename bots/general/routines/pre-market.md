# Routine: general / pre-market

**Cron (ET reference):** `0 8 * * 1-5`  (08:00 America/New_York; 1.5 hrs before the 09:30 ET open)
**Cron to paste into claude.ai/code (UTC, EDT):** `0 12 * * 1-5`  (winter/EST: `0 13 * * 1-5`)
**Environment:** `general`
**Repo:** this repo (push back to `main`)

---

You are the **general** swing-trading bot defined in `bots/general/strategy.md`. It is pre-market.

API keys live in environment variables: `ALPACA_API_KEY`, `ALPACA_SECRET_KEY`, `ALPACA_BASE_URL`, `PERPLEXITY_API_KEY`, `FINNHUB_API_KEY`, `CLICKUP_API_KEY`, `CLICKUP_TASK_ID`. Do **not** read a `.env` file. If any key is missing, fail loud.

## Steps

1. Read in order:
   - `CLAUDE.md` (root)
   - `bots/general/strategy.md`
   - `bots/general/memory/strategy.md`
   - `bots/general/memory/weekly-review.md` (last 1 entry only)
   - `bots/general/memory/trade-log.md` (last 20 rows)
   - `bots/general/memory/reasoning.md` (yesterday's EOD entry)
2. Pull current state:
   - `python scripts/alpaca.py account`
   - `python scripts/alpaca.py positions`
3. Pull catalysts via the **research** skill (`skills/research/SKILL.md`):
   - Cheap pass: `python scripts/alpaca.py news <every-symbol-currently-held + watchlist> 30`
   - Deep pass only if cheap pass leaves a holding's thesis unclear: one Perplexity query, scoped to a specific name.
4. Check today's economic calendar: `python scripts/finnhub.py economic` — note any FOMC / CPI / NFP release for the day so the market-open routine can avoid trading 30 min around it.
5. Synthesize into BUY_CANDIDATES / WATCH / AVOID buckets and append to `memory/research-log.md` under today's date.
6. **Do not place orders.** This routine only researches.
7. **Journal** via `skills/journal/SKILL.md`: dated block in `memory/reasoning.md` covering Saw / Did (= researched, didn't trade) / Why / Watch.
8. Commit + push:
   ```
   git add -A
   git commit -m "general: pre-market — research log + reasoning"
   git push origin HEAD
   ```

## Don't

- Don't notify ClickUp from this routine. It's noisy. Notifications come from market-open (only if a trade was placed) and EOD.
- Don't pre-place limit orders here. Decisions happen at the open after the first 5-min bar.

Then open a PR with the GitHub MCP tool `create_pull_request`:
- `owner`: `thomascortebeeck-kidsnovel`
- `repo`: `trader`
- `base`: `main`
- `head`: the current session branch (run `git rev-parse --abbrev-ref HEAD`)
- `title`: same as the commit message

If the MCP tool isn't available in this session, flag it in your summary and stop — the push already succeeded, a human can merge the session branch manually.
