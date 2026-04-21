# Routine: news-based / weekly-review

**Cron (ET):** `0 17 * * 5`  (Friday after EOD)
**Environment:** `news-based`

---

You are the **news** bot. Calibrate the filter, audit the week, propose changes.

## Steps

1. Read everything under `bots/news-based/memory/` plus `strategy.md`, `watchlist.md`, `macro-themes.md`.
2. **Filter calibration**:
   - For every importance-5 call this week, what % were directionally right (5 trading-day forward return aligned with our LONG/SHORT tag)?
   - Same for importance-4 calls.
   - If 5/5 hit-rate < 60%, the rubric is too generous — propose a tightening in `memory/weekly-review.md`. Don't unilaterally edit `skills/news-filter/SKILL.md`; flag it for the operator.
3. **Watchlist hygiene**:
   - Tickers with zero qualifying news in 4 consecutive weeks → propose removal.
   - Tickers from "unmapped themes" that came up repeatedly → propose addition.
4. **Macro-themes hygiene**:
   - Themes that fired but had no useful ETF mapping → propose addition.
5. **Performance**:
   - Bot return vs SPY for the week, trailing 30/90.
   - Micro vs macro contribution.
   - Best and worst trades — what worked / broke.
6. Append a weekly block to `memory/weekly-review.md` using the format from `skills/report/SKILL.md`, plus a "filter calibration" sub-section.
7. Send the weekly report to ClickUp via the **report** skill.
8. Archive `seen-headlines.md` if > 5,000 lines (keep only the trailing 30 days; older hashes can't dedupe practically since we no longer have the URLs in flight).
9. Commit + push:
   ```
   git add -A
   git commit -m "news: weekly review — week of YYYY-MM-DD"
   git push origin HEAD
   gh pr create --fill --base claude/ai-trading-bot-system-magkk \
     --head "$(git rev-parse --abbrev-ref HEAD)" || true
   ```

## Don't

- Don't unilaterally edit the filter rubric in `skills/news-filter/SKILL.md`. Propose, don't change.
- Don't graduate to live mode. Operator's call.
