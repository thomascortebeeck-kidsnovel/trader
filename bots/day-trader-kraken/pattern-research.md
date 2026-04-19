# KRKNF — Pattern Research

> **Initial analysis: April 2026**, compiled from public data. Refreshed weekly by `routines/weekly-review.md` which replaces these numbers with measured values from Alpaca bars.

## Headline reading (April 2026)

**This is a bigger, more liquid stock than most "Canadian small-cap" priors would suggest.** The day trader's priors should reflect that:

- Price: ~$6.48 (April 17, 2026)
- 52-week range: **$1.57 → $8.13** on KRKNF (US OTC); $2.15 → $10.72 CAD on the TSX
- Market cap: **~$1.97B USD** — this is a mid-cap, not a micro-cap
- Avg daily volume: **~1.0–1.2M shares** on KRKNF (OTCQB); real dollar-volume ~$6–8M/day
- Weekly volatility: ~11% (higher than 75% of US stocks — *this is our edge and our risk*)
- YTD 2026 return: **+37.8%**, outperforming TSX Composite (+7.8%) and S&P 500 materially
- Listing note: KRKNF on US OTCQB, PNG.V historically on TSX Venture; company has since graduated to TSX (KRKN). Alpaca paper supports KRKNF.

**Takeaway for the bot:** liquidity is adequate for our sizing. The liquidity gate in `strategy.md` (5k shares/5-min) is conservative vs. actual ~6k–10k/5-min typical. Do **not** skip routinely — skip only on abnormal thin days.

## Volatility regime (seed numbers — weekly-review will measure exactly)

Derived from 11% weekly vol + observed range:

| Metric                              | Current estimate       |
|-------------------------------------|------------------------|
| ATR(14) daily (USD)                 | ~$0.20 – $0.28         |
| ATR(14) 5-min (USD)                 | ~$0.04 – $0.07         |
| Median 15-min Opening Range width   | ~$0.10 – $0.18         |
| % of days with > 2% intraday range  | ~70%+ (highly active)  |
| % of days gapping > 2% on open      | ~15–20% (catalyst-driven) |
| Gap-fill rate when gap > 2%         | ~50% within 2 hrs      |
| ADX(14) typical                     | Declining into April — **momentum compression**, regime drifting from trending toward range-bound |
| Beta to Russell 2000                | elevated; moves hard on defence headlines |

Sizing implication: on $100k equity with 1% risk and stop = 1.5 × ATR_5m (~$0.075), share count ≈ `floor(1000 / 0.075)` = ~13,300 shares at ~$6.50 = **~$86k notional**. That's ~86% of equity — **which exceeds the 5% max-position cap**. The cap **always wins**: actual qty = floor(5% × equity / price) ≈ **770 shares**. This is the correct behavior; the ATR formula sets stop distance, the position cap sets size.

## Intraday volume profile

KRKNF's US OTC volume concentrates in the regular session. High-volume windows:

- **09:30–10:30 ET** — opening drive, biggest liquidity of the day
- **10:30–12:00 ET** — trails off but still tradeable
- **12:00–13:00 ET** — thin; strategy already bans entries here
- **13:00–14:30 ET** — light pickup
- **14:30–16:00 ET** — closing drive; second-highest liquidity window

Matches the strategy's "first 2 hours + last hour" rule from Aziz. No change needed.

## Recent catalysts (past ~6 months, in reverse chronological order)

These are the kinds of headlines that have moved KRKNF historically. The news-based bot's `watchlist.md` should reference these categories; the day trader's pre-market routine uses them for go / half-size / skip classification.

| Date            | Catalyst                                                         | Direction | Magnitude |
|-----------------|------------------------------------------------------------------|-----------|-----------|
| 2026-04-16      | $28M SeaPower battery + Kraken SAS orders announced              | LONG      | small–medium |
| 2026-04-16      | 2025 annual results posted — revenue record, Q4 earnings miss   | MIXED     | medium (volatility day) |
| 2026-03         | **$615M Covelya Group acquisition** announced — UK subsea co     | LONG / DILUTIVE | large (share issuance component = $135M of $615M) |
| 2026 (ongoing)  | US Navy SAS contract for unmanned mine-countermeasure vehicles   | LONG      | large |
| 2025-12-02      | $12M SAS + battery orders                                        | LONG      | small |
| 2025-Q1         | $34M SeaPower Battery orders (Feb 2025)                          | LONG      | medium |
| 2025 full-year  | Revenue $102.2M (vs $91.3M in 2024), EBITDA $25.0M               | LONG (structural) | n/a |

## Pattern observations from the 2026 tape

From the Elliott-wave and technical-setup commentary in public analyst work + observed chart action:

