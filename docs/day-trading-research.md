# Day-Trading Research Notes — Sources for Bot 2

This file documents *why* the day-trader bot's strategy is what it is. It points to the books and research the rules are distilled from. Read this before changing `bots/day-trader-kraken/strategy.md`.

## Key sources

### Andrew Aziz — *How to Day Trade for a Living* (2016) and *Advanced Techniques in Day Trading* (2018)

Practitioner playbook. The pattern catalog (ABCD, bull/bear flag, VWAP reclaim, ORB, parabolic reversal) and the **1% risk per trade** convention come from here. Aziz is also the source of:
- Trade only the **first 2 hours** + **last hour**; lunch lull is a no-trade zone.
- Daily stop-loss in dollars, not in trades.
- Stop hunting / morning trap awareness — wait for the 09:45 ET 5-min close, don't enter on the 09:31 first-bar wick.

### Mark Douglas — *Trading in the Zone* (2000) and *The Disciplined Trader* (1990)

Psychology. The bot's structural rules — pre-defined exit before entry, no discretionary stop widening, mandatory cooldown after a loss — come from Douglas. He frames trading as a probabilities game: **any single trade can be a loser; the edge plays out over a sample size**. The bot's per-trade R/R minimum and per-day trade cap exist to keep us trading the sample, not the trade.

### Toby Crabel — *Day Trading with Short-Term Price Patterns and Opening Range Breakout* (1990)

Original ORB literature. Crabel quantifies that breakouts of the opening range on volume have a positive expectancy when filtered for trend regime (ADX). We use the **15-minute** OR window (vs his 30-min) because KRKNF's volume profile fades after 10:00 ET; a tighter window catches the narrow morning liquidity window.

### Edwin Lefèvre — *Reminiscences of a Stock Operator* (1923)

Source of two enduring rules baked into the strategy:
- "Be right, *and* sit tight." We let winners run via the ATR-trail.
- "There is nothing new under the sun on Wall Street." Pattern repetition is the source of the edge — hence the weekly pattern-research refresh.

### Crabel + Connors — short-term trading studies on opening range and gap behavior

Confirms the **gap-fill** statistical edge: gaps > 2% on no-news days fill within the first 2 hours about 55% of the time. We use this as a *filter* (no-catalyst gaps → fade-back is more likely than continuation) rather than as a standalone trade.

## Position sizing math

From Aziz's framework:

```
risk_dollars   = equity × 0.01                 # 1% of equity at risk
stop_distance  = 1.5 × ATR(5m)                 # ATR-derived stop
shares         = floor(risk_dollars / stop_distance)
position_value = shares × current_price
position_pct   = position_value / equity       # capped at 5% by strategy.md
```

This is what `skills/trade/SKILL.md` implements for the day-trader bot.

## Why "no overnights"

- KRKNF is a US OTC listing of a Canadian small-cap. Liquidity isn't there to exit fast on overnight news.
- The bot's edge is intraday pattern recognition; holding into close adds gap risk that the strategy isn't measuring.
- Force-flatten by 15:55 ET is non-negotiable.

## Why a single name

Day trading rewards depth: knowing one name's typical range, opening behaviour, news cadence, and float dynamics is more valuable than spreading attention across many. The pattern-research file is essentially a tape-reading dossier on KRKNF that compounds value with every weekly refresh.

If we add a second day-trader bot later (say, for SPY itself), it gets its own folder under `bots/`, its own strategy.md, its own pattern-research.md. Don't multiplex.

## Where to push next

- **Order-book microstructure** (Larry Harris, *Trading & Exchanges*) — would let us improve fill quality on KRKNF's wide spread.
- **Volatility-cluster filtering** (Engle's GARCH) — could let the bot programmatically detect when ATR has spiked and shift to half-size automatically. Right now this lives in `pattern-research.md` as a manual classification.
- **Realized-vol-vs-implied** — for names with options chains. Not applicable to KRKNF.

## Required reading order

If a new operator joins:
1. Aziz, *How to Day Trade for a Living* — first half.
2. Douglas, *Trading in the Zone* — chapters on probabilistic thinking and the trader's mindset.
3. This bot's `strategy.md` and `pattern-research.md`.
4. The last 4 weekly-review entries in `memory/weekly-review.md`.
