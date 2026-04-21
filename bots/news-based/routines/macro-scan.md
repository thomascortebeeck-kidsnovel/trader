# Routine: news-based / macro-scan

**Cron (ET):** `15 9-15/1 * * 1-5`  (every hour at :15, 09:15–15:15 ET)
**Environment:** `news-based`

---

You are the **news** bot, macro strategy. Translate broad macro headlines into sector-ETF trades using `macro-themes.md`.

## Steps

1. Read:
   - `bots/news-based/strategy.md`
   - `bots/news-based/macro-themes.md` (full file — your translation table)
   - `bots/news-based/memory/seen-headlines.md`
   - `bots/news-based/memory/trade-log.md` (today's rows)
   - `bots/news-based/memory/reasoning.md` (today's pre-market + last 2 entries)
2. State checks (same halt rules as micro-scan).
3. Count current macro positions — if 2 are already open, no new entries; just journal and exit.
4. Pull recent macro news:
   - `python scripts/finnhub.py general general 30`
   - `python scripts/finnhub.py general forex 20`
5. Run `skills/news-filter/SKILL.md`. Keep items: importance ≥ 4, tier-1, direction set.
6. For each surviving item:
   - Match the headline to a theme in `macro-themes.md`. If no match, append to `memory/reasoning.md` under "unmapped themes" (the weekly-review will consider adding it). Skip the trade.
   - If matched, pick the ETF from the mapping.
   - Don't trade the same theme twice today (check `trade-log.md` rows tagged with the theme).
   - Run `skills/risk-check/SKILL.md`.
   - Place via `skills/trade/SKILL.md`: qty = `floor((equity × 0.03) / price)`, attached **−4%** stop.
7. Notify ClickUp on entry: `python scripts/notify.py "[NEWS-MACRO] entered ETF @ $X (theme: T) — thesis: ..."`.
8. **Journal**.
9. Commit + push.

## Don't

- Don't trade leveraged ETFs. Strategy.md is explicit.
- Don't trade outside the cataloged ETF list.
- Don't trade in the 30-min window around a Fed announcement (use the suppressions block from pre-market).

## Commit + push + PR

At the end of the routine, always:

```bash
git add -A
git commit -m "news: macro-scan — N ETF entries"
git push origin HEAD
```

Then open a PR with the GitHub MCP tool `create_pull_request`:
- `owner`: `thomascortebeeck-kidsnovel`
- `repo`: `trader`
- `base`: `main`
- `head`: the current session branch (run `git rev-parse --abbrev-ref HEAD`)
- `title`: same as the commit message

If the MCP tool isn't available in this session, flag it in your summary and stop — the push already succeeded, a human can merge the session branch manually.
