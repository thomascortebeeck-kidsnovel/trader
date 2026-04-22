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

## Part 2 — Create 13 Routines

> **Note:** kraken `opening-range`, `trend-scan-1`, `trend-scan-2` and news `micro-scan`, `macro-scan` have been **replaced** by event-driven GitHub Actions pollers + API-triggered routines. See `docs/EVENT-TRIGGER-PLAN.md` for full details and the operator setup steps.

**Shared settings for every scheduled routine:**

- **Repo:** `thomascortebeeck-kidsnovel/trader`  ✓ (already attached if you saw it earlier)
- **Branch:** `main`
- **Model:** `Opus 4.7 1M`
- **Connectors:** **remove Canva** (remove everything — routines need zero connectors)
- **Permissions** tab → **Allow unrestricted branch pushes** = **ON**  ← critical, every routine

For each routine: paste the **Name** and **Cron** from the table below, pick the right **Environment**, then open the **Prompt file** in the GitHub repo, copy the *entire* file content, and paste it into the routine's "Describe what Claude should do" box.

### 2A — Scheduled routines (11 total)

**IMPORTANT — Cron is evaluated in UTC.** The table below uses EDT (ET+4, Mar–Nov). In winter (EST, ET+5), add +1 hour to every cron hour. The "Cron (ET)" column is reference only — paste the UTC cron into claude.ai/code.

For scheduled routines: **Trigger = Schedule**, Timezone = leave default.

| # | Name                         | Environment           | Cron (ET) — ref        | **Cron (UTC, EDT)**  | Prompt file |
|---|------------------------------|-----------------------|------------------------|----------------------|-------------|
| 1 | `general / pre-market`       | `general`             | `0 8 * * 1-5`          | `0 12 * * 1-5`       | [`bots/general/routines/pre-market.md`](../bots/general/routines/pre-market.md) |
| 2 | `general / market-open`      | `general`             | `0 10 * * 1-5`         | `0 14 * * 1-5`       | [`bots/general/routines/market-open.md`](../bots/general/routines/market-open.md) |
| 3 | `general / midday`           | `general`             | `0 12 * * 1-5`         | `0 16 * * 1-5`       | [`bots/general/routines/midday.md`](../bots/general/routines/midday.md) |
| 4 | `general / eod`              | `general`             | `0 16 * * 1-5`         | `0 20 * * 1-5`       | [`bots/general/routines/eod.md`](../bots/general/routines/eod.md) |
| 5 | `general / weekly-review`    | `general`             | `30 16 * * 5`          | `30 20 * * 5`        | [`bots/general/routines/weekly-review.md`](../bots/general/routines/weekly-review.md) |
| 6 | `kraken / pre-market`        | `day-trader-kraken`   | `15 8 * * 1-5`         | `15 12 * * 1-5`      | [`bots/day-trader-kraken/routines/pre-market.md`](../bots/day-trader-kraken/routines/pre-market.md) |
| 7 | `kraken / close-flatten`     | `day-trader-kraken`   | `50 15 * * 1-5`        | `50 19 * * 1-5`      | [`bots/day-trader-kraken/routines/close-flatten.md`](../bots/day-trader-kraken/routines/close-flatten.md) |
| 8 | `kraken / weekly-review`     | `day-trader-kraken`   | `30 16 * * 5`          | `30 20 * * 5`        | [`bots/day-trader-kraken/routines/weekly-review.md`](../bots/day-trader-kraken/routines/weekly-review.md) |
| 9 | `news / pre-market-news`     | `news-based`          | `30 7 * * 1-5`         | `30 11 * * 1-5`      | [`bots/news-based/routines/pre-market-news.md`](../bots/news-based/routines/pre-market-news.md) |
|10 | `news / eod`                 | `news-based`          | `15 16 * * 1-5`        | `15 20 * * 1-5`      | [`bots/news-based/routines/eod.md`](../bots/news-based/routines/eod.md) |
|11 | `news / weekly-review`       | `news-based`          | `0 17 * * 5`           | `0 21 * * 5`         | [`bots/news-based/routines/weekly-review.md`](../bots/news-based/routines/weekly-review.md) |

**Tip (mobile):** tap a prompt file link → tap the "raw" or "⋯ → raw" button → long-press to select all → copy → go back to the routine page → paste.

### 2B — API-triggered routines (2 total)

These two routines have **no cron** — they are fired by the GitHub Actions pollers when events are detected. Create them the same way as scheduled routines, but:

- **Trigger = API** (click "Add trigger" → "API", NOT Schedule)
- After saving, expand the API trigger to see the **trigger URL** and **bearer token**. Copy both immediately — the token is shown only once.
- Save the trigger URL and token as GitHub repository secrets (see `docs/EVENT-TRIGGER-PLAN.md` Step 1–3).

| # | Name                      | Environment           | Trigger | Prompt file |
|---|---------------------------|-----------------------|---------|-------------|
|12 | `kraken / intraday-event` | `day-trader-kraken`   | API     | [`bots/day-trader-kraken/routines/intraday-event.md`](../bots/day-trader-kraken/routines/intraday-event.md) |
|13 | `news / news-event`       | `news-based`          | API     | [`bots/news-based/routines/news-event.md`](../bots/news-based/routines/news-event.md) |

---

## Part 3 — Validate before turning crons on

For each *environment* (once per bot, not per routine), pick any **scheduled** routine in that environment and tap **Run now**. Watch for:

- Transcript prints account equity (e.g. `$100,000.00`) → Alpaca works.
- Transcript commits to `main` at the end → branch-push permission is right.
- A comment appears on ClickUp task `869cyx7a5` → ClickUp works (EOD/market-open routines do this).

To validate the **API-triggered routines**, use GitHub Actions:

1. Go to Actions → `Intraday Poller — Kraken Day Trader` → Run workflow → set `dry_run=true`.
2. Check the logs. You should see either "No bars returned" (expected if KRKNF is still inactive) or "Firing routine..." if bars are available.
3. Repeat for `News Poller — Event Trigger`.

If any validation fails, screenshot the transcript/log and we'll diagnose.

---

## Part 4 — Phased enable (updated for event-driven system)

| When     | Action                                                                                                  |
|----------|---------------------------------------------------------------------------------------------------------|
| Week 1   | All 5 `general / *` scheduled routines enabled. Pollers on `DRY_RUN=true` (observe, don't fire).       |
| Week 2   | Add `news / pre-market-news` + `news / eod`. Set `NEWS_DRY_RUN=false` — pollers start firing.          |
| Week 3   | Add `kraken / pre-market` + `kraken / close-flatten`. Set `INTRADAY_DRY_RUN=false`. All weekly reviews on. |
| Week 4+  | Read every transcript. Tighten prompts and layer-1 filter if needed. **Do not** flip `LIVE_MODE=true`. |

Each scheduled routine stays *created* but its schedule can be **off** — flip one bot at a time.  
GitHub Actions workflows auto-run on the cron once the secrets are set. Disable them via Actions → workflow → disable if you want a full pause.
