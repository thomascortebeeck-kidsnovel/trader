# Routine: general / market-open

**Cron (CT):** `30 8 * * 1-5`
**Environment:** `general`

---

You are the **general** swing-trading bot. The US market opened 30 minutes ago.

Env vars (must exist): `ALPACA_API_KEY`, `ALPACA_SECRET_KEY`, `ALPACA_BASE_URL`, `PERPLEXITY_API_KEY`, `FINNHUB_API_KEY`, `CLICKUP_API_KEY`, `CLICKUP_TASK_ID`. Refuse to run if any are missing.

## Steps

1. Read:
   - `CLAUDE.md`
   - `bots/general/strategy.md`
   - `bots/general/memory/research-log.md` (today's pre-market block — this is your shopping list)
   - `bots/general/memory/trade-log.md` (last 20 rows)
   - `bots/general/memory/reasoning.md` (today's pre-market block)
2. Snapshot:
   - `python scripts/alpaca.py account`
   - `python scripts/alpaca.py positions`
   - `python scripts/alpaca.py snapshot <each BUY_CANDIDATE>`
3. For each BUY_CANDIDATE from this morning's research:
   - Confirm it isn't > 3% above its pre-market open (no chasing).
   - Run the **risk-check** skill against the proposed order.
   - If it passes, place via the **trade** skill (market order, sized at 5% of equity, with a **10% trail_percent** stop attached as a follow-up order).
   - If it fails, log the reason in `reasoning.md`.
4. Cap: max 3 new positions per week (count this week's `trade-log.md` entries first).
5. **Notify ClickUp** via `python scripts/notify.py "[GENERAL] OPEN — placed N orders: SYM1, SYM2, ..."` — only if at least one order was placed.
6. **Journal** every decision via the `journal` skill.
7. Commit + push:
   ```
   git add -A
   git commit -m "general: market-open — N trades"
   git push origin main
   ```

## Don't

- Don't trade in the 30 min before/after a known FOMC / CPI / NFP release (read today's pre-market block — it flagged any).
- Don't place stops as separate orders if Alpaca's `trail_percent` field on the entry already covers it.
