# KRKNF — Pattern Research

> **Refreshed weekly** by `routines/weekly-review.md`.
> Hand-bootstrapped seed below from public 90-day characteristics for Kraken Robotics (KRKN.TO / KRKNF). Numbers are starting estimates — the weekly-review will overwrite them with measured values from Alpaca bars.

## Instrument profile (seed)

- Sector: defence + offshore-energy robotics, listed in Canada.
- Float: small/mid cap. Daily $-volume on KRKNF (US OTC) is typically much smaller than the TSX listing.
- Earnings: quarterly; Canadian fiscal calendar (consult company IR site each pre-market).
- Catalysts that historically move the stock:
  - **Defence contract awards** (Royal Canadian Navy, NATO programs, US DoD subcontracts).
  - **Offshore-energy capex announcements** (correlated with Brent crude, BP / Equinor capex commentary).
  - **Subsea inspection contracts** with operators.
  - **Quarterly results** (revenue trajectory, backlog disclosure).
  - **Capital raises** (typically negative short-term reaction).

## Volatility regime (placeholder until first weekly run)

| Metric                              | Value (placeholder) |
|-------------------------------------|---------------------|
| ATR(14) daily                       | 0.04–0.08 USD       |
| ATR(14) on 5-min bars               | 0.01–0.02 USD       |
| Median 15-min Opening Range width   | 0.02–0.04 USD       |
| % of days that gap > 2%             | ~10%                |
| Gap-fill rate when gap > 2%         | ~55%                |
| ADX(14) typical                     | 18–24 (mostly range-bound) |

## Intraday volume profile (placeholder)

US OTC volume on KRKNF concentrates in the first 30 min of the session and the last 30 min. Midday is sparse. The bot should expect to find acceptable liquidity 09:30–10:30 ET and 15:00–15:55 ET, with a thinner middle.

## Recurring pattern observations (placeholder — to be measured)

- **Gap-and-go**: when KRKNF gaps > 3% on news, the first 5-min candle's high often holds as resistance unless reclaimed within 30 min.
- **Bull flag off opening drive**: on contract-award days the stock tends to consolidate 10–15 min after the opening drive, then continue. ORB on those days has historically had high follow-through.
- **VWAP magnet on no-news days**: on days without a catalyst, price tends to revert to VWAP within the morning. ORB breaks fail more often. The pre-market routine flags "no catalyst → reduce size or skip".

## What the weekly-review must measure

When `routines/weekly-review.md` runs, it must overwrite the sections above using the trailing 90 days of 5-min and daily bars from Alpaca:

1. ATR(14) on 5-min and daily.
2. Median + 75th percentile OR(15) width.
3. Gap statistics: % > 1%, > 2%, > 3%; gap-fill rates within 2 hours.
4. Volume by 30-min bucket — produce a sparkline.
5. ADX(14) median, % of days ADX > 25 (trending), % < 20 (chop).
6. Correlation with `XLE` (energy) and `XLI` (industrials) on 5-day windows.
7. Per-pattern expectancy from our own trade log: count, win rate, avg R for ORB / VWAP-reclaim / bull-flag / bear-flag / ABCD.

The weekly-review must also write a 1-paragraph **regime classification** (trending / range-bound / chop) that the next week's pre-market routine will read.

## Don't

- Don't trust this file's placeholder numbers for sizing. The first weekly-review run is the first time these become real. Until then, the pre-market routine should default to **half-size** trades.
