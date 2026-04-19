#!/usr/bin/env python3
"""Connectivity smoke test. Run once per routine environment after setting env vars.

Checks every external API the routines depend on. Fails loud on any missing key
or unreachable endpoint. Exits 0 only if all sections print OK.

Usage:
    python scripts/bootstrap.py
"""
from __future__ import annotations

import os
import sys
import traceback

REQUIRED_VARS = [
    "ALPACA_API_KEY",
    "ALPACA_SECRET_KEY",
    "ALPACA_BASE_URL",
    "PERPLEXITY_API_KEY",
    "FINNHUB_API_KEY",
    "CLICKUP_API_KEY",
    "CLICKUP_TASK_ID",
]


def check_env() -> list[str]:
    missing = [v for v in REQUIRED_VARS if not os.environ.get(v)]
    if missing:
        return missing
    base = os.environ["ALPACA_BASE_URL"].rstrip("/")
    if base == "https://api.alpaca.markets" and os.environ.get("LIVE_MODE", "").lower() != "true":
        return ["ALPACA_BASE_URL=live but LIVE_MODE!=true"]
    return []


def _ok(section: str, detail: str = "") -> None:
    print(f"[OK]    {section:14s} {detail}")


def _fail(section: str, err: Exception | str) -> None:
    print(f"[FAIL]  {section:14s} {err}")


def main() -> int:
    failures = 0

    print("=" * 60)
    print(f"bootstrap: ALPACA_BASE_URL={os.environ.get('ALPACA_BASE_URL', '?')}")
    print("=" * 60)

    missing = check_env()
    if missing:
        print(f"[FAIL]  env            missing: {missing}")
        return 1
    _ok("env", f"{len(REQUIRED_VARS)} vars present")

    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

    try:
        import alpaca  # type: ignore
        acct = alpaca.account()
        _ok("alpaca-acct", f"equity=${acct.get('equity')} status={acct.get('status')}")
    except Exception as e:
        _fail("alpaca-acct", e)
        failures += 1

    try:
        import alpaca  # type: ignore
        bars = alpaca.bars("SPY", "5Min", 5)
        n = len(bars.get("bars", []) if isinstance(bars, dict) else [])
        _ok("alpaca-data", f"SPY 5Min bars={n}")
    except Exception as e:
        _fail("alpaca-data", e)
        failures += 1

    try:
        import alpaca  # type: ignore
        news = alpaca.news(["SPY"], 5)
        items = news.get("news", []) if isinstance(news, dict) else []
        _ok("alpaca-news", f"SPY items={len(items)}")
    except Exception as e:
        _fail("alpaca-news", e)
        failures += 1

    try:
        import finnhub  # type: ignore
        items = finnhub.general_news("general", 5)
        _ok("finnhub", f"general news items={len(items)}")
    except Exception as e:
        _fail("finnhub", e)
        failures += 1

    try:
        import perplexity  # type: ignore
        ans = perplexity.ask("Reply with the single word OK and nothing else.")
        _ok("perplexity", f"resp starts {ans[:40]!r}")
    except Exception as e:
        _fail("perplexity", e)
        failures += 1

    try:
        import clickup  # type: ignore
        msg = "[BOOTSTRAP] Environment OK at " + str(os.environ.get("ALPACA_BASE_URL"))
        clickup.post_comment(msg)
        _ok("clickup", "comment posted")
    except Exception as e:
        _fail("clickup", e)
        failures += 1

    print("=" * 60)
    if failures:
        print(f"bootstrap: {failures} check(s) failed")
        return 1
    print("bootstrap: all green")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception:
        traceback.print_exc()
        sys.exit(2)
