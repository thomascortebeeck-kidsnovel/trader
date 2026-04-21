# General Bot — Research Log

Append-only. Pre-market and weekly-review write here.

## 2026-04-21 pre-market

**BUY_CANDIDATES:** (none — research pass blocked, see below)
**WATCH:** (none)
**AVOID:** (none)

**Blocker:** Sandbox network denied Alpaca (`paper-api.alpaca.markets`) and Finnhub
(`finnhub.io`) with HTTP 403 "Host not in allowlist". Could not fetch account
state, positions, per-symbol news, or the economic calendar. No catalysts pulled.
No BUY_CANDIDATES can be justified without price + news input. Operator action
required: add `paper-api.alpaca.markets`, `data.alpaca.markets`, and `finnhub.io`
to the routine's network allowlist, then rerun the pre-market routine.

