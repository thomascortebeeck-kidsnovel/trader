# Routine: general / market-open

**Cron (ET):** `0 10 * * 1-5`  (10:00 America/New_York; 30 min after the open so the first 5-min bar has settled)
**Environment:** `general`

---

You are the **general** swing-trading bot. The US market opened 30 minutes ago.

Env vars (must exist): `ALPACA_API_KEY`, `ALPACA_SECRET_KEY`, `ALPACA_BASE_URL`, `PERPLEXITY_API_KEY`, `FINNHUB_API_KEY`, `CLICKUP_API_KEY`, `CLICKUP_TASK_ID`. Refuse to run if any are missing.

## Steps

1. Read:
   - `CLAUDE.md`
   - `bots/general/strategy.md`
   - `bots/general/memory/research-log.md` (today's pre-market block — this is your shopping list)
   - `bots/general/memory/weekly-review.md` (last 1 entry — the operator's WATCH → BUY permissions for this week)
   - `bots/general/memory/trade-log.md` (last 20 rows)
   - `bots/general/memory/reasoning.md` (today's pre-market block)
2. Snapshot:
   - `python scripts/alpaca.py account`
   - `python scripts/alpaca.py positions`
   - `python scripts/alpaca.py snapshot <each candidate>` (both BUY_CANDIDATES and any weekly-review-permitted WATCH names — see step 3)
3. Assemble the effective shopping list:
   - Start with `BUY_CANDIDATES` from today's pre-market block in `research-log.md`.
   - **Fallback:** if `BUY_CANDIDATES` is empty AND today's `weekly-review.md` block is active (signed off, Valid-through today or later) AND names it explicitly permits are present in today's `WATCH` list, **treat those WATCH names as BUY_CANDIDATES** for this routine only (in the order of preference the weekly-review specifies). Pre-market is now responsible for doing this synthesis itself, but the fallback prevents a one-session miss when older research-log blocks predate the gating rule.
   - Log in `reasoning.md` exactly which names entered the shopping list and via which path (pre-market `BUY_CANDIDATES` vs weekly-review fallback).

4. For each name on the effective shopping list, in preference order:
   - Confirm it isn't > 3% above its pre-market open (no chasing).
   - Confirm above 50-day SMA (compute locally from `python scripts/alpaca.py bars <SYM> 1Day 60`).
   - Confirm no do-nothing tripwire in today's `weekly-review.md` is tripped (crude > $95, Fed-speaker proximity, `trading_blocked`, weekly P/L ≤ −1.5%).
   - Run the **risk-check** skill against the proposed order.
   - If all pass, place via the **trade** skill — size per weekly-review (typically half-size = 2.5% equity for cold-start seeds; full-size = 5% equity only when weekly-review explicitly allows) — with a **10% trail_percent** stop attached.
   - If any check fails, log the reason in `reasoning.md` and move on. Never loosen rules intraday.
5. Cap: max weekly position count defined by the active `weekly-review.md` block (overrides strategy.md's default of 3 when the weekly-review is more conservative; strategy.md's 3 is a ceiling, never a floor).
6. **Notify ClickUp** via `python scripts/notify.py "[GENERAL] OPEN — placed N orders: SYM1, SYM2, ..."` — only if at least one order was placed.
7. **Journal** every decision via the `journal` skill.
8. Commit + push:
   ```
   git add -A
   git commit -m "general: market-open — N trades"
   git push origin HEAD
   ```

## Don't

- Don't trade in the 30 min before/after a known FOMC / CPI / NFP release (read today's pre-market block — it flagged any).
- Don't place stops as separate orders if Alpaca's `trail_percent` field on the entry already covers it.

Then open a PR with the GitHub MCP tool `create_pull_request`:
- `owner`: `thomascortebeeck-kidsnovel`
- `repo`: `trader`
- `base`: `main`
- `head`: the current session branch (run `git rev-parse --abbrev-ref HEAD`)
- `title`: same as the commit message

If the MCP tool isn't available in this session, flag it in your summary and stop — the push already succeeded, a human can merge the session branch manually.
