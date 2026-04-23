#!/usr/bin/env python3
"""
Intraday event detector for the day-trader-kraken bot.

Runs every 5 minutes via GitHub Actions. Polls KRKNF bars, detects
actionable setup events, and POSTs to the Claude Routine API trigger.
The routine does the actual pattern recognition and trade decision —
this script only detects that *something changed* worth looking at.

Detected events:
  OR_COMPLETE       — first 3 bars of session are in (09:45-09:55 ET)
  VWAP_CROSSOVER    — price crossed VWAP on a 5-min close (either direction)
  VOLUME_SPIKE      — a bar's volume > 1.5× session avg and > 5k shares
  POSITION_MILESTONE— open position hit 1R or 1.5R unrealised P/L

Required environment variables:
  KRAKEN_ALPACA_API_KEY      — Alpaca paper key for day-trader-kraken account
  KRAKEN_ALPACA_SECRET_KEY   — Alpaca paper secret
  KRAKEN_ROUTINE_TRIGGER_URL — from claude.ai/code → routine → Add trigger → API
  KRAKEN_ROUTINE_TOKEN       — bearer token from same page

Optional:
  ALPACA_DATA_URL     — defaults to https://data.alpaca.markets
  ALPACA_BASE_URL     — defaults to https://paper-api.alpaca.markets
  POLLER_STATE_FILE   — defaults to /tmp/kraken_poller_state.json
  SYMBOL              — defaults to KRKNF
  DRY_RUN             — set to "true" to log events without firing the routine
"""
from __future__ import annotations

import datetime as dt
import json
import os
import pathlib
import sys
import urllib.parse
import urllib.request
import zoneinfo

ET = zoneinfo.ZoneInfo("America/New_York")

DATA_HOST = "https://data.alpaca.markets"
PAPER_HOST = "https://paper-api.alpaca.markets"

MARKET_OPEN = dt.time(9, 30)
MARKET_CLOSE = dt.time(16, 0)
OR_END = dt.time(9, 45)
OR_WINDOW_END = dt.time(9, 55)

# Volume-spike event thresholds. A bar fires a VOLUME_SPIKE event only when
# BOTH conditions hold: last bar vol > MIN_SESSION_VOL AND last bar vol > RATIO
# * session-avg. Calibrate MIN_SESSION_VOL to ~1/3 of the symbol's median
# 5-min bar volume so genuinely quiet bars can't falsely trip a spike.
#   KRKNF baseline — 5_000 (small-cap OTC, ~6-10k/bar typical)
#   TSLA current   — 200_000 (mega-cap NASDAQ, ~850k/bar median = 80M / 78 bars)
# Re-tune here when swapping symbols; the ratio 1.5× is liquidity-agnostic.
MIN_SESSION_VOL = 200_000
VOL_SPIKE_RATIO = 1.5
VWAP_COOLDOWN_MIN = 30
VOL_COOLDOWN_MIN = 15


def _env(name: str, default: str | None = None) -> str:
    val = os.environ.get(name, default or "")
    if not val and default is None:
        sys.exit(f"ERROR: missing required env var: {name}")
    return val


def _alpaca_headers() -> dict[str, str]:
    return {
        "APCA-API-KEY-ID": _env("KRAKEN_ALPACA_API_KEY"),
        "APCA-API-SECRET-KEY": _env("KRAKEN_ALPACA_SECRET_KEY"),
        "Accept": "application/json",
    }


def _get(url: str, params: dict | None = None) -> dict:
    if params:
        url = url + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=_alpaca_headers())
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        print(f"HTTP {e.code} from {url}: {body}", file=sys.stderr)
        return {}


def _post_trigger(url: str, token: str, text: str) -> bool:
    """POST event text to Claude Routine API trigger. Returns True on success."""
    payload = json.dumps({"text": text}).encode()
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "anthropic-beta": "experimental-cc-routine-2026-04-01",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            print(f"Routine fired — HTTP {resp.status}")
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        print(f"ERROR firing routine — HTTP {e.code}: {body}", file=sys.stderr)
        return False


