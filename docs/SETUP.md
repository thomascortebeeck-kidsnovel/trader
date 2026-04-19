# SETUP — paste-helper (mobile-friendly)

Single-page helper to minimize the per-routine clicks in claude.ai/code.
For each routine below, you'll tap **+ New routine**, then copy the fields straight from this page.

---

## Part 1 — Create 3 Cloud Environments

Do this once per bot. Three times total.

### Fast path (optional): create the env shells via the Beta API

If you have an `ANTHROPIC_API_KEY` handy, this script creates the three environment shells (name, description, network policy) in one shot — saves you ~30% of the per-env clicks. The API doesn't accept env vars or setup scripts in the create call, so you'll still finish those three details in the UI per env.

```bash
export ANTHROPIC_API_KEY=sk-ant-...
python3 scripts/create_environments.py
# Rotate your ANTHROPIC_API_KEY after running.
```

It prints the new env IDs and writes them to `docs/.env-ids.txt`. Re-runs are safe — it skips envs whose name already exists.

After it succeeds, jump straight to "Part 1 → for each env, open it in the UI and paste the env vars block + setup script" below. Skip the "Name" / "Network" / "Create environment" steps since the API already did them.

### Manual path

Tap **+ New environment** in claude.ai/code three times.

### Environment A — `general`

- **Name:** `general`
- **Network:** Trusted
- **Setup script:**
  ```bash
  #!/bin/bash
  python3 --version
  ```
- **Environment variables** (replace each `<...>` with a real value):

  ```
  ALPACA_API_KEY=<paper key from Alpaca account #1>
  ALPACA_SECRET_KEY=<paper secret from Alpaca account #1>
  ALPACA_BASE_URL=https://paper-api.alpaca.markets
  ALPACA_DATA_URL=https://data.alpaca.markets
  PERPLEXITY_API_KEY=<your Perplexity key>
  FINNHUB_API_KEY=<your Finnhub key>
  CLICKUP_API_KEY=<your ClickUp token>
  CLICKUP_TASK_ID=869cyx7a5
  LIVE_MODE=false
  ```

- Tap **Create environment**.

### Environment B — `day-trader-kraken`

Same as `general`, EXCEPT swap the two Alpaca lines for your **second** paper account:

```
ALPACA_API_KEY=<paper key from Alpaca account #2>
ALPACA_SECRET_KEY=<paper secret from Alpaca account #2>
```

### Environment C — `news-based`

Same as `general`, EXCEPT swap the two Alpaca lines for your **third** paper account:

```
ALPACA_API_KEY=<paper key from Alpaca account #3>
ALPACA_SECRET_KEY=<paper secret from Alpaca account #3>
```

---

## Part 2 — Create 16 Routines

**Shared settings for every routine:**

- **Repo:** `thomascortebeeck-kidsnovel/trader`  ✓ (already attached if you saw it earlier)
- **Branch:** `claude/ai-trading-bot-system-magkk` (switch to `main` after merge)
- **Model:** `Opus 4.7 1M`
- **Trigger:** **Schedule**
- **Timezone:** `America/New_York`  ← critical, every routine
- **Connectors:** **remove Canva** (remove everything — routines need zero connectors)
- **Permissions** tab → **Allow unrestricted branch pushes** = **ON**  ← critical, every routine

For each routine: paste the **Name** and **Cron** from the table below, pick the right **Environment**, then open the **Prompt file** in the GitHub repo, copy the *entire* file content, and paste it into the routine's "Describe what Claude should do" box.

### Progress checklist

