# Day-Trader Bot — Intraday Pattern Cache

Overwritten by pre-market routine. Read by the trading routines.

## Today's setup

- Date: 2026-04-22
- Pre-market gap: N/A (no bar data — OTC feed forbidden for this subscription; KRKNF on Alpaca is `status=inactive, tradable=false`)
- Catalyst: NONE in the past 24h. Alpaca news latest KRKNF item = 2026-03-04 (stale). Finnhub company-news 2026-04-15→22: 0 items. No KRKN* in the 2026-04-22 → 2026-04-24 earnings calendar (368 entries scanned).
- Liquidity check: FAIL — cannot measure. OTC feed returns `subscription does not permit querying OTC data`; IEX/SIP feeds return `bars: null` for KRKNF.
- Today's plan: **SKIP**
- Levels:
  - Prior-day high: unavailable (no data)
  - Prior-day low: unavailable (no data)
  - Pre-market high: unavailable (no data)
  - Pre-market low: unavailable (no data)
  - 50-day SMA: unavailable (no data)

### Why SKIP (operator: please read — this is day 2 of the same blockers)

Two independent blockers persist, both beyond the bot's control:

1. **Symbol not routable on Alpaca paper.** `GET /v2/assets/KRKNF` still returns `status: inactive, tradable: false, shortable: false`. Any order the trading routine places will be rejected by the broker.
2. **No bar data.** KRKNF is OTC. Alpaca's `otc` data feed returns `subscription does not permit querying OTC data`; `iex` and `sip` feeds both return `bars: null`. Without bars we cannot compute ATR, OR, VWAP, or the liquidity gate — every allowed setup in `strategy.md` depends on these.

These are the identical blockers reported in yesterday's (2026-04-21) pre-market journal. No state change on either the routing or the data-subscription front.

Until the operator either (a) upgrades Alpaca to a plan that includes OTC data **and** routes KRKNF as tradable, or (b) wires the TSX listing `KRKN` through a Canadian broker, this bot should treat every pre-market as an automatic SKIP. Strongly recommend suspending the 09:45 / 12:30 / 15:55 ET routines for this bot until one of those is resolved — they will find nothing to do and burn tokens confirming it.

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
