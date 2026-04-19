# Skill: risk-check

**Purpose.** A pre-trade gatekeeper. Every proposed order is run past these checks; any failure aborts the trade.

## Inputs

- Proposed order: `{symbol, side, qty, order_type, limit_price?}`
- Bot identifier so the right `strategy.md` is loaded.

## Checks

1. **Mode check.** If `LIVE_MODE != true`, the order must target the paper endpoint. Otherwise abort.
2. **Sizing check.** `qty × price` must be ≤ the bot's max position size (% of equity).
3. **Daily-loss check.** Today's realized + unrealized P/L must be > the bot's daily loss cap.
4. **Position-count check.** Open positions must be < the bot's max concurrent positions.
5. **Earnings check.** If the symbol has earnings within 24 hrs and the strategy disallows it, abort.
6. **Liquidity check.** Symbol's 30-day avg dollar-volume must be > the strategy's floor (default $5M; KRKNF override in its strategy.md).
7. **Day-trade pattern check (PDT).** If the account is < $25K equity and this trade would create a 4th day-trade in 5 days, abort with a clear log.
8. **Cooldown check (day-trader only).** If the last trade was a loss and < 30 min ago, abort.

## Output

`{ok: true}` or `{ok: false, reason: "..."}`.

## Why this exists

The agent is eager. Without an explicit gate, it talks itself into trades. This skill is the gate. It is dumb on purpose — boolean checks against numeric thresholds, no judgement.