def load_state(path: pathlib.Path) -> dict:
    today = dt.date.today().isoformat()
    if path.exists():
        try:
            state = json.loads(path.read_text())
            if state.get("date") == today:
                return state
        except (json.JSONDecodeError, KeyError):
            pass
    return {
        "date": today,
        "or_fired": False,
        "last_close": None,
        "last_above_vwap": None,
        "vwap_cooldown_until": None,
        "vol_cooldown_until": None,
        "session_bars": [],
        "position_1r_fired": False,
        "position_1_5r_fired": False,
    }


def save_state(path: pathlib.Path, state: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, indent=2))


def vwap(bars: list[dict]) -> float | None:
    cum_pv = sum((b["h"] + b["l"] + b["c"]) / 3 * b["v"] for b in bars)
    cum_v = sum(b["v"] for b in bars)
    return cum_pv / cum_v if cum_v else None


def session_avg_vol(bars: list[dict]) -> float:
    if not bars:
        return 0.0
    return sum(b["v"] for b in bars) / len(bars)


def fetch_bars(symbol: str, limit: int = 40) -> list[dict]:
    """Fetch the most recent 5-Min bars for symbol. Returns [] if unavailable."""
    now_et = dt.datetime.now(ET)
    start = now_et.replace(
        hour=9, minute=30, second=0, microsecond=0
    ).astimezone(dt.timezone.utc)
    params = {
        "timeframe": "5Min",
        "start": start.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "limit": limit,
        "feed": "iex",
        "sort": "asc",
    }
    data_host = _env("ALPACA_DATA_URL", DATA_HOST)
    url = f"{data_host}/v2/stocks/{symbol}/bars"
    result = _get(url, params)
    raw = result.get("bars") or []
    return [
        {
            "t": b["t"],
            "o": b["o"],
            "h": b["h"],
            "l": b["l"],
            "c": b["c"],
            "v": b["v"],
        }
        for b in raw
    ]


def fetch_positions(symbol: str) -> dict | None:
    """Return open position for symbol or None."""
    base = _env("ALPACA_BASE_URL", PAPER_HOST)
    url = f"{base}/v2/positions/{symbol}"
    req = urllib.request.Request(url, headers=_alpaca_headers())
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        body = e.read().decode(errors="replace")
        print(f"WARNING: position fetch HTTP {e.code}: {body}", file=sys.stderr)
        return None


def check_position_milestone(
    symbol: str, state: dict
) -> tuple[bool, str]:
    """Return (should_fire, event_text) for position milestone events."""
    pos = fetch_positions(symbol)
    if not pos:
        return False, ""

    try:
        entry = float(pos.get("avg_entry_price", 0))
        current = float(pos.get("current_price", 0))
        qty = float(pos.get("qty", 0))
        side = pos.get("side", "long")
    except (TypeError, ValueError):
        return False, ""

    if not entry or not current or not qty:
        return False, ""

    # Read stop from pattern-cache would be ideal, but that requires git access.
    # Use 1.5×ATR as a proxy for 1R, computed from the recent bars we have in state.
    session_bars = state.get("session_bars", [])
    if len(session_bars) < 3:
        return False, ""

    recent_ranges = [(b["h"] - b["l"]) for b in session_bars[-10:]]
    atr5 = sum(recent_ranges) / len(recent_ranges) if recent_ranges else 0
    if atr5 <= 0:
        return False, ""

    one_r = 1.5 * atr5
    move = (current - entry) if side == "long" else (entry - current)

    events = []
    if move >= 1.5 * one_r and not state.get("position_1_5r_fired"):
        events.append("1.5R")
        state["position_1_5r_fired"] = True
    elif move >= one_r and not state.get("position_1r_fired"):
        events.append("1R")
        state["position_1r_fired"] = True

    if not events:
        return False, ""

    text = (
        f"EVENT: POSITION_MILESTONE\n"
        f"Symbol: {symbol}\n"
        f"Side: {side.upper()}\n"
        f"Entry: ${entry:.4f}\n"
        f"Current price: ${current:.4f}\n"
        f"Milestones hit: {', '.join(events)}\n"
        f"ATR(5m) proxy: ${atr5:.4f}\n"
        f"1R = ${one_r:.4f}\n"
        f"Unrealised move: ${move:.4f}\n"
        f"Qty: {qty}\n\n"
        f"Check pattern-cache.md for actual stop/target levels and manage the position "
        f"accordingly (tighten stop to break-even at 1R, ATR-trail at 1.5R)."
    )
    return True, text


