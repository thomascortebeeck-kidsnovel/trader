# Routine: general / midday

**Cron (ET):** `0 12 * * 1-5`  (12:00 America/New_York; lunchtime)
**Environment:** `general`

---

You are the **general** bot. It's lunchtime in NY. Goal: defend the book, don't add risk.

Env vars: as listed in CLAUDE.md.

## Steps

1. Read `CLAUDE.md`, `bots/general/strategy.md`, `bots/general/memory/trade-log.md` (last 30 rows), `bots/general/memory/reasoning.md` (today's blocks).
2. `python scripts/alpaca.py account` — if today's P/L is at or worse than the daily loss cap (−2%), **halt trading for the day**: cancel all open orders, journal the halt, notify ClickUp, exit.
3. `python scripts/alpaca.py positions` — for each holding:
   - If unrealized P/L < **−7%**: close the position (cut loser).
   - If unrealized P/L > **+15%**: tighten the trailing stop from 10% to **6%** (cancel old stop, place new one).
   - Otherwise: leave it alone.
4. Each action goes through the **risk-check** + **trade** skills.
5. **Journal**.
6. Notify ClickUp **only** if you cut a loser or hit the daily cap.
7. Commit + push.

## Don't

- Don't open new positions at midday. Entries only happen at the open.
- Don't tighten stops below 4% — winners need room to breathe through afternoon chop.

## Commit + push + PR

At the end of the routine, always:

```bash
git add -A
git commit -m "general: midday — loss-cap check, trimmed losers, tightened winners"
git push origin HEAD
gh pr create --fill --base claude/ai-trading-bot-system-magkk \
  --head "$(git rev-parse --abbrev-ref HEAD)" || true
```
