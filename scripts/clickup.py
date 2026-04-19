#!/usr/bin/env python3
"""ClickUp wrapper. Posts a comment on the configured task.

CLI:
    python scripts/clickup.py "EOD: portfolio +0.4%, SPY +0.2%, 1 trade"
    python scripts/clickup.py --task-id 86xxxxx "..."
"""
from __future__ import annotations

import json
import os
import sys
import urllib.request


def post_comment(text: str, task_id: str | None = None) -> dict:
    key = os.environ.get("CLICKUP_API_KEY", "")
    if not key:
        sys.exit("missing env var: CLICKUP_API_KEY")
    task = task_id or os.environ.get("CLICKUP_TASK_ID", "")
    if not task:
        sys.exit("missing CLICKUP_TASK_ID (or pass --task-id)")
    url = f"https://api.clickup.com/api/v2/task/{task}/comment"
    body = json.dumps({"comment_text": text, "notify_all": False}).encode()
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={"Authorization": key, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    task_id = None
    if args[0] == "--task-id":
        task_id = args[1]
        args = args[2:]
    print(json.dumps(post_comment(" ".join(args), task_id=task_id), indent=2))
