#!/usr/bin/env python3
"""Pre-trade guardrail enforcer. Dumb, numeric, deterministic.

The agent in a routine can rationalize its way around a prose rule.
This script returns a hard yes/no and can be shelled out from the trade skill.

Usage (from a routine):
    python scripts/risk_check.py \
        --bot general \
        --symbol AAPL --side buy --qty 25 --price 192.50 \
        --max-position-pct 0.05 \
        --daily-loss-cap -0.02 \
        --max-open-positions 12

Exit codes:
    0 = trade is allowed
    1 = trade blocked (reason printed to stdout)
    2 = internal error / misuse
"""
from __future__ import annotations

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import alpaca  # type: ignore  # noqa: E402


def _f(x: str) -> float:
    return float(x)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--bot", required=True, choices=["general", "day-trader-kraken", "news-based"])
    p.add_argument("--symbol", required=True)
    p.add_argument("--side", required=True, choices=["buy", "sell"])
    p.add_argument("--qty", required=True, type=_f)
    p.add_argument("--price", required=True, type=_f)
    p.add_argument("--max-position-pct", required=True, type=_f,
                   help="e.g. 0.05 for 5%% of equity")
    p.add_argument("--daily-loss-cap", required=True, type=_f,
                   help="negative, e.g. -0.02 for -2%% cap")
    p.add_argument("--max-open-positions", required=True, type=int)
    p.add_argument("--min-adv-dollars", type=_f, default=0.0,
                   help="min 30-day avg dollar volume; 0 to skip")
    args = p.parse_args()

    # 1. mode check
    base = os.environ.get("ALPACA_BASE_URL", "").rstrip("/")
    live = os.environ.get("LIVE_MODE", "").lower() == "true"
    if base == "https://api.alpaca.markets" and not live:
        print(json.dumps({"ok": False, "reason": "live host requested but LIVE_MODE!=true"}))
        return 1

    # 2. sizing check
    acct = alpaca.account()
    equity = float(acct.get("equity", 0))
    if equity <= 0:
        print(json.dumps({"ok": False, "reason": "alpaca returned non-positive equity"}))
        return 1
    position_value = args.qty * args.price
    max_position = equity * args.max_position_pct
    if position_value > max_position:
        print(json.dumps({
            "ok": False,
            "reason": f"position ${position_value:.2f} exceeds max ${max_position:.2f} "
                      f"({args.max_position_pct*100:.1f}% of ${equity:.2f})",
        }))
        return 1

    # 3. daily loss cap
    last_equity = float(acct.get("last_equity", equity))
    day_pl_pct = (equity - last_equity) / last_equity if last_equity else 0.0
    if day_pl_pct <= args.daily_loss_cap:
        print(json.dumps({
            "ok": False,
            "reason": f"daily P/L {day_pl_pct*100:+.2f}% already at/below cap "
                      f"{args.daily_loss_cap*100:+.2f}%",
        }))
        return 1

    # 4. open-positions count
    positions = alpaca.positions()
    existing_symbols = {p["symbol"] for p in positions}
    # If this is a new symbol, the count goes up by 1; if resizing, it doesn't.
    projected_count = len(existing_symbols) + (0 if args.symbol in existing_symbols else 1)
    if projected_count > args.max_open_positions:
        print(json.dumps({
            "ok": False,
            "reason": f"would be {projected_count} open positions, max {args.max_open_positions}",
        }))
        return 1

    # 5. trading_blocked flag
    if acct.get("trading_blocked"):
        print(json.dumps({"ok": False, "reason": "alpaca trading_blocked=true"}))
        return 1

    # 6. optional liquidity floor
    if args.min_adv_dollars > 0:
        try:
            snap = alpaca.snapshot([args.symbol])
            last_price = float(snap.get(args.symbol, {}).get("latestTrade", {}).get("p", args.price))
            # rough ADV from daily bars
            bars = alpaca.bars(args.symbol, "1Day", 30)
            rows = bars.get("bars", []) if isinstance(bars, dict) else []
            if rows:
                avg_vol = sum(b.get("v", 0) for b in rows) / len(rows)
                avg_dv = avg_vol * last_price
                if avg_dv < args.min_adv_dollars:
                    print(json.dumps({
                        "ok": False,
                        "reason": f"30d avg $-vol ${avg_dv:,.0f} below floor ${args.min_adv_dollars:,.0f}",
                    }))
                    return 1
        except Exception as e:
            print(json.dumps({"ok": False, "reason": f"liquidity check failed: {e}"}))
            return 1

    print(json.dumps({
        "ok": True,
        "equity": equity,
        "day_pl_pct": day_pl_pct,
        "position_pct": position_value / equity,
        "open_positions": len(existing_symbols),
    }))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(json.dumps({"ok": False, "reason": f"internal error: {e}"}))
        sys.exit(2)
