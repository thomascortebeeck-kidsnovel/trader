# Skill: research

**Purpose.** Take a question or watchlist and return market signals + an actionable watchlist for the calling routine.

## When to invoke

- Pre-market routines that need today's catalysts.
- Weekly review when re-validating the strategy.
- Day trader's pattern-research refresh.

## Inputs

- A question (string) OR a list of tickers.
- Optional: max-cost hint (`cheap` → use Alpaca News only; `deep` → use Perplexity).

## Steps

1. **Cheap pass first.** Pull `scripts/alpaca.py news <symbols> 30`. Skim for catalysts that meet importance ≥ 4 (use the rubric in `skills/news-filter/SKILL.md`).
2. **Deep pass only if cheap pass is ambiguous.** Call `scripts/perplexity.py "<question>"` with a tightly scoped question — never "what should I trade today." Always specify the ticker, the timeframe, and the decision you're making.
3. Synthesize into 3 buckets:
   - `BUY_CANDIDATES`: ticker + thesis ≤ 25 words + suggested entry zone
   - `WATCH`: ticker + reason to watch but no entry yet
   - `AVOID`: ticker + reason to skip today
4. Append the synthesis to `memory/research-log.md` with today's date.

## Output contract

Return a markdown block of the three buckets to the calling routine. Routine decides what to do with it.

## Don't

- Don't call Perplexity in a loop. One Q per routine, max two.
- Don't trust Perplexity's price targets verbatim — they hallucinate. Use them as direction, not as orders.
- Don't ingest pre-market commentary as hard catalysts. Wait for the 9:30 ET open print before sizing in.
