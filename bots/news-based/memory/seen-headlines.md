# News Bot — Seen Headlines

Append-only. One hash per processed news item. The `news-filter` skill dedupes against this file before scoring.

> Format: `YYYY-MM-DD HH:MM | sha256(url-or-headline-source) | symbol-or-theme`

