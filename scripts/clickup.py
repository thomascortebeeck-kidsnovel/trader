#!/usr/bin/env python3
"""ClickUp wrapper. Posts a comment on the configured task.

CLI:
    python scripts/clickup.py "EOD: portfolio +0.4%, SPY +0.2%, 1 trade"
    python scripts/clickup.py --task-id 86xxxxx "..."

Retries transient ClickUp failures (429, 5xx, connection errors) with
exponential backoff. Total retry budget ~14s across 4 attempts, tunable
via CLICKUP_MAX_ATTEMPTS + CLICKUP_BACKOFF_BASE env vars.
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request

RETRYABLE_STATUS = {429, 500, 502, 503, 504}


def post_comment(text: str, task_id: str | None = None) -> dict:
    key = os.environ.get("CLICKUP_API_KEY", "")
    if not key:
        sys.exit("missing env var: CLICKUP_API_KEY")
    task = task_id or os.environ.get("CLICKUP_TASK_ID", "")
    if not task:
        sys.exit("missing CLICKUP_TASK_ID (or pass --task-id)")
    url = f"https://api.clickup.com/api/v2/task/{task}/comment"
    body = json.dumps({"comment_text": text, "notify_all": False}).encode()

    max_attempts = int(os.environ.get("CLICKUP_MAX_ATTEMPTS", "4"))
    base = float(os.environ.get("CLICKUP_BACKOFF_BASE", "2"))

    last_err = ""
    for attempt in range(1, max_attempts + 1):
        req = urllib.request.Request(
            url,
            data=body,
            method="POST",
            headers={"Authorization": key, "Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            body_text = e.read().decode(errors="replace")[:300]
            last_err = f"HTTP {e.code}: {body_text}"
            if e.code not in RETRYABLE_STATUS or attempt == max_attempts:
                sys.exit(
                    f"ClickUp post failed after {attempt} attempt(s) — {last_err}"
                )
        except (urllib.error.URLError, TimeoutError) as e:
            last_err = f"connection error: {e}"
            if attempt == max_attempts:
                sys.exit(
                    f"ClickUp post failed after {attempt} attempt(s) — {last_err}"
                )

        sleep_for = base ** attempt  # 2, 4, 8 for default base=2
        print(
            f"ClickUp post attempt {attempt}/{max_attempts} failed ({last_err}); "
            f"retrying in {sleep_for:.0f}s...",
            file=sys.stderr,
        )
        time.sleep(sleep_for)

    sys.exit(f"ClickUp post failed — {last_err}")


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    task_id = None
    if args[0] == "--task-id":
        task_id = args[1]
        args = args[2:]
    print(json.dumps(post_comment(" ".join(args), task_id=task_id), indent=2))
