#!/usr/bin/env python3
"""Thin Alpaca wrapper. Reads keys from env vars only.

CLI:
    python scripts/alpaca.py account
    python scripts/alpaca.py positions
    python scripts/alpaca.py bars AAPL 5Min 100
    python scripts/alpaca.py news AAPL,MSFT 20
    python scripts/alpaca.py order BUY AAPL 10 market
    python scripts/alpaca.py order BUY AAPL 10 limit 195.50
    python scripts/alpaca.py cancel <order_id>

All endpoints respect ALPACA_BASE_URL. LIVE_MODE=true is required to point
at the live trading host.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.parse
import urllib.request
from typing import Any

PAPER_HOST = "https://paper-api.alpaca.markets"
LIVE_HOST = "https://api.alpaca.markets"
DATA_HOST = "https://data.alpaca.markets"


def _env(name: str, required: bool = True) -> str:
    val = os.environ.get(name, "")
    if required and not val:
        sys.exit(f"missing env var: {name}")
    return val


def _trading_host() -> str:
    base = os.environ.get("ALPACA_BASE_URL", PAPER_HOST).rstrip("/")
    if base == LIVE_HOST and os.environ.get("LIVE_MODE", "").lower() != "true":
        sys.exit("ALPACA_BASE_URL points at live host but LIVE_MODE != true. Refusing.")
    return base


def _data_host() -> str:
    return os.environ.get("ALPACA_DATA_URL", DATA_HOST).rstrip("/")


def _headers() -> dict[str, str]:
    return {
        "APCA-API-KEY-ID": _env("ALPACA_API_KEY"),
        "APCA-API-SECRET-KEY": _env("ALPACA_SECRET_KEY"),
        "Content-Type": "application/json",
    }


def _request(method: str, url: str, body: dict | None = None) -> Any:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=_headers())
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            payload = resp.read().decode()
            return json.loads(payload) if payload else {}
    except urllib.error.HTTPError as e:
        sys.exit(f"alpaca {method} {url} -> {e.code}: {e.read().decode()}")


# ---------- account / positions / orders ----------

def account() -> dict:
    return _request("GET", f"{_trading_host()}/v2/account")


def positions() -> list[dict]:
    return _request("GET", f"{_trading_host()}/v2/positions")


def position(symbol: str) -> dict | None:
    try:
        return _request("GET", f"{_trading_host()}/v2/positions/{symbol}")
    except SystemExit:
        return None


def orders(status: str = "open", limit: int = 50) -> list[dict]:
    qs = urllib.parse.urlencode({"status": status, "limit": limit, "direction": "desc"})
    return _request("GET", f"{_trading_host()}/v2/orders?{qs}")


def place_order(
    symbol: str,
    qty: float,
    side: str,
    order_type: str = "market",
    limit_price: float | None = None,
    stop_price: float | None = None,
    time_in_force: str = "day",
    trail_percent: float | None = None,
    extended_hours: bool = False,
) -> dict:
    body: dict = {
        "symbol": symbol,
        "qty": qty,
        "side": side.lower(),
        "type": order_type.lower(),
        "time_in_force": time_in_force,
        "extended_hours": extended_hours,
    }
    if limit_price is not None:
        body["limit_price"] = limit_price
    if stop_price is not None:
        body["stop_price"] = stop_price
    if trail_percent is not None:
        body["trail_percent"] = trail_percent
        body["type"] = "trailing_stop"
    return _request("POST", f"{_trading_host()}/v2/orders", body)


def cancel_order(order_id: str) -> dict:
    return _request("DELETE", f"{_trading_host()}/v2/orders/{order_id}")


def close_position(symbol: str) -> dict:
    return _request("DELETE", f"{_trading_host()}/v2/positions/{symbol}")


# ---------- market data ----------

def bars(symbol: str, timeframe: str = "5Min", limit: int = 100) -> dict:
    qs = urllib.parse.urlencode(
        {"timeframe": timeframe, "limit": limit, "adjustment": "raw", "feed": "iex"}
    )
    return _request("GET", f"{_data_host()}/v2/stocks/{symbol}/bars?{qs}")


def snapshot(symbols: list[str]) -> dict:
    qs = urllib.parse.urlencode({"symbols": ",".join(symbols), "feed": "iex"})
    return _request("GET", f"{_data_host()}/v2/stocks/snapshots?{qs}")


# ---------- news ----------

def news(symbols: list[str] | None = None, limit: int = 20) -> dict:
    params: dict = {"limit": limit, "sort": "desc"}
    if symbols:
        params["symbols"] = ",".join(symbols)
    qs = urllib.parse.urlencode(params)
    return _request("GET", f"{_data_host()}/v1beta1/news?{qs}")


# ---------- CLI ----------

def _print(obj: Any) -> None:
    print(json.dumps(obj, indent=2, default=str))


def _cli(argv: list[str]) -> None:
    if not argv:
        sys.exit(__doc__)
    cmd, *rest = argv
    if cmd == "account":
        _print(account())
    elif cmd == "positions":
        _print(positions())
    elif cmd == "orders":
        _print(orders(rest[0] if rest else "open"))
    elif cmd == "bars":
        sym = rest[0]
        tf = rest[1] if len(rest) > 1 else "5Min"
        lim = int(rest[2]) if len(rest) > 2 else 100
        _print(bars(sym, tf, lim))
    elif cmd == "snapshot":
        _print(snapshot(rest[0].split(",")))
    elif cmd == "news":
        syms = rest[0].split(",") if rest else None
        lim = int(rest[1]) if len(rest) > 1 else 20
        _print(news(syms, lim))
    elif cmd == "order":
        side, sym, qty, otype, *price = rest
        kwargs: dict = {}
        if otype == "limit":
            kwargs["limit_price"] = float(price[0])
        _print(place_order(sym, float(qty), side, otype, **kwargs))
    elif cmd == "cancel":
        _print(cancel_order(rest[0]))
    elif cmd == "close":
        _print(close_position(rest[0]))
    else:
        sys.exit(f"unknown command: {cmd}\n{__doc__}")


if __name__ == "__main__":
    _cli(sys.argv[1:])
