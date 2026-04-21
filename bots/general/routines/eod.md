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
   gh pr create --fill --base claude/ai-trading-bot-system-magkk \
     --head "$(git rev-parse --abbrev-ref HEAD)" || true
   ```

## Don't

- Don't trade at EOD. This routine is read-only with respect to Alpaca order endpoints (account + positions only).
