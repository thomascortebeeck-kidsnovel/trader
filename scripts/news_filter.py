#!/usr/bin/env python3
"""News hash + dedupe helper for the news-filter skill.

Usage:
    # Read Alpaca news JSON on stdin, print only new items to stdout,
    # append their hashes to the seen-file.
    python scripts/alpaca.py news AAPL,MSFT 30 \\
        | python scripts/news_filter.py dedupe --seen bots/news-based/memory/seen-headlines.md

    # Just hash a single URL (for ad-hoc use)
    python scripts/news_filter.py hash "https://..."

The *scoring* (importance 1-5, direction, source tier) remains in the
skill prompt — that's a judgement call the agent makes. This script only
handles the deterministic parts: hashing, dedupe, and persisting the hash
ledger.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import pathlib
import re
import sys

HASH_RE = re.compile(r"\b([0-9a-f]{16,64})\b")


def item_hash(item: dict) -> str:
    """Prefer URL; fall back to headline + source."""
    url = (item.get("url") or "").strip()
    if url:
        basis = url
    else:
        basis = (item.get("headline", "") or "") + "|" + (item.get("source", "") or "")
    return hashlib.sha256(basis.encode()).hexdigest()[:16]


def load_seen(path: pathlib.Path) -> set[str]:
    if not path.exists():
        return set()
    text = path.read_text()
    return set(HASH_RE.findall(text))


def append_seen(path: pathlib.Path, new_hashes: list[tuple[str, str]]) -> None:
    """new_hashes: list of (hash, tag) where tag is symbol or theme."""
    if not new_hashes:
        return
    now = dt.datetime.utcnow().strftime("%Y-%m-%d %H:%M")
    lines = [f"{now} | {h} | {t}" for h, t in new_hashes]
    with path.open("a") as f:
        f.write("\n".join(lines) + "\n")


def cmd_hash(url: str) -> int:
    print(item_hash({"url": url}))
    return 0


def cmd_dedupe(seen_path: pathlib.Path) -> int:
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"stdin is not valid JSON: {e}", file=sys.stderr)
        return 2

    # Alpaca news shape: {"news": [ ... ], "next_page_token": ...}
    items = payload.get("news", payload if isinstance(payload, list) else [])

    seen = load_seen(seen_path)
    new_items: list[dict] = []
    new_hashes: list[tuple[str, str]] = []
    for it in items:
        h = item_hash(it)
        if h in seen:
            continue
        new_items.append({**it, "_hash": h})
        syms = it.get("symbols") or []
        tag = (syms[0] if syms else "general")
        new_hashes.append((h, tag))
        seen.add(h)

    append_seen(seen_path, new_hashes)
    print(json.dumps({"new": new_items, "count": len(new_items)}, default=str))
    return 0


def main() -> int:
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)

    hp = sub.add_parser("hash")
    hp.add_argument("url")

    dp = sub.add_parser("dedupe")
    dp.add_argument("--seen", required=True, type=pathlib.Path)

    args = p.parse_args()
    if args.cmd == "hash":
        return cmd_hash(args.url)
    if args.cmd == "dedupe":
        return cmd_dedupe(args.seen)
    return 2


if __name__ == "__main__":
    sys.exit(main())
