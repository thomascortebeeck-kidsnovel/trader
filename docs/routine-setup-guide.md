# Routine Setup Guide

Step-by-step for wiring this repo into Claude Code Routines (claude.ai/code/routines). Do this once per bot, then once per routine inside each bot.

## 1. Push this repo to GitHub

If it isn't already:

```bash
git remote add origin git@github.com:<you>/<repo>.git   # only if not already set
git push -u origin claude/ai-trading-bot-system-magkk
```

You can later merge to `main`. Routines can be pointed at any branch, but `main` is the convention.

## 2. Get your API keys

- **Alpaca paper (x3):** alpaca.markets → sign up → Trading API → copy key + secret. Do this **three times**, once per bot, so each bot has its own paper account and its own P/L. You can use the same email with aliases (e.g. `you+general@gmail.com`, `you+kraken@gmail.com`, `you+news@gmail.com`) if the provider allows. Paper accounts are free and unlimited. Endpoint stays `https://paper-api.alpaca.markets`.
- **Perplexity:** perplexity.ai → settings → API → generate key. One key, shared by all three bots.
- **Finnhub:** finnhub.io → register → dashboard → API key. One key, shared.
- **ClickUp:** clickup.com → settings → Apps → API token. **One task** shared by all three bots — messages are prefixed with `[GENERAL]` / `[KRAKEN]` / `[NEWS]` so the thread stays readable. Get the task ID by opening the task and copying the last segment of the URL (format: `86xxxxx`).

## 3. Create three Claude Code routine environments

In claude.ai/code/routines → Cloud environments → New environment. Make three:

| Environment         | Unique vars (per-bot Alpaca keys)                                      | Shared vars                                                                                                |
|---------------------|-------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| `general`           | `ALPACA_API_KEY` + `ALPACA_SECRET_KEY` = Bot-1's paper account         | `ALPACA_BASE_URL=https://paper-api.alpaca.markets`, `PERPLEXITY_API_KEY`, `FINNHUB_API_KEY`, `CLICKUP_API_KEY`, `CLICKUP_TASK_ID` |
| `day-trader-kraken` | `ALPACA_API_KEY` + `ALPACA_SECRET_KEY` = Bot-2's paper account         | same as above                                                                                              |
| `news-based`        | `ALPACA_API_KEY` + `ALPACA_SECRET_KEY` = Bot-3's paper account         | same as above                                                                                              |

Give each environment full network access (Alpaca trading + data, Finnhub, Perplexity, ClickUp endpoints all need it).

**Sanity-check each environment first** before wiring routines. With the environment active and keys set, run:

```
python scripts/bootstrap.py
```

It hits every API once and fails loud on any missing key. If all four sections print "OK", the environment is ready.

## 4. Create the routines

> **Heads-up: env vars don't live on the routine page.** They live on the **Cloud Environment** (step 3 above). The routine just *picks* an environment from a dropdown. If you're on the routine creation screen looking for an env-var field, you won't find one — go back to **Environments** in the sidebar to set them.

For each `.md` file under `bots/<bot>/routines/`, create one remote routine in claude.ai/code/routines:

1. **New routine** → Remote.
2. **Repo:** point at this GitHub repo.
3. **Branch:** `main` (or `claude/ai-trading-bot-system-magkk` for testing).
4. **Environment:** the matching one from step 3 (this is where your env vars are inherited from).
5. **Model:** `claude-opus-4-7` (1M context).
6. **Prompt:** paste the entire contents of the routine `.md` file.
7. **Cron:** copy the cron expression from the top of the same file. **All times are in America/New_York (ET).** If the routine UI asks for a timezone, pick `America/New_York`. Brussels equivalents are listed in each bot's README for sanity-checking.
8. **Permissions → Allow unrestricted branch pushes:** ON. Routines need to push memory updates back to `main`.
9. Save.

There are 16 routines total (5 + 6 + 5).

## 5. Validate before letting cron take over

For each routine, click **Run now** at least once. Watch the transcript:
- Did it find every env var?
- Did it read the right files?
- Did the API calls return real data?
- Did it commit + push?

Common first-time errors:
- Env var name mismatch — exact letters matter. `ALPACA_API_KEY` not `ALPACA_KEY`.
- Branch push restriction left on — flip the permission and re-run.
- ClickUp task ID wrong format — try a different task or use the one from a task URL.

## 6. Phased rollout

Don't turn on every cron at once. From `PLAN.md`:

| Phase | What's on (cron) | What's off |
|-------|------------------|------------|
| 0     | nothing — manual "Run now" only                                                       | all crons |
| 1     | Bot 1 cron (5 routines), paper                                                        | Bots 2 & 3 |
| 2     | Bot 1 + Bot 3 micro-scan + pre-market-news + EOD                                      | Bot 2; Bot 3 macro |
| 3     | All Bot 3 routines + Bot 2 routines, paper                                            | real money on anything |
| 4     | Per-bot real-money toggle (only after graduation criteria met in that bot's strategy.md) | — |

## 7. Watch the first week of every bot

Read every transcript. Read every reasoning entry it commits. The first week is when prompts get tightened — that's the whole point of paper trading.

## 8. When a routine fails

- Check the transcript for the actual error.
- If it's an env var, fix it in the environment, re-run.
- If it's an API rate limit, throttle the cron (e.g. micro-scan from `*/30` to `*/45`).
- If it's a logic mistake, edit the routine prompt in this repo, push to `main`, and the next scheduled run picks it up automatically.

Never skip the commit + push step at the end of a routine. Routines that don't push lose their memory.
