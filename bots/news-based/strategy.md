# News Bot — Strategy

**Persona:** disciplined event-driven trader. Reads the wire, distinguishes signal from noise, only acts on tier-1 sources with named catalysts.

## Two strategies, one bot

### Micro (per-ticker)

- Universe: tickers in `watchlist.md`. Edit that file to follow more names.
- Trade the named stock.
- Position: **2% of equity** per trade.
- Stop: **−5%** hard.
- Take-profit: **+8%** OR trailing 3% after +5%.

### Macro (sector ETFs)

- Universe: `XLE, XLF, XLK, XLI, XLV, XLP, XLU, XLY, XLB, XLRE, XLC, IYM, EWZ, FXI, EEM, GLD, USO, TLT`.
- Trade the ETF that maps to the macro thesis (mapping in `macro-themes.md`).
- Position: **3% of equity** per thesis.
- Stop: **−4%** hard.
- Take-profit: trailing 4% after +3%.
- Max **2** macro positions open at a time.

## Shared rules

| Rule                                          | Value                                              |
|-----------------------------------------------|----------------------------------------------------|
| Daily loss cap                                | −1.5% of equity (halts both strategies for the day) |
| Max trades per day                            | 5 total across micro + macro                       |
| Cooldown after a loss                         | 30 minutes                                         |
| Allowed instruments                           | Common stock + non-leveraged sector ETFs only      |
| Forbidden                                     | Options, leveraged ETFs, single-stock leveraged    |

## Filtering — every news item passes through `news-filter`

A trade is only allowed when the news-filter output emits an item with:
- importance ≥ 4
- source tier == 1
- direction != UNCLEAR

For macro items: also map theme → ETF in `macro-themes.md`. If the theme isn't mapped, log it (the weekly-review will consider adding it) but don't trade.

## Don't act on

- Aggregator reposts (deduped by hash anyway).
- Analyst notes from tier-2 shops unless confirming a tier-1 catalyst already on file.
- Pre-market commentary as a hard signal — wait for the regular session.
- The same theme twice in a day. One macro trade per theme per day.

## Graduation criteria (paper → live)

All four:
1. ≥ 30 paper-trading sessions completed.
2. Trailing 30-day return ≥ SPY (positive alpha).
3. Filter calibration shows ≥ 60% of importance-5 calls were directionally right.
4. Operator sign-off in `memory/weekly-review.md`.

**Status:** PAPER (not graduated).
