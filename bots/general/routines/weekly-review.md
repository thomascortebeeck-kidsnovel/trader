# Routine: general / weekly-review

**Cron (CT):** `30 15 * * 5`  (Friday after EOD)
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
   git push origin main
   ```

## Don't

- Don't paper over a losing week. If the strategy isn't working, say so in `memory/strategy.md` and propose what to change.
- Don't unilaterally graduate to live mode. Graduation criteria in `bots/general/strategy.md` require operator sign-off.