1. **Completed 5-wave impulse into the $8.13 high** (Feb–Mar 2026 blow-off on the Covelya announcement). Since then we've been in a corrective `ABC`.
2. **Wave (A) landed ~$4.70–4.75** (near 0.618 retracement of the impulse, coincides with 100-day MA and a prior demand zone — strong technical confluence).
3. **Wave (B) in progress** bouncing back toward the $6.40–6.80 area (current).
4. **Wave (C) target $4.00–4.20** if the correction completes symmetrically.
5. **ADX compressing** → chop regime through late April–early May is the base case. Favors **VWAP reclaim** and **range-fade** setups over ORB continuation. ORB **breakouts fail more often in chop regimes** per Crabel's literature; ORB **fades** (fading the initial break back into the OR) have positive expectancy in this regime.

**Regime classification (April 2026):** range-bound / chop. Revisit weekly.

## Pattern playbook tuned to current regime

Per the strategy's four allowed setups (ORB, VWAP reclaim, bull/bear flag, ABCD), the regime suggests this prioritization for the coming weeks:

1. **VWAP reclaim** — favored in chop. Price drifts off VWAP then reclaims → mean-reversion with a 2R target to prior-day H/L.
2. **Range fade** (use the ABCD framework inversely) — fade failed breaks of prior-day high/low when no catalyst is present.
3. **ORB** — **reduce size** on ORB breakouts unless there's a named catalyst (orders announcement, contract win). In a no-catalyst day, the ORB break tends to fail back into range.
4. **Bull/bear flag** — still valid after catalyst days (the 04-16 orders announcement is a recent example); low probability on no-news days.

## News-day behavior

- **Contract-award days** (orders announcements): open is usually elevated; initial 5-min candle's high tends to hold as resistance unless reclaimed within 30 min. Best trade is **pull-back to VWAP** long, not chase.
- **Acquisition-announcement days** (Covelya type): large moves, multi-day follow-through. Day trader should size normally on day 1 but watch for dilution-driven fade on day 2–3.
- **Earnings days**: Q4 2025 was a miss with revenue shortfall. Stock decreased 0.59% on the day. Modest move. Half-size; wait 30 min post-print per strategy.

## What the weekly-review must overwrite

Each Friday, `routines/weekly-review.md` runs and must recompute from Alpaca bars (overwriting the sections above, preserving this "What to overwrite" list):

1. ATR(14) daily and 5-min (exact, not estimate).
2. Median + 75th-percentile OR(15) width.
3. Gap stats: % days gapping > 1%, > 2%, > 3%; gap-fill rate within 2 hours.
4. Volume-by-30-min-bucket sparkline (actual shares/bucket, trailing 20 sessions).
5. ADX(14) median over trailing 30 / 90 days; % of days ADX > 25 (trending) vs < 20 (chop).
6. Correlations with `XLI` (industrials), `XLE` (energy), `ITA` (aero-defence) over 5d and 20d.
7. Per-pattern expectancy from our own `trade-log.md` (ORB / VWAP-reclaim / flag / ABCD).
8. New catalyst events from the trailing week appended to the catalyst table above.
9. Updated regime classification (trending / range / chop) and the recommended pattern prioritization.

## Don't

- Don't treat the seed numbers above as measured. Confirm via Alpaca bars in week 1.
- Don't assume OTC liquidity is thin. It isn't for KRKNF. Liquidity gate should gate only abnormal days, not normal ones.
- Don't trade the ORB in chop regime unless a catalyst is confirmed. Historical win-rate collapses.
- Don't ignore the Covelya acquisition's dilution timing (Q2 2026 close). There's a share-issuance event in the window — expect overhang days.

## Sources (April 2026 research pass)

- [Kraken Robotics 2025 Financial Results (globenewswire)](https://www.globenewswire.com/news-release/2026/04/16/3275147/0/en/Kraken-Robotics-Reports-2025-Financial-Results.html)
- [$28M SeaPower + SAS orders announcement](https://www.asdnews.com/news/defense/2026/04/16/kraken-robotics-announces-28m-seapower-battery-kraken-sas-orders)
- [$615M Covelya acquisition announcement](https://www.krakenrobotics.com/news-releases/kraken-robotics-announces-signing-of-strategic-acquisition-to-expand-global-maritime-capabilities/)
- [Investors overview](https://www.krakenrobotics.com/investors/)
- [KRKNF quote / volatility (Simply Wall St)](https://simplywall.st/stocks/us/tech/otc-krkn.f/kraken-robotics)
- [KRKNF technical (Barchart)](https://www.barchart.com/stocks/quotes/KRKNF/technical-analysis)
- [OTCQB listing overview](https://www.otcmarkets.com/stock/KRKNF/overview)
- [Q4 2025 earnings miss (Investing.com)](https://www.investing.com/news/transcripts/earnings-call-transcript-kraken-robotics-q4-2025-sees-earnings-miss-93CH-4618308)
- [US Navy SAS contract coverage](https://www.ad-hoc-news.de/boerse/news/ueberblick/kraken-robotics-stock-surges-on-major-us-navy-contract-amid-underwater/68992177)
