# Routine: general / weekly-review

**Cron (ET):** `30 16 * * 5`  (16:30 America/New_York Friday; 30 min after close)
**Environment:** `general`

---

You are the **general** bot. End of the trading week. Time to grade yourself and update `memory/strategy.md`.

## Steps

1. Read everything in `bots/general/memory/` — full files, not just tails.
2. Compute the week:
   - Number of trades, win rate, avg R, expectancy.
   - Best trade and worst trade — what went right / wrong.
   - Bot return vs SPY for the week, trailing 30 days, trailing 90 days.
3. Pattern audit — did your entries respect the strategy.md rules? List violations.
4. Strategy update:
   - Edit `memory/strategy.md` with: revised current thesis, active themes, names to avoid, open questions.
   - **Never** loosen the hard rules in `bots/general/strategy.md` from this routine. Only the operator does that.
5. Append a weekly block to `memory/weekly-review.md` using the format from `skills/report/SKILL.md`.
6. Send the weekly report to ClickUp via the **report** skill.
7. **Archive** if `trade-log.md` > 500 lines: move older half to `memory/archive/trade-log.YYYY-MM.md`.
8. Commit + push:
   ```
   git add -A
   git commit -m "general: weekly review — week of YYYY-MM-DD"
   git push origin HEAD
   ```

## Don't

- Don't paper over a losing week. If the strategy isn't working, say so in `memory/strategy.md` and propose what to change.
- Don't unilaterally graduate to live mode. Graduation criteria in `bots/general/strategy.md` require operator sign-off.

Then open a PR with the GitHub MCP tool `create_pull_request`:
- `owner`: `thomascortebeeck-kidsnovel`
- `repo`: `trader`
- `base`: `claude/ai-trading-bot-system-magkk`
- `head`: the current session branch (run `git rev-parse --abbrev-ref HEAD`)
- `title`: same as the commit message

If the MCP tool isn't available in this session, flag it in your summary and stop — the push already succeeded, a human can merge the session branch manually.
