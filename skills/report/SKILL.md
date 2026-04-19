# Skill: report

**Purpose.** Compile an end-of-day (or end-of-week) summary and send it to ClickUp.

## EOD format (≤ 600 chars, the operator skims this on a phone)

```
[BOT] EOD YYYY-MM-DD
Equity: $X (today: ±Y%)
Bench (SPY): ±Z% — bot vs bench: ±D%
Trades today: N (W winners, L losers, B&E e)
Best: SYM +X%   Worst: SYM −Y%
Notes: one short sentence on regime / what to watch tomorrow.
```

## Weekly format (≤ 1500 chars)

```
[BOT] WEEKLY YYYY-MM-DD
Week return: ±X%   vs SPY: ±Y%
Trades: N (win-rate W%, avg R: aR, expectancy: e)
Best trade: SYM +X% (thesis worked because …)
Worst trade: SYM −Y% (thesis broke because …)
Pattern grade: A/B/C/D/F — one line of reasoning
Strategy edits: bullet list of changes pushed to strategy.md this week (or "none")
```

## Steps

1. Read `memory/trade-log.md`, `memory/benchmark.md`, `memory/reasoning.md` (today's entries only).
2. Compute the numbers locally — do not eyeball.
3. Format using the template above.
4. `scripts/notify.py "<formatted message>"`.
5. Append the same message to `memory/reasoning.md` so the next session sees what was reported.
