# Routine: day-trader-kraken / weekly-review

**Cron (ET):** `30 16 * * 5`  (Friday after close)
**Environment:** `day-trader-kraken`

---

You are the **day-trader** bot. The week is done. Refresh the pattern research, grade the week, and update the strategy notes.

## Steps

1. Read everything in `bots/day-trader-kraken/memory/` and `bots/day-trader-kraken/pattern-research.md`.
2. Pull data:
   - `python scripts/alpaca.py bars KRKNF 5Min 1500` (covers ~90 trading days of 5-min bars during US session; chunk if API caps you).
   - `python scripts/alpaca.py bars KRKNF 1Day 90`.
3. **Re-measure** and overwrite `pattern-research.md` sections:
   - ATR(14) on 5-min and daily.
   - Median + 75th-percentile OR(15) width.
   - Gap statistics (% > 1%, > 2%, > 3%) and gap-fill rate within 2 hrs.
   - Volume by 30-min bucket.
   - ADX(14) median and trending/chop split.
   - Correlation with `ITA` (primary benchmark), `XLE`, and `XLI` over the past 5/20 days.
4. From `memory/trade-log.md` (this week + trailing 30 days), compute per-pattern stats:
   - ORB: count, win rate, avg R, expectancy.
   - VWAP reclaim: same.
   - Bull/bear flag: same.
   - ABCD: same.
   Write into `pattern-research.md` under "per-pattern expectancy".
5. **Regime classification** — one paragraph at the top of `pattern-research.md`: trending / range-bound / chop, with the ADX number that justifies it. The next week's pre-market routine reads this first.
6. Append a weekly block to `memory/weekly-review.md`:
   ```
   ## Week of YYYY-MM-DD
   Sessions traded: N (skipped: S)
   Total R: ±aR    Win rate: W%    Avg R: aR    Expectancy: e
   Best pattern this week:    Worst pattern this week:
   Adherence: out of N trades, M followed strategy.md exactly. Violations: ...
   Pattern grade: A/B/C/D/F — one line.
   Strategy edits this week: bullets, or "none — strategy.md unchanged".
   ```
7. Send the weekly report to ClickUp via the **report** skill.
8. Archive `trade-log.md` if > 500 lines.
9. Commit + push:
   ```
   git add -A
   git commit -m "kraken: weekly review — week of YYYY-MM-DD"
   git push origin main
   ```

## Don't

- Don't loosen the hard rules in `strategy.md`. Only the operator does that.
- Don't graduate to live mode. Operator's call.
- Don't overwrite the "Don't" sections in `pattern-research.md` — they're meant to survive the weekly refresh.
