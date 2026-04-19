# Skill: news-filter

**Purpose.** Reduce a raw news firehose to the small set of items worth acting on.

## Inputs

- A list of news items (each with `id`, `headline`, `summary`, `source`, `url`, `symbols`, `created_at`).
- `seen-headlines.md` — file of URL hashes we've already processed.

## Pipeline

### 1. Dedupe

Hash `url` (or `headline + source` if URL missing). Drop any hash already in `seen-headlines.md`. Append new hashes once processed.

### 2. Score importance 1–5

| Score | What earns it                                                                          |
|-------|----------------------------------------------------------------------------------------|
| 5     | Earnings result, M&A announcement, FOMC decision, major regulatory ruling              |
| 4     | Top-tier analyst action (Goldman/Morgan Stanley/JPM upgrade-downgrade), large contract |
| 3     | Sector trend piece with attribution to specific catalyst                               |
| 2     | Corporate housekeeping (dividend declaration, share buyback announcement)              |
| 1     | Repost / aggregator / opinion piece without new info                                   |

### 3. Tag direction

- `LONG` (likely positive price impact)
- `SHORT` (likely negative)
- `UNCLEAR` (skip)

### 4. Source tier

- **Tier 1:** Reuters, Bloomberg, WSJ, FT, AP, company filings (8-K), Federal Reserve, BLS, BEA.
- **Tier 2:** CNBC, Barron's, Seeking Alpha analyst pieces, Benzinga.
- **Tier 3:** everything else.

### 5. Keep only

`importance ≥ 4` AND `direction != UNCLEAR` AND `source_tier == 1`.

### 6. Group by ticker / theme

Output a list of:

```
[symbol or theme] [LONG|SHORT] importance=N
- headline
- one-sentence rationale connecting headline to expected price impact
- url
```

## Why this exists

Without filtering, the bot trades on everything and bleeds commissions + slippage. The 4-of-tier-1 cutoff mirrors what discretionary traders actually act on.
