# Day-Trader Bot — Intraday Pattern Cache

Overwritten by pre-market routine. Read by the trading routines.

## Today's setup

- Date: 2026-04-21
- Pre-market gap: N/A (no bar data — OTC feed forbidden for this subscription; KRKNF on Alpaca is `status=inactive, tradable=false`)
- Catalyst: NONE in the past 24h. Alpaca news: only stale items (latest 2026-03-04). Finnhub company-news past 7d: 1 item (SeekingAlpha "Trump / Strait of Hormuz" tagged KRKNF, 2026-04-18 — macro, not KRKN-specific). No KRKN* in the 2026-04-21 → 2026-04-23 earnings calendar.
- Liquidity check: FAIL — cannot measure. OTC feed returns 403; IEX/SIP return 0 bars for KRKNF.
- Today's plan: **SKIP**
- Levels:
  - Prior-day high: unavailable (no data)
  - Prior-day low: unavailable (no data)
  - Pre-market high: unavailable (no data)
  - Pre-market low: unavailable (no data)
  - 50-day SMA: unavailable (no data)

### Why SKIP (operator: please read)

Two independent blockers — both beyond the bot's control today:

1. **Symbol not routable on Alpaca paper.** `GET /v2/assets/KRKNF` returns `status: inactive, tradable: false`. Any order the trading routine places will be rejected by the broker.
2. **No bar data.** KRKNF is OTC. Alpaca's `otc` data feed returns 403 (not in our subscription); `iex` and `sip` feeds return 0 bars. Without bars we cannot compute ATR, OR, VWAP, or the liquidity gate — every allowed setup in `strategy.md` depends on these.

Until the operator either (a) upgrades Alpaca to a plan that includes OTC data **and** routes KRKNF as tradable, or (b) wires the TSX listing `KRKN` through a Canadian broker, this bot should treat every pre-market as an automatic SKIP. Recommend suspending the 09:45/12:30/15:55 ET routines too — they will find nothing to do and spend tokens confirming that.

## Opening Range (filled at 09:45 ET by `opening-range.md`)

- ORH:
- ORL:
- OR width:
- 5-min avg volume during OR:

## Live trade state

- Position: NONE
- Entry:
- Stop:
- Target:
- Pattern:
