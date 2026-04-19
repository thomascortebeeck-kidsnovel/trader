# Routine: day-trader-kraken / trend-scan-1

**Cron (ET):** `30 10 * * 1-5`
**Environment:** `day-trader-kraken`

---

You are the **day-trader** bot, mid-morning. Manage what's open. Look for one continuation pattern.

## Steps

1. Read `bots/day-trader-kraken/strategy.md`, `pattern-research.md`, `memory/pattern-cache.md`, `memory/trade-log.md` (today's rows).
2. `python scripts/alpaca.py account` — if at daily loss cap, halt: cancel all KRKNF orders, journal, notify, exit.
3. `python scripts/alpaca.py positions` — for any KRKNF position:
   - If unrealized P/L ≥ 1R AND we're not already at the limit target: tighten the stop to break-even.
   - If unrealized P/L ≥ 1.5R: trail stop at 1.5 × ATR(5m) below price (long) / above price (short).
4. **One** new entry possible if no position is open AND today's plan ≠ SKIP:
   - Look for **bull flag** or **bear flag** in the 09:50–10:30 window.
   - Definition: prior 5-min impulse leg of ≥ 2 × ATR(5m), then 3–5 bars of consolidation with shrinking range. Entry on break of consolidation high (long) / low (short) on volume > prior bar.
   - Stop = opposite end of consolidation. Target = measured-move (impulse leg length).
   - Run `risk-check`, place via `trade` skill. Half-size if plan = HALF-SIZE.
5. Update `memory/pattern-cache.md` "Live trade state".
6. Notify ClickUp **only** on entry, on stop-tighten to break-even, or on full exit.
7. **Journal**, commit, push.

## Don't

- Don't enter a 3rd trade today even if a flag forms. Cap is 3.
- Don't enter after a loss without a 30-min cooldown.
