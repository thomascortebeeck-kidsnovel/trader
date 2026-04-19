# Trader

A Claude Code repository hosting **three autonomous trading bots**, each driven by Claude Code routines + skills + markdown memory. All bots default to **Alpaca paper trading**.

> Read [`PLAN.md`](./PLAN.md) first for the full architecture and rationale.

## The three bots

| Bot                                | Strategy                                                         | Universe                                  |
|------------------------------------|------------------------------------------------------------------|-------------------------------------------|
| [`bots/general`](./bots/general)               | Long/swing fundamentals, beat SPY                              | Liquid US large-caps + ETFs               |
| [`bots/day-trader-kraken`](./bots/day-trader-kraken) | Single-name intraday, ORB + VWAP + ABCD                  | Kraken Robotics (KRKNF on US OTC, KRKN on TSX) |
| [`bots/news-based`](./bots/news-based)         | Headline-driven micro (per-ticker) + macro (sector ETFs)         | Watchlist tickers + sector ETFs           |

## Quick start

```bash
# 1. Clone, then copy the env template
cp env.template .env       # local only — never committed

# 2. Fill in your keys
#    ALPACA_API_KEY, ALPACA_SECRET_KEY, ALPACA_BASE_URL  (paper)
#    PERPLEXITY_API_KEY
#    FINNHUB_API_KEY
#    CLICKUP_API_KEY, CLICKUP_TASK_ID

# 3. Sanity-check Alpaca connectivity (paper)
python scripts/alpaca.py account

# 4. In claude.ai/code/routines, create environments and paste each
#    bots/<bot>/routines/*.md prompt into a remote routine pointing at
#    this repo. See docs/routine-setup-guide.md.
```

## Repo map

```
PLAN.md                  ← Architecture + rationale (read first)
CLAUDE.md                ← Global agent rulebook (loaded every session)
env.template             ← All env vars any bot expects
scripts/                 ← Thin Python wrappers (alpaca, perplexity, finnhub, clickup)
skills/                  ← Reusable agent capabilities
bots/general/            ← Bot 1
bots/day-trader-kraken/  ← Bot 2
bots/news-based/         ← Bot 3
docs/                    ← Research notes, source comparisons, setup guide
```

## Safety

Paper trading is the default for every bot. Real trading requires:

1. The bot's own `strategy.md` says it's eligible (≥30 paper days, positive expectancy, written post-mortem).
2. `LIVE_MODE=true` env var in that bot's routine environment.
3. Paper-only guardrail in root `CLAUDE.md` removed for that specific bot.

All three checks. No shortcut. Not financial advice.
