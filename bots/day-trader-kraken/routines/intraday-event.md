# Routine: day-trader-kraken / intraday-event

**Trigger:** API (fired by `scripts/intraday_poller.py` via GitHub Actions)
**Environment:** `day-trader-kraken`

---

You are the **day-trader** bot. The intraday poller detected an event worth evaluating for TSLA. The event details are in your initial context — read them carefully before doing anything else.

## Understanding the event

The poller fires for one of these event types:

- **OR_COMPLETE** — The opening range (first 15 minutes) is set. The poller computed ORH, ORL, OR width, and avg OR volume. Your job: check if the current bar confirms an ORB setup (close > ORH or < ORL on volume > 1.5× OR avg). If yes, enter. If not, journal why and exit.

- **VWAP_CROSSOVER_LONG / SHORT** — Price crossed VWAP on a 5-min close. Your job: check whether this is the VWAP reclaim pattern from `strategy.md`. Key check: was price below VWAP for at least a few bars before the cross (long) or above for a few bars (short)? Enter on the NEXT bar's high/low — not on the crossover bar. The poller already noted the price and volume at the event.

- **VOLUME_SPIKE** — A 5-min bar printed volume > 1.5× session avg. Your job: check what pattern is forming around this spike. A spike into a breakout level (ORH, VWAP, prior-day high) with continuation = setup. A spike into a wall with reversal wick = trap — do not enter.

- **POSITION_MILESTONE** — An open position has hit a profit milestone (1R or 1.5R). Your job: manage it according to strategy.md (tighten stop to break-even at 1R; switch to ATR-trail at 1.5R).

## Steps

1. Read `bots/day-trader-kraken/strategy.md` and `bots/day-trader-kraken/memory/pattern-cache.md`.

2. If `pattern-cache.md` plan = **SKIP** → journal `"skipped per pre-market plan"`, commit, exit. No trades today.

3. Check account and positions:
   - `python scripts/alpaca.py account` — if unrealised + realised P/L for today ≤ −1.5% of equity → halt: cancel all TSLA orders, journal, notify, exit.
   - `python scripts/alpaca.py positions` — note any open TSLA position.

4. Count today's trades from `memory/trade-log.md`. If ≥ 3 → no new entry possible; only position management.

5. Apply the event-specific logic:

   **OR_COMPLETE:**
   - Extract ORH, ORL, OR_width, OR_avg_vol from the event payload.
   - Pull the most recent 5-min bar: `python scripts/alpaca.py bars TSLA 5Min 1`
   - Long ORB: bar close > ORH AND bar volume > 1.5 × OR_avg_vol → enter long.
   - Short ORB: bar close < ORL AND bar volume > 1.5 × OR_avg_vol → enter short.
   - Only the first side to confirm is the trade. Don't take both.
   - If neither confirms by 10:00 ET, no ORB trade today. Journal it.

   **VWAP_CROSSOVER_LONG:**
   - Pull bars: `python scripts/alpaca.py bars TSLA 5Min 10`
   - Confirm: at least 2 bars before the event were below VWAP. If the price just dipped below briefly (≤ 1 bar), skip — not a clean reclaim.
   - No open position? Compute entry (next bar high), stop (swing low below VWAP), target (prior-day high or 2R).
   - Run `skills/risk-check/SKILL.md`. If pass and R/R ≥ 2:1 → enter.

   **VWAP_CROSSOVER_SHORT:**
   - Mirror of LONG logic: at least 2 bars above VWAP before the cross, then failed hold.
   - Entry on next bar low, stop = swing high above VWAP.

   **VOLUME_SPIKE:**
   - Pull bars: `python scripts/alpaca.py bars TSLA 5Min 10`
   - Characterise the spike: close near high of the bar = bullish; close near low = bearish; long wick either end = potential trap.
   - Check if any named pattern from strategy.md is in play (bull flag, ORB breakout, VWAP reclaim). If yes, treat as confirmation volume and act per that pattern's rules. If no clear pattern, journal and exit — do not trade volume alone.

   **POSITION_MILESTONE:**
   - Read the milestone(s) from the event (1R, 1.5R).
   - Pull current position: `python scripts/alpaca.py positions`
   - 1R hit: submit a replace-order to move stop to break-even. Use `python scripts/alpaca.py cancel <stop_order_id>` then re-submit at entry price.
   - 1.5R hit: compute ATR-trail stop = entry ± 1.5 × ATR(5m). Update the stop.
   - Update `pattern-cache.md` live trade state section.

6. If entering a new trade:
   - Compute position size via `skills/trade/SKILL.md`. Half-size if plan = HALF-SIZE.
   - Run `skills/risk-check/SKILL.md`. Only proceed if it passes.
   - `python scripts/alpaca.py order BUY TSLA <qty> market` (or SELL for short).
   - Submit stop-loss: `python scripts/alpaca.py order SELL TSLA <qty> stop <stop_price>` with `time_in_force=day`.
   - Submit take-profit: `python scripts/alpaca.py order SELL TSLA <qty> limit <target_price>` with `time_in_force=day`.
   - Update `pattern-cache.md` live trade state: entry, stop, target, pattern, time.

7. Notify ClickUp — only on entry, stop adjustment, or exit:
   - `python scripts/notify.py "[KRAKEN] <action> @ $<price> — <pattern> — stop $<stop> target $<target>"`

8. Journal to `memory/reasoning.md` (one paragraph: what event fired, what you saw in the bars, what you decided, why).

9. Append to `memory/trade-log.md` only if a trade was placed or modified (skill handles format).

10. Commit + push:
    ```bash
    git add bots/day-trader-kraken/memory/ bots/day-trader-kraken/routines/
    git commit -m "kraken: intraday-event <HH:MM> — <event_type> — <action>"
    git push origin HEAD
    ```

## Hard rules (from strategy.md — never override)

- No trade if daily loss cap (−1.5% equity) hit.
- No trade during 12:00–13:00 ET lunch lull (journal and exit if event fires then).
- No FOMC announcement day trades unless after 15:00 ET.
- No averaging into a loser. Stop is the stop.
- Max 3 trades per day total.
- Force-flatten at 15:55 ET is handled by `close-flatten.md` — do NOT enter a new trade after 15:25 ET.
- No options. No leveraged ETFs. Shares only.

## Don't open a PR

This routine commits memory files only. No PR needed — the auto-merge workflow only applies to session branches started by scheduled routines. Use `git push origin HEAD` directly.
