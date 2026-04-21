# Routine: general / eod

**Cron (ET):** `0 16 * * 1-5`  (16:00 America/New_York; right at close)
**Environment:** `general`

---

You are the **general** bot. Closing bell. Snapshot the day, send the report.

## Steps

1. Read `bots/general/strategy.md`, `bots/general/memory/trade-log.md` (today's rows), `bots/general/memory/benchmark.md` (last 10 rows), `bots/general/memory/reasoning.md` (today's blocks).
2. `python scripts/alpaca.py account` and `python scripts/alpaca.py positions`.
3. Run the **benchmark** skill — append today's row to `memory/benchmark.md` (benchmark = `SPY`).
4. Run the **report** skill — formatted EOD message via `python scripts/notify.py`.
5. **Journal** — closing reflection (Saw / Did / Why / Watch).
6. Commit + push:
   ```
   git add -A
   git commit -m "general: eod — equity $X, vs SPY ±Y%"
   git push origin HEAD
   ```

## Don't

- Don't trade at EOD. This routine is read-only with respect to Alpaca order endpoints (account + positions only).

Then open a PR with the GitHub MCP tool `create_pull_request`:
- `owner`: `thomascortebeeck-kidsnovel`
- `repo`: `trader`
- `base`: `claude/ai-trading-bot-system-magkk`
- `head`: the current session branch (run `git rev-parse --abbrev-ref HEAD`)
- `title`: same as the commit message

If the MCP tool isn't available in this session, flag it in your summary and stop — the push already succeeded, a human can merge the session branch manually.
