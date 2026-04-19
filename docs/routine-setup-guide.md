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

- **Alpaca paper:** alpaca.markets → sign up → Trading API → copy key + secret. Endpoint stays `https://paper-api.alpaca.markets`.
- **Perplexity:** perplexity.ai → settings → API → generate key.
- **Finnhub:** finnhub.io → register → dashboard → API key.
- **ClickUp:** clickup.com → settings → Apps → API token. Get a task ID by opening any task and copying the digits/letters at the end of the URL (or use the format `86xxxxx`). Recommend one ClickUp task per bot for clean notification threading.

## 3. Create three Claude Code routine environments

In claude.ai/code/routines → Cloud environments → New environment. Make three:

| Environment name      | Env vars to set                                                                                              |
|-----------------------|--------------------------------------------------------------------------------------------------------------|
| `general`             | `ALPACA_API_KEY`, `ALPACA_SECRET_KEY`, `ALPACA_BASE_URL=https://paper-api.alpaca.markets`, `PERPLEXITY_API_KEY`, `FINNHUB_API_KEY`, `CLICKUP_API_KEY`, `CLICKUP_TASK_ID` |
| `day-trader-kraken`   | same as `general`                                                                                            |
| `news-based`          | same as `general`                                                                                            |

If you want per-bot Alpaca paper accounts (recommended for clean P/L attribution), generate three Alpaca paper accounts and use one set of keys per environment.

Give each environment full network access (Alpaca, Finnhub, Perplexity, ClickUp endpoints all need it).

## 4. Create the routines

For each `.md` file under `bots/<bot>/routines/`, create one remote routine in claude.ai/code/routines:

1. **New routine** → Remote.
2. **Repo:** point at this GitHub repo.
3. **Branch:** `main` (or `claude/ai-trading-bot-system-magkk` for testing).
4. **Environment:** the matching one from step 3.
5. **Model:** `claude-opus-4-7` (1M context).
6. **Prompt:** paste the entire contents of the routine `.md` file.
7. **Cron:** copy the cron expression from the top of the same file.
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
