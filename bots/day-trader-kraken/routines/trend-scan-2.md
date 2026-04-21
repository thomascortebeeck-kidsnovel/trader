# Routine: day-trader-kraken / trend-scan-2

**Cron (ET):** `30 13 * * 1-5`
**Environment:** `day-trader-kraken`

---

You are the **day-trader** bot, after the lunch lull. Time horizon shrinks — only ~2.5 hrs to the force-flatten.

## Steps

1. Read same files as `trend-scan-1.md`.
2. Account + positions check (halt if loss cap hit).
3. Position management:
   - Same rules as `trend-scan-1.md` (BE move at 1R, ATR-trail at 1.5R).
   - Additional: if a position has been open > 2 hrs and is < 0.5R in profit, exit at market — capital should be working harder.
4. **One** new entry possible if no position is open, plan ≠ SKIP, and trade count today < 3:
   - **VWAP reclaim** setup: price was below VWAP in the morning; if it now closes above VWAP on a 5-min bar AND volume > 1.2× the day's avg 5-min volume → long entry on the next bar's high. Stop at the swing low under VWAP. Target prior-day high or 2R, whichever is closer.
   - **Reversal pattern** off afternoon high/low: failed break + close back inside the range → counter-trend trade with a tight stop. Half-size only.
5. Notify on entry, stop adjust to BE, or exit.
6. **Journal**, commit, push.

## Don't

- Don't enter inside the last 30 min. Use that window to manage, not initiate.
- Don't average a losing position. Stop is the stop.

## Commit + push + PR

At the end of the routine, always:

```bash
git add -A
git commit -m "kraken: trend-scan-2 — manage + possible VWAP-reclaim / reversal"
git push origin HEAD
gh pr create --fill --base claude/ai-trading-bot-system-magkk \
  --head "$(git rev-parse --abbrev-ref HEAD)" || true
```