| # | Name                         | Environment           | Cron (ET)              | Prompt file                                                          |
|---|------------------------------|------------------------|------------------------|----------------------------------------------------------------------|
| 1 | `general / pre-market`       | `general`              | `0 8 * * 1-5`          | [`bots/general/routines/pre-market.md`](../bots/general/routines/pre-market.md) |
| 2 | `general / market-open`      | `general`              | `0 10 * * 1-5`         | [`bots/general/routines/market-open.md`](../bots/general/routines/market-open.md) |
| 3 | `general / midday`           | `general`              | `0 12 * * 1-5`         | [`bots/general/routines/midday.md`](../bots/general/routines/midday.md) |
| 4 | `general / eod`              | `general`              | `0 16 * * 1-5`         | [`bots/general/routines/eod.md`](../bots/general/routines/eod.md) |
| 5 | `general / weekly-review`    | `general`              | `30 16 * * 5`          | [`bots/general/routines/weekly-review.md`](../bots/general/routines/weekly-review.md) |
| 6 | `kraken / pre-market`        | `day-trader-kraken`    | `15 8 * * 1-5`         | [`bots/day-trader-kraken/routines/pre-market.md`](../bots/day-trader-kraken/routines/pre-market.md) |
| 7 | `kraken / opening-range`     | `day-trader-kraken`    | `45 9 * * 1-5`         | [`bots/day-trader-kraken/routines/opening-range.md`](../bots/day-trader-kraken/routines/opening-range.md) |
| 8 | `kraken / trend-scan-1`      | `day-trader-kraken`    | `30 10 * * 1-5`        | [`bots/day-trader-kraken/routines/trend-scan-1.md`](../bots/day-trader-kraken/routines/trend-scan-1.md) |
| 9 | `kraken / trend-scan-2`      | `day-trader-kraken`    | `30 13 * * 1-5`        | [`bots/day-trader-kraken/routines/trend-scan-2.md`](../bots/day-trader-kraken/routines/trend-scan-2.md) |
|10 | `kraken / close-flatten`     | `day-trader-kraken`    | `50 15 * * 1-5`        | [`bots/day-trader-kraken/routines/close-flatten.md`](../bots/day-trader-kraken/routines/close-flatten.md) |
|11 | `kraken / weekly-review`     | `day-trader-kraken`    | `30 16 * * 5`          | [`bots/day-trader-kraken/routines/weekly-review.md`](../bots/day-trader-kraken/routines/weekly-review.md) |
|12 | `news / pre-market-news`     | `news-based`           | `30 7 * * 1-5`         | [`bots/news-based/routines/pre-market-news.md`](../bots/news-based/routines/pre-market-news.md) |
|13 | `news / micro-scan`          | `news-based`           | `*/30 9-15 * * 1-5`    | [`bots/news-based/routines/micro-scan.md`](../bots/news-based/routines/micro-scan.md) |
|14 | `news / macro-scan`          | `news-based`           | `15 9-15/1 * * 1-5`    | [`bots/news-based/routines/macro-scan.md`](../bots/news-based/routines/macro-scan.md) |
|15 | `news / eod`                 | `news-based`           | `15 16 * * 1-5`        | [`bots/news-based/routines/eod.md`](../bots/news-based/routines/eod.md) |
|16 | `news / weekly-review`       | `news-based`           | `0 17 * * 5`           | [`bots/news-based/routines/weekly-review.md`](../bots/news-based/routines/weekly-review.md) |

**Tip (mobile):** tap a prompt file link → tap the "raw" or "⋯ → raw" button → long-press to select all → copy → go back to the routine page → paste.

---

## Part 3 — Validate before turning crons on

For each *environment* (once per bot, not per routine), pick any routine in that environment and tap **Run now**. Watch for:

- Transcript prints account equity (e.g. `$100,000.00`) → Alpaca works.
- Transcript commits to `main` at the end → branch-push permission is right.
- A comment appears on ClickUp task `869cyx7a5` → ClickUp works (EOD/market-open routines do this).

If any fails, screenshot the transcript and we'll diagnose.

---

## Part 4 — Phased cron enable

Don't enable all 16 schedules on day 1. Order them like this:

| When     | Turn on                                                                        |
|----------|--------------------------------------------------------------------------------|
| Week 1   | All 5 `general / *` routines                                                   |
| Week 2   | Add `news / pre-market-news` + `news / eod`                                    |
| Week 3   | Add the rest of `news / *` and all 6 `kraken / *`                              |
| Week 4+  | Read every transcript. Tighten prompts. **Do not** flip `LIVE_MODE=true`.      |

Each routine stays *created* but its schedule can be **off**; flip schedules on one bot at a time.
