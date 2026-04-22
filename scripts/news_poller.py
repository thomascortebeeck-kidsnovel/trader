#!/usr/bin/env python3
"""
News event detector for the news-based bot.

Runs every 5 minutes via GitHub Actions. Polls Alpaca News and Finnhub,
applies a deterministic layer-1 filter, and POSTs surviving items to the
Claude Routine API trigger. The routine does the actual scoring (importance
1-5, direction tagging) and trade decision — this script only determines
that a potentially actionable article arrived.

Layer-1 filter (deterministic, no LLM):
  1. Source domain in TIER1_DOMAINS
  2. Ticker in watchlist (for micro) OR broad macro keywords present
  3. Article ID/hash not already fired today (deduplication)

Required environment variables:
  NEWS_ALPACA_API_KEY        — Alpaca paper key for news-based account
  NEWS_ALPACA_SECRET_KEY     — Alpaca paper secret
  FINNHUB_API_KEY            — Finnhub API key
  NEWS_ROUTINE_TRIGGER_URL   — from claude.ai/code → routine → Add trigger → API
  NEWS_ROUTINE_TOKEN         — bearer token from same page

Optional:
  ALPACA_DATA_URL     — defaults to https://data.alpaca.markets
  POLLER_STATE_FILE   — defaults to /tmp/news_poller_state.json
  WATCHLIST_FILE      — defaults to bots/news-based/watchlist.md
  DRY_RUN             — set to "true" to log without firing the routine
  NEWS_LOOKBACK_MIN   — minutes of news history to fetch (default 10)
"""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import os
import pathlib
import re
import sys
import urllib.parse
import urllib.request
import zoneinfo

ET = zoneinfo.ZoneInfo("America/New_York")

ALPACA_DATA_HOST = "https://data.alpaca.markets"
FINNHUB_HOST = "https://finnhub.io"

MARKET_OPEN = dt.time(9, 30)
MARKET_CLOSE = dt.time(16, 15)
PRE_MARKET_START = dt.time(7, 0)

TIER1_DOMAINS: frozenset[str] = frozenset(
    {
        # Primary tier-1 wires + official sources
        "reuters.com",
        "wsj.com",
        "ft.com",
        "apnews.com",
        "bloomberg.com",
        "sec.gov",
        "federalreserve.gov",
        "bls.gov",
        "bea.gov",
        "fdic.gov",
        "whitehouse.gov",
        "treasury.gov",
        # Dow Jones properties + reputable financial press — added after
        # observing 105 articles/poll with 0 survivors on a strict list.
        # These are still editorially serious; layer-2 in the routine
        # applies importance scoring and direction tagging on top.
        "cnbc.com",
        "marketwatch.com",
        "barrons.com",
        "nytimes.com",
        "washingtonpost.com",
        "economist.com",
        "businessinsider.com",
        "benzinga.com",
        "finance.yahoo.com",
    }
)

MACRO_KEYWORDS: frozenset[str] = frozenset(
    {
        "fed", "fomc", "federal reserve", "inflation", "cpi", "pce",
        "nonfarm", "nfp", "gdp", "opec", "rate cut", "rate hike",
        "tariff", "sanctions", "earnings", "guidance", "merger",
        "acquisition", "m&a", "bankruptcy", "buyout", "recall",
        "fda approval", "sec enforcement", "interest rate", "treasury",
        "unemployment", "jobs report", "trade war", "trade deal",
    }
)


def _env(name: str, default: str | None = None) -> str:
    val = os.environ.get(name, default or "")
    if not val and default is None:
        sys.exit(f"ERROR: missing required env var: {name}")
    return val


def _alpaca_headers() -> dict[str, str]:
    return {
        "APCA-API-KEY-ID": _env("NEWS_ALPACA_API_KEY"),
        "APCA-API-SECRET-KEY": _env("NEWS_ALPACA_SECRET_KEY"),
        "Accept": "application/json",
    }


def _get_json(url: str, headers: dict | None = None, params: dict | None = None) -> dict | list:
    if params:
        url = url + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        print(f"HTTP {e.code} from {url}: {body[:200]}", file=sys.stderr)
        return {}


