#!/usr/bin/env python3
"""Notification dispatcher. Currently routes everything through ClickUp.

To add Slack/Telegram/etc, add a new sender below and pick based on env var
NOTIFY_CHANNEL (clickup | slack | telegram).
"""
from __future__ import annotations

import os
import sys

from clickup import post_comment


def send(message: str) -> None:
    channel = os.environ.get("NOTIFY_CHANNEL", "clickup").lower()
    if channel == "clickup":
        post_comment(message)
    else:
        sys.exit(f"unsupported NOTIFY_CHANNEL: {channel}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    send(" ".join(sys.argv[1:]))
