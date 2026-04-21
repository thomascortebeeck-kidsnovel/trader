# General Bot — Reasoning

Append-only. Every routine writes a dated block (Saw / Did / Why / Watch).

## 2026-04-21 pre-market general

**Saw:** Fresh memory — trade-log, reasoning, research-log, weekly-review, and
memory/strategy.md are all empty scaffolds. No prior positions journaled. Both
Alpaca (`paper-api.alpaca.markets`) and Finnhub (`finnhub.io`) returned HTTP 403
"Host not in allowlist" from the sandbox, so `alpaca account`, `alpaca
positions`, `alpaca news`, and `finnhub economic` all failed. No market data,
news catalysts, or economic-calendar events could be pulled.

**Did:** No action — research pass blocked by network allowlist. No orders
placed (routine does not place orders anyway). Logged the blocker in
`research-log.md` under today's date.

**Why:** Hard rule: default to doing nothing when unsure, and log the
indecision. Catalyst-required entry rules in `strategy.md` make it impossible
to justify any candidate without at least the cheap news pass. Fabricating
candidates from memory would violate the "catalyst required" rule and mislead
the market-open routine.

**Watch:** Operator: extend sandbox allowlist to include
`paper-api.alpaca.markets`, `data.alpaca.markets`, and `finnhub.io` (Perplexity
and ClickUp hosts too if those routines are expected to run). Once unblocked,
rerun pre-market so market-open has a real BUY_CANDIDATES list. First action
next routine: retry `alpaca account` + `alpaca positions` to confirm network
is open before proceeding.