def _post_trigger(url: str, token: str, text: str) -> bool:
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
    return {"date": today, "fired_ids": []}


def save_state(path: pathlib.Path, state: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, indent=2))


def load_watchlist(path: pathlib.Path) -> list[str]:
    """Parse watchlist.md — return list of ticker symbols."""
    if not path.exists():
        return []
    tickers = []
    for line in path.read_text().splitlines():
        line = line.split("#")[0].strip()
        if re.match(r"^[A-Z]{1,5}$", line):
            tickers.append(line)
    return tickers


def domain_from_url(url: str) -> str:
    try:
        host = urllib.parse.urlparse(url).netloc.lower()
        return host.lstrip("www.")
    except Exception:
        return ""


def url_hash(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()[:16]


def has_macro_keyword(text: str) -> bool:
    lower = text.lower()
    return any(kw in lower for kw in MACRO_KEYWORDS)


def fetch_alpaca_news(symbols: list[str], lookback_min: int) -> list[dict]:
    """Fetch recent Alpaca news for the watchlist symbols."""
    if not symbols:
        return []
    start = (
        dt.datetime.now(dt.timezone.utc) - dt.timedelta(minutes=lookback_min)
    ).strftime("%Y-%m-%dT%H:%M:%SZ")
    params = {
        "symbols": ",".join(symbols),
        "start": start,
        "limit": 50,
        "sort": "desc",
    }
    data_host = _env("ALPACA_DATA_URL", ALPACA_DATA_HOST)
    result = _get_json(
        f"{data_host}/v1beta1/news",
        headers=_alpaca_headers(),
        params=params,
    )
    return result.get("news", []) if isinstance(result, dict) else []


def fetch_finnhub_news(category: str) -> list[dict]:
    """Fetch recent Finnhub news for a category (general, forex)."""
    api_key = _env("FINNHUB_API_KEY")
    params = {"category": category, "token": api_key}
    result = _get_json(f"{FINNHUB_HOST}/api/v1/news", params=params)
    return result if isinstance(result, list) else []


def filter_article_micro(
    article: dict,
    watchlist: set[str],
    fired_ids: set[str],
) -> tuple[bool, str, str]:
    """
    Layer-1 filter for a micro (Alpaca) article.
    Returns (passes, article_id, formatted_line).
    """
    article_id = str(article.get("id", "")) or url_hash(article.get("url", ""))
    if article_id in fired_ids:
        return False, article_id, ""

    url = article.get("url", "")
    source = article.get("source", "")
    headline = article.get("headline", "")
    summary = article.get("summary", "")[:300]
    symbols = [s for s in (article.get("symbols") or []) if s in watchlist]
    created = article.get("created_at", "")

    domain = domain_from_url(url)
    if domain not in TIER1_DOMAINS:
        return False, article_id, ""

    if not symbols:
        return False, article_id, ""

    text = (
        f"[MICRO] {', '.join(symbols)} — \"{headline}\"\n"
        f"  Source: {source} ({domain}) | {created}\n"
        f"  Summary: {summary}\n"
        f"  URL: {url}\n"
        f"  ID: {article_id}"
    )
    return True, article_id, text


def filter_article_macro(
    article: dict,
    fired_ids: set[str],
) -> tuple[bool, str, str]:
    """
    Layer-1 filter for a macro (Finnhub) article.
    Returns (passes, article_id, formatted_line).
    """
    url = article.get("url", "")
    article_id = url_hash(url or str(article.get("id", "")))
    if article_id in fired_ids:
        return False, article_id, ""

    headline = article.get("headline", "")
    summary = article.get("summary", "")[:300]
    source = article.get("source", "")
    created_ts = article.get("datetime", 0)
    created = (
        dt.datetime.fromtimestamp(created_ts, dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        if created_ts
        else ""
    )

    domain = domain_from_url(url)
    if domain not in TIER1_DOMAINS:
        return False, article_id, ""

    if not has_macro_keyword(headline + " " + summary):
        return False, article_id, ""

    text = (
        f"[MACRO] \"{headline}\"\n"
        f"  Source: {source} ({domain}) | {created}\n"
        f"  Summary: {summary}\n"
        f"  URL: {url}\n"
        f"  ID: {article_id}"
    )
    return True, article_id, text


def main() -> int:
    trigger_url = _env("NEWS_ROUTINE_TRIGGER_URL")
    trigger_token = _env("NEWS_ROUTINE_TOKEN")
    state_file = pathlib.Path(_env("POLLER_STATE_FILE", "/tmp/news_poller_state.json"))
    watchlist_file = pathlib.Path(_env("WATCHLIST_FILE", "bots/news-based/watchlist.md"))
    dry_run = _env("DRY_RUN", "false").lower() == "true"
    lookback_min = int(_env("NEWS_LOOKBACK_MIN", "10"))

    now_et = dt.datetime.now(ET)
    now_time = now_et.time()

    if not (PRE_MARKET_START <= now_time < MARKET_CLOSE):
        print(f"Outside polling window ({now_time} ET). Exiting.")
        return 0

    state = load_state(state_file)
    fired_ids: set[str] = set(state.get("fired_ids", []))
    watchlist = load_watchlist(watchlist_file)
    watchlist_set = set(watchlist)

    surviving: list[str] = []
    new_ids: list[str] = []

    print(
        f"[{now_et.strftime('%H:%M ET')}] Polling news — "
        f"{len(watchlist)} watchlist tickers, lookback {lookback_min}min"
    )

    # --- Micro stream (Alpaca News) ---
    alpaca_articles = fetch_alpaca_news(watchlist, lookback_min)
    print(f"  Alpaca: {len(alpaca_articles)} raw articles")
    for article in alpaca_articles:
        passes, article_id, line = filter_article_micro(article, watchlist_set, fired_ids)
        if passes:
            surviving.append(line)
            new_ids.append(article_id)
            fired_ids.add(article_id)
            print(f"  PASS (micro): {article.get('headline', '')[:80]}")

    # --- Macro stream (Finnhub general + forex) ---
    for category in ("general", "forex"):
        finnhub_articles = fetch_finnhub_news(category)
        print(f"  Finnhub/{category}: {len(finnhub_articles)} raw articles")
        for article in finnhub_articles:
            passes, article_id, line = filter_article_macro(article, fired_ids)
            if passes:
                surviving.append(line)
                new_ids.append(article_id)
                fired_ids.add(article_id)
                print(f"  PASS (macro): {article.get('headline', '')[:80]}")

    if not surviving:
        print("No news survived layer-1 filter this cycle. Nothing fired.")
        save_state(state_file, {**state, "fired_ids": list(fired_ids)})
        return 0

    print(f"{len(surviving)} item(s) survived layer-1 filter.")

    full_text = (
        f"NEWS EVENT — {len(surviving)} item(s) passed layer-1 filter\n"
        f"Polled at: {now_et.strftime('%Y-%m-%d %H:%M ET')}\n"
        f"Watchlist: {', '.join(watchlist)}\n\n"
        + "\n\n".join(surviving)
        + "\n\n"
        "---\n"
        "These items passed layer-1 (tier-1 source domain + watchlist/macro keyword). "
        "Run the full news-filter skill (layer-2: importance 1-5, direction, source tier) "
        "on each item. Only trade items that score importance ≥ 4, tier-1, direction != UNCLEAR. "
        "Check seen-headlines.md to ensure you haven't already processed these hashes. "
        "Check today's trade-log.md for the 5-trade daily cap and daily P/L halt."
    )

    if dry_run:
        print("DRY_RUN=true — would have fired routine with:\n")
        print(full_text)
    else:
        success = _post_trigger(trigger_url, trigger_token, full_text)
        if not success:
            save_state(state_file, {**state, "fired_ids": list(fired_ids)})
            return 1

    state["fired_ids"] = list(fired_ids)
    save_state(state_file, state)
    return 0


if __name__ == "__main__":
    sys.exit(main())
