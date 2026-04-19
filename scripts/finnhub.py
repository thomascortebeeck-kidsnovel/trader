#!/usr/bin/env python3
"""Finnhub wrapper for news + economic calendar.

CLI:
    python scripts/finnhub.py general 30
    python scripts/finnhub.py company AAPL 2026-04-01 2026-04-19
    python scripts/finnhub.py earnings 2026-04-19 2026-04-26
"""
from __future__ import annotations

import json
import os
import sys
import urllib.parse
import urllib.request

BASE = "https://finnhub.io/api/v1"


def _key() -> str:
    k = os.environ.get("FINNHUB_API_KEY", "")
    if not k:
        sys.exit("missing env var: FINNHUB_API_KEY")
    return k


def _get(path: str, params: dict) -> object:
    params = {**params, "token": _key()}
    qs = urllib.parse.urlencode(params)
    url = f"{BASE}{path}?{qs}"
    with urllib.request.urlopen(url, timeout=30) as resp:
        return json.loads(resp.read().decode())


def general_news(category: str = "general", limit: int = 30) -> list[dict]:
    """category: general | forex | crypto | merger"""
    items = _get("/news", {"category": category}) or []
    return items[:limit] if isinstance(items, list) else []


def company_news(symbol: str, frm: str, to: str) -> list[dict]:
    """frm/to as YYYY-MM-DD."""
    items = _get("/company-news", {"symbol": symbol, "from": frm, "to": to}) or []
    return items if isinstance(items, list) else []


def earnings_calendar(frm: str, to: str) -> dict:
    return _get("/calendar/earnings", {"from": frm, "to": to})


def economic_calendar() -> dict:
    return _get("/calendar/economic", {})


def _print(obj: object) -> None:
    print(json.dumps(obj, indent=2, default=str))


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    cmd, *rest = args
    if cmd == "general":
        cat = rest[0] if rest else "general"
        lim = int(rest[1]) if len(rest) > 1 else 30
        _print(general_news(cat, lim))
    elif cmd == "company":
        sym, frm, to = rest
        _print(company_news(sym, frm, to))
    elif cmd == "earnings":
        frm, to = rest
        _print(earnings_calendar(frm, to))
    elif cmd == "economic":
        _print(economic_calendar())
    else:
        sys.exit(f"unknown command: {cmd}")