def main() -> int:
    symbol = _env("SYMBOL", "KRKNF")
    trigger_url = _env("KRAKEN_ROUTINE_TRIGGER_URL")
    trigger_token = _env("KRAKEN_ROUTINE_TOKEN")
    state_file = pathlib.Path(_env("POLLER_STATE_FILE", "/tmp/kraken_poller_state.json"))
    dry_run = _env("DRY_RUN", "false").lower() == "true"

    now_et = dt.datetime.now(ET)
    now_time = now_et.time()

    if not (MARKET_OPEN <= now_time < MARKET_CLOSE):
        print(f"Outside market hours ({now_time} ET). Exiting.")
        return 0

    state = load_state(state_file)
    events: list[str] = []

    bars = fetch_bars(symbol)
    if not bars:
        print(f"No bars returned for {symbol} — symbol may be inactive or OTC feed unavailable. Skipping.")
        save_state(state_file, state)
        return 0

    state["session_bars"] = bars

    current_vwap = vwap(bars)
    last_bar = bars[-1]
    last_close = last_bar["c"]
    avg_vol = session_avg_vol(bars)
    last_vol = last_bar["v"]

    vwap_str = f"${current_vwap:.4f}" if current_vwap else "N/A"
    print(
        f"[{now_et.strftime('%H:%M ET')}] {symbol} last bar: "
        f"close=${last_close:.4f} vol={last_vol:,} VWAP={vwap_str} "
        f"bars={len(bars)}"
    )

    # --- Event: OR_COMPLETE ---
    if (
        OR_END <= now_time < OR_WINDOW_END
        and len(bars) >= 3
        and not state["or_fired"]
    ):
        or_bars = bars[:3]
        orh = max(b["h"] for b in or_bars)
        orl = min(b["l"] for b in or_bars)
        or_width = orh - orl
        or_avg_vol = session_avg_vol(or_bars)
        state["or_fired"] = True

        text = (
            f"EVENT: OR_COMPLETE\n"
            f"Symbol: {symbol}\n"
            f"Time: {now_et.strftime('%H:%M ET')}\n"
            f"ORH (high of first 3 bars): ${orh:.4f}\n"
            f"ORL (low of first 3 bars): ${orl:.4f}\n"
            f"OR width: ${or_width:.4f}\n"
            f"OR avg 5-min volume: {or_avg_vol:,.0f}\n"
            f"Current price: ${last_close:.4f}\n"
            f"Current bar volume: {last_vol:,}\n"
            f"VWAP: {vwap_str}\n\n"
            f"Opening Range is set. Check if the ORB setup from strategy.md and pattern-cache.md "
            f"is live: close > ORH with volume > 1.5x OR avg = long ORB; "
            f"close < ORL with same volume condition = short ORB. "
            f"If neither confirms by 10:00 ET, no ORB trade today."
        )
        events.append(text)
        print("Event detected: OR_COMPLETE")

    # --- Event: VWAP_CROSSOVER ---
    if current_vwap is not None and len(bars) >= 2:
        above_now = last_close > current_vwap
        last_above = state.get("last_above_vwap")
        cooldown_until = state.get("vwap_cooldown_until")
        now_iso = now_et.isoformat()

        cooldown_ok = (
            cooldown_until is None or now_iso > cooldown_until
        )

        if last_above is not None and above_now != last_above and cooldown_ok:
            direction = "LONG" if above_now else "SHORT"
            cross_type = "ABOVE" if above_now else "BELOW"
            new_cooldown = (
                now_et + dt.timedelta(minutes=VWAP_COOLDOWN_MIN)
            ).isoformat()
            state["vwap_cooldown_until"] = new_cooldown

            text = (
                f"EVENT: VWAP_CROSSOVER_{direction}\n"
                f"Symbol: {symbol}\n"
                f"Time: {now_et.strftime('%H:%M ET')}\n"
                f"Price crossed {cross_type} VWAP on a 5-min close.\n"
                f"Last bar close: ${last_close:.4f}\n"
                f"VWAP: ${current_vwap:.4f}\n"
                f"Last bar volume: {last_vol:,}\n"
                f"Session avg volume: {avg_vol:,.0f}\n\n"
                f"Check strategy.md for the VWAP reclaim setup (crossover from below = "
                f"potential long entry; breakdown from above = potential short). "
                f"Entry is on the NEXT bar's high (long) or low (short) — not this bar."
            )
            events.append(text)
            print(f"Event detected: VWAP_CROSSOVER_{direction}")

        state["last_above_vwap"] = above_now

    state["last_close"] = last_close

    # --- Event: VOLUME_SPIKE ---
    if avg_vol > 0 and last_vol > VOL_SPIKE_RATIO * avg_vol and last_vol > MIN_SESSION_VOL:
        cooldown_until = state.get("vol_cooldown_until")
        now_iso = now_et.isoformat()
        cooldown_ok = cooldown_until is None or now_iso > cooldown_until

        if cooldown_ok:
            new_cooldown = (
                now_et + dt.timedelta(minutes=VOL_COOLDOWN_MIN)
            ).isoformat()
            state["vol_cooldown_until"] = new_cooldown

            text = (
                f"EVENT: VOLUME_SPIKE\n"
                f"Symbol: {symbol}\n"
                f"Time: {now_et.strftime('%H:%M ET')}\n"
                f"Last bar volume: {last_vol:,} ({last_vol / avg_vol:.1f}x session avg)\n"
                f"Session avg 5-min volume: {avg_vol:,.0f}\n"
                f"Last bar OHLC: O=${last_bar['o']:.4f} H=${last_bar['h']:.4f} "
                f"L=${last_bar['l']:.4f} C=${last_bar['c']:.4f}\n"
                f"VWAP: {vwap_str}\n\n"
                f"Volume spike detected. This may signal a breakout, reversal, or news catalyst. "
                f"Check pattern-cache.md plan and current open patterns. "
                f"Only act if a named pattern from strategy.md is forming."
            )
            events.append(text)
            print("Event detected: VOLUME_SPIKE")

    # --- Event: POSITION_MILESTONE ---
    milestone_fire, milestone_text = check_position_milestone(symbol, state)
    if milestone_fire:
        events.append(milestone_text)
        print("Event detected: POSITION_MILESTONE")

    if not events:
        print("No events detected this cycle. Exiting silently.")
        save_state(state_file, state)
        return 0

    combined = "\n\n---\n\n".join(events)
    full_text = (
        f"Intraday event fired by poller at {now_et.strftime('%Y-%m-%d %H:%M ET')}\n\n"
        + combined
    )

    if dry_run:
        print("DRY_RUN=true — would have fired routine with:\n")
        print(full_text)
    else:
        print(f"Firing routine for {len(events)} event(s)...")
        success = _post_trigger(trigger_url, trigger_token, full_text)
        if not success:
            save_state(state_file, state)
            return 1

    save_state(state_file, state)
    return 0


if __name__ == "__main__":
    sys.exit(main())
