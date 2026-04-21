# Routine: news-based / pre-market-news

**Cron (ET):** `30 7 * * 1-5`
**Environment:** `news-based`

---

You are the **news** bot. It is 2 hours before the open. Your job: digest overnight news from both feeds and decide which items merit action when the market opens.

Env vars (must exist): `ALPACA_API_KEY`, `ALPACA_SECRET_KEY`, `ALPACA_BASE_URL`, `FINNHUB_API_KEY`, `PERPLEXITY_API_KEY`, `CLICKUP_API_KEY`, `CLICKUP_TASK_ID`. Refuse to run if any are missing.

## Steps

1. Read:
   - `CLAUDE.md`
   - `bots/news-based/strategy.md`
   - `bots/news-based/watchlist.md`
   - `bots/news-based/macro-themes.md`
   - `bots/news-based/memory/seen-headlines.md` (just to know what to skip)
   - `bots/news-based/memory/trade-log.md` (last 20 rows)
   - `bots/news-based/memory/reasoning.md` (yesterday's EOD entry)
2. Pull overnight news:
   - Micro: `python scripts/alpaca.py news <comma-list of every watchlist ticker> 50`
   - Macro: `python scripts/finnhub.py general general 50` and `python scripts/finnhub.py general forex 30`
3. Calendars:
   - `python scripts/finnhub.py economic` — note any Fed / CPI / NFP releases today.
   - `python scripts/finnhub.py earnings $(date +%F) $(date +%F)` — note tickers reporting today.
4. Run `skills/news-filter/SKILL.md` over the combined ingest:
   - Dedupe vs `seen-headlines.md`. Append every new hash to `seen-headlines.md`.
   - Score importance + direction + source-tier per the rubric.
   - Keep only items rated ≥ 4 from a tier-1 source with clear direction.
5. Write a "tradeable items" block into `memory/reasoning.md` with format:
   ```
   ## YYYY-MM-DD pre-market-news

   MICRO (importance ≥ 4 from tier-1):
   - [SYMBOL] LONG (5/5) — headline. Source. URL. Suggested action: enter at open if confirmed.
   - ...

   MACRO (importance ≥ 4 from tier-1, theme mapped):
   - [THEME → ETF] LONG (4/5) — headline. Source. URL. Suggested action: ...

   SUPPRESSIONS:
   - SYMBOL reports earnings today → no micro entry until post-print + 30 min.
   - 14:00 ET FOMC → no entries 13:30–14:30 ET.
   ```
6. **Do not place orders.** This routine is research-only.
7. **Journal**.
8. Commit + push:
   ```
   git add -A
   git commit -m "news: pre-market — N tradeable items"
   git push origin HEAD
   gh pr create --fill --base claude/ai-trading-bot-system-magkk \
     --head "$(git rev-parse --abbrev-ref HEAD)" || true
   ```

## Don't

- Don't notify ClickUp from pre-market.
- Don't trust pre-market news as the entry trigger — wait for the regular session. The micro-scan and macro-scan routines will reconfirm.
