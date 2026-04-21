# Routine: day-trader-kraken / opening-range

**Cron (ET):** `45 9 * * 1-5`
**Environment:** `day-trader-kraken`

---

You are the **day-trader** bot. The first 15 minutes of trading just closed. Time to see if the Opening Range Breakout setup is live.

## Steps

1. Read `bots/day-trader-kraken/strategy.md`, `bots/day-trader-kraken/pattern-research.md`, `bots/day-trader-kraken/memory/pattern-cache.md`.
2. If `pattern-cache.md`'s plan says **SKIP** → journal "skipped per pre-market plan", commit, exit.
3. Pull state:
   - `python scripts/alpaca.py account` — confirm not already at daily loss cap; if so, halt.
   - `python scripts/alpaca.py positions`
   - `python scripts/alpaca.py bars KRKNF 5Min 5` — last 5 bars covers the 09:30–09:45 OR.
4. Compute and write into `pattern-cache.md` "Opening Range" section:
   - ORH = max high of the 3 OR bars
   - ORL = min low of the 3 OR bars
   - OR width = ORH − ORL
   - 5-min avg volume during OR
5. Wait for the **next** 5-min bar (09:45–09:50). If you can't see it yet, exit and let the next routine handle it.
6. **Setup detection** (only one trade possible per OR — pick the side that confirms first):
   - **Long ORB**: 09:45–09:50 close > ORH AND volume > 1.5× OR avg.
     - Stop = ORL.
     - Target = entry + 2 × OR width.
     - Position size via `skills/trade/SKILL.md`'s day-trader formula. Half-size if `pattern-cache.md` plan = HALF-SIZE.
   - **Short ORB**: same logic mirrored below ORL.
7. Run `skills/risk-check/SKILL.md`. If pass:
   - Place market entry via `scripts/alpaca.py order`.
   - Place stop-loss via a separate stop order (`stop`, time_in_force=`day`).
   - Place limit take-profit at the target (`limit`, time_in_force=`day`).
   - Update `pattern-cache.md` "Live trade state" with all four numbers + pattern = "ORB".
8. Notify ClickUp: `python scripts/notify.py "[KRAKEN] ORB long entry @ $X, stop $Y, target $Z, qty Q"` — only if a trade was placed.
9. **Journal** to `memory/reasoning.md`.
10. Append to `memory/trade-log.md` (skill handles this).
11. Commit + push.

## Don't

- Don't enter both directions. Whichever confirms first is the trade. If neither confirms by 10:00 ET, no ORB trade today.
- Don't widen the stop after entry. The stop is the stop.
- Don't size up because "the move feels strong." Sizing is formulaic.

## Commit + push + PR

At the end of the routine, always:

```bash
git add -A
git commit -m "kraken: opening-range — ORB decision + trade if confirmed"
git push origin HEAD
```

Then open a PR with the GitHub MCP tool `create_pull_request`:
- `owner`: `thomascortebeeck-kidsnovel`
- `repo`: `trader`
- `base`: `main`
- `head`: the current session branch (run `git rev-parse --abbrev-ref HEAD`)
- `title`: same as the commit message

If the MCP tool isn't available in this session, flag it in your summary and stop — the push already succeeded, a human can merge the session branch manually.
