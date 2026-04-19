#!/usr/bin/env python3
"""Perplexity wrapper. One question in, synthesized answer out.

CLI:
    python scripts/perplexity.py "What were today's macro catalysts for SPY?"
    python scripts/perplexity.py --model sonar-pro "..."
"""
from __future__ import annotations

import json
import os
import sys
import urllib.request

URL = "https://api.perplexity.ai/chat/completions"
DEFAULT_MODEL = "sonar-pro"


def ask(question: str, model: str = DEFAULT_MODEL, system: str | None = None) -> str:
    key = os.environ.get("PERPLEXITY_API_KEY", "")
    if not key:
        sys.exit("missing env var: PERPLEXITY_API_KEY")
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": question})
    body = json.dumps({"model": model, "messages": messages}).encode()
    req = urllib.request.Request(
        URL,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        payload = json.loads(resp.read().decode())
    return payload["choices"][0]["message"]["content"]


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    model = DEFAULT_MODEL
    if args[0] == "--model":
        model = args[1]
        args = args[2:]
    print(ask(" ".join(args), model=model))
