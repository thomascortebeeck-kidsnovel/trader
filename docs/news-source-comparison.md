# News Source Comparison — Why Alpaca News + Finnhub

The user asked for "api/webhook based logic from news source. Choose the best source and also add logic to filter the most important news to act on." This file documents the evaluation.

## Candidates considered

| Source                | Cost                          | Coverage                                    | Latency       | Webhook? |
|-----------------------|-------------------------------|---------------------------------------------|---------------|----------|
| **Alpaca News API**   | Free with Alpaca account      | US stocks, ticker-tagged, Benzinga firehose | Near real-time | WebSocket stream |
| **Finnhub**           | Free tier (60 calls/min)      | Global, general/forex/crypto/M&A categories | Minutes       | No (REST) |
| **Polygon.io**        | $29+/mo                       | Wide US + international, ticker-tagged      | Sub-second    | WebSocket |
| **Benzinga Pro**      | $177+/mo                      | US-focused, fast wires, analyst actions     | Sub-second    | API + WS |
| **NewsAPI.org**       | Free dev / paid               | Aggregator (less curated)                   | Minutes       | No        |
| **Marketaux**         | Free tier                     | Pre-tagged sentiment + symbols              | Minutes       | No        |
| **AlphaVantage News** | Free tier (25 calls/day)      | Tagged with topics + sentiment              | Minutes       | No        |
| **Reuters / Bloomberg terminal** | $$$$                | Tier-1 wires                                | Sub-second    | Enterprise |

## Decision: Alpaca News (primary) + Finnhub (secondary)

**Alpaca News** wins for the **micro** strategy because:
- Free with the Alpaca account we already have.
- Tagged with `symbols=` so we can filter to the watchlist server-side.
- Same SDK as the order endpoints — fewer moving parts.
- Pulls from Benzinga's wire, which itself aggregates Reuters, Bloomberg, AP, MarketWatch, etc.
- Both REST (for polling) and WebSocket (for streaming) endpoints.

**Finnhub** fills the **macro** gap:
- Categories beyond company-news: `general`, `forex`, `crypto`, `merger`.
- Built-in economic calendar (Fed releases, CPI, NFP) and earnings calendar.
- Free tier is sufficient for hourly macro polling.

We did **not** pick Polygon or Benzinga Pro because (a) cost, (b) for the polling cadence we run (30 min micro / 60 min macro), Alpaca's REST latency is fine, and (c) starting cheap means we can ship faster. If real-money latency ever becomes the bottleneck, Polygon is the natural upgrade.

## Webhook vs polling — honest answer to the user's request

The user asked for "webhook" logic. The truth:

- **Alpaca News supports a WebSocket stream** at `wss://stream.data.alpaca.markets/v1beta1/news` — a persistent connection that pushes news as it arrives. Not a webhook in the HTTP-callback sense.
- **Cloud routines are pull-not-push** — they wake on a cron, run, and exit. A persistent WebSocket inside a routine doesn't make sense.
- The Claude routines architecture is fundamentally **polling** — the routines are the polling cadence.
- This is fine for our use case: 30-min polling on 15 watchlist tickers gives adequate latency for fundamental catalyst trading. We're not trying to front-run high-frequency arbitrage.

## When to upgrade to a true webhook / streaming setup

If we ever need sub-minute latency (e.g. trading earnings reactions in the first minute), the upgrade path is:

1. Stand up a tiny always-on listener — a single Python process on a $5/mo VPS, or a Cloudflare Worker, or an AWS Lambda triggered by EventBridge — that subscribes to Alpaca's news WebSocket.
2. When a high-importance item arrives, the listener POSTs to a ClickUp task (or a webhook endpoint we set up).
3. The next routine poll picks it up immediately because the listener has surfaced it to a place the routine reads.

This decouples the "always listen" job from the "decide and trade" job, while keeping the trading logic inside Claude routines where it belongs.

**Built or planned:** documented here, not yet built. Ship the polling version first; add the listener if latency proves limiting.

## Filtering — the second half of the user's question

See `skills/news-filter/SKILL.md` for the full pipeline. Summary:

1. **Hash dedupe** against `seen-headlines.md` so we don't act twice on the same wire.
2. **Importance score 1–5** per the rubric (5 = market-moving named catalyst, 1 = noise).
3. **Direction tag** (LONG / SHORT / UNCLEAR).
4. **Source tier** (1 = Reuters/Bloomberg/WSJ/FT/AP/SEC filings/Fed; 2 = CNBC/Barron's/Benzinga; 3 = everything else).
5. **Hard cutoff:** trade only on importance ≥ 4 from a tier-1 source with non-UNCLEAR direction.

The weekly-review routine **calibrates** this rubric — if importance-5 items don't actually move the stock the way we tagged them, the rubric is too generous and we tighten it.

## Appendix: rate limits

| Source              | Limit                                                        |
|---------------------|--------------------------------------------------------------|
| Alpaca News (REST)  | 200 req/min (paper); plenty for our cadence                  |
| Alpaca News (WS)    | 1 connection per account; pushes everything subscribed to    |
| Finnhub free        | 60 calls/min, ~30 calls/sec burst                            |
| Perplexity          | varies by plan; we throttle to ≤ 2 queries per routine       |

If we hit a limit, fail loud — don't silently degrade.
