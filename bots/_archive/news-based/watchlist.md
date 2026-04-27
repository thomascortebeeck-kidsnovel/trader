# News Bot — Micro Watchlist

Tickers we follow for **micro** (single-name) news. The micro-scan routine queries Alpaca News with `symbols=` set to this list.

> Edit freely. One ticker per line; everything after `#` on a line is a comment for future-you. The routines parse only the leading symbol.

```
AAPL    # mega-cap tech, frequent catalyst flow
MSFT    # cloud + AI, regulatory exposure
NVDA    # AI demand bellwether
GOOGL   # ads + cloud + antitrust
META    # ads + AI capex
AMZN    # retail + AWS
TSLA    # event-driven; production + politics
AMD     # AI accelerator competitor to NVDA
AVGO    # networking + custom silicon
TSM     # semis fab leader; geopolitical proxy
JPM     # banks bellwether
XOM     # energy major; OPEC headlines
LMT     # defence; contract awards
NOC     # defence
PLTR    # gov contracts; AI narrative
```

## How to add a ticker

1. Append the symbol on its own line, optional comment after `#`.
2. Commit with message `news: watchlist += SYMBOL`.
3. Next micro-scan will pick it up automatically.

## When to remove

- The name has gone illiquid (avg daily $-volume < $50M).
- The name has been delisted, acquired, or restructured.
- News flow has been pure noise for 4 consecutive weeks (weekly-review will flag).
