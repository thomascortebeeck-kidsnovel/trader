# Trading Bot System — Master Plan

A single Claude Code repository hosting **three distinct autonomous trading bots**, each implemented as a set of Claude Code routines + skills + memory files, all running against Alpaca's **paper-trading** account first.

> **Status:** Paper trading only. Real money is an explicit, deliberate toggle per-bot. No live trading until the operator flips `LIVE_MODE=true` in that bot's environment AND removes the paper-only guardrail in `CLAUDE.md`.

---

## 1. Tech Stack (shared across all bots)

| Layer            | Choice                              | Notes                                                                 |
|------------------|-------------------------------------|-----------------------------------------------------------------------|
| Agent runtime    | Claude Code (Opus 4.7, 1M context)  | Same model the AIS video uses; agentic financial analysis specialist  |
| Scheduler        | Claude Code Routines (remote)       | Cron-style triggers, env vars per environment                         |
| Brokerage        | Alpaca (paper API)                  | `https://paper-api.alpaca.markets`                                    |
| Market data      | Alpaca Market Data v2               | Bars, quotes, snapshots                                               |
| News (primary)   | Alpaca News API                     | Free with Alpaca account, ticker-tagged, real-time                    |
| News (secondary) | Finnhub `/news` + `/company-news`   | Adds non-Alpaca-tagged macro coverage                                 |
| Research         | Perplexity API (`sonar-pro`)        | Deep-dive synthesis when news is ambiguous                            |
| Notifications    | ClickUp (task comments)             | Replaceable with Slack/Telegram via the `notify` skill                |
| Storage          | Git (this repo)                     | Markdown memory files; remote routines push back to `main`            |
| Secrets          | Routine environment variables       | Never committed. `env.template` documents the shape                   |

### Why these choices

- **Alpaca News** is free, tagged with tickers, and lives in the same SDK we already use for trades. Fewer moving parts.
- **Finnhub** fills macro gaps (Fed announcements, country-level news) Alpaca's feed doesn't surface.
- **Perplexity** is reserved for *expensive* research (catalyst deep-dives), not every-tick news scanning, to control token cost.
- **ClickUp** matches the AIS reference build; swap it out with one skill change.

---

## 2. Repo Layout

```
trader/
├── PLAN.md                          ← this file
├── README.md                        ← quick-start + operator runbook
├── CLAUDE.md                        ← global agent rulebook (paper-mode default, hard guardrails)
├── env.template                     ← documents every env var any bot expects
├── .gitignore                       ← excludes .env, .venv, __pycache__, etc.
│
├── scripts/                         ← thin Python wrappers, env-var tolerant, no secrets
│   ├── alpaca.py                    ← account / positions / orders / bars / news
│   ├── perplexity.py                ← single-question synthesis
│   ├── finnhub.py                   ← company-news + general-news
│   ├── clickup.py                   ← post comment on a task
│   ├── notify.py                    ← thin dispatcher (currently → clickup.py)
│   ├── bootstrap.py                 ← one-shot: hit every API, fail loud on misconfig
│   ├── risk_check.py                ← deterministic guardrail; used by the trade skill
│   └── news_filter.py               ← hash + dedupe for news items
│
├── skills/                          ← reusable agent capabilities (one folder per skill)
│   ├── research/                    ← web/news synthesis → watchlist
│   ├── trade/                       ← place orders, respects guardrails
│   ├── journal/                     ← append reasoning to memory
│   ├── benchmark/                   ← portfolio vs benchmark snapshot
│   ├── report/                      ← compile EOD summary, send notification
│   ├── news-filter/                 ← rank/dedupe headlines by importance
│   └── risk-check/                  ← pre-trade guardrail validator
│
├── bots/
│   ├── general/                     ← Bot 1 — long/swing, beat-SPY
│   │   ├── README.md
│   │   ├── strategy.md
│   │   ├── memory/
│   │   │   ├── strategy.md
│   │   │   ├── trade-log.md
│   │   │   ├── research-log.md
│   │   │   ├── reasoning.md
│   │   │   └── weekly-review.md
│   │   └── routines/
│   │       ├── pre-market.md        ← 7:00 AM CT  Mon–Fri
│   │       ├── market-open.md       ← 8:30 AM CT  Mon–Fri
│   │       ├── midday.md            ← 11:00 AM CT Mon–Fri
│   │       ├── eod.md               ← 3:00 PM CT  Mon–Fri
│   │       └── weekly-review.md     ← 3:30 PM CT  Fri
│   │
│   ├── day-trader-kraken/           ← Bot 2 — single-name day trader (Kraken Robotics)
│   │   ├── README.md
│   │   ├── strategy.md              ← rules grounded in Aziz / Douglas / VWAP literature
│   │   ├── pattern-research.md      ← KRKNF historical pattern analysis (kept current)
│   │   ├── memory/
│   │   │   ├── trade-log.md
│   │   │   ├── reasoning.md
│   │   │   ├── pattern-cache.md     ← intraday levels, ORB, prior day H/L
│   │   │   └── weekly-review.md
│   │   └── routines/
│   │       ├── pre-market.md        ← 8:15 AM ET  Mon–Fri (gap + level prep)
│   │       ├── opening-range.md     ← 9:45 AM ET  Mon–Fri (15-min ORB scan)
│   │       ├── trend-scan-1.md      ← 10:30 AM ET Mon–Fri
│   │       ├── trend-scan-2.md      ← 1:30 PM ET  Mon–Fri
│   │       ├── close-flatten.md     ← 3:50 PM ET  Mon–Fri (no overnight risk)
│   │       └── weekly-review.md     ← 4:30 PM ET  Fri
│   │
│   └── news-based/                  ← Bot 3 — micro + macro news driven
│       ├── README.md
│       ├── strategy.md
│       ├── watchlist.md             ← tickers we follow for *micro* news
│       ├── macro-themes.md          ← macro themes we react to (Fed, China, energy, AI…)
│       ├── memory/
│       │   ├── trade-log.md
│       │   ├── seen-headlines.md    ← dedupe; URL hashes already acted on
│       │   ├── reasoning.md
│       │   └── weekly-review.md
│       └── routines/
│           ├── micro-scan.md        ← every 30 min during US session, ticker-tagged news
│           ├── macro-scan.md        ← every 60 min during US session, broad market news
│           ├── pre-market-news.md   ← 7:30 AM ET  Mon–Fri (overnight digest)
│           ├── eod.md               ← 4:15 PM ET  Mon–Fri
│           └── weekly-review.md     ← 5:00 PM ET  Fri
│
└── docs/
    ├── day-trading-research.md      ← Bot 2 literature notes (Aziz, Douglas, ORB studies)
    ├── news-source-comparison.md    ← why Alpaca News + Finnhub
    └── routine-setup-guide.md       ← how to wire each routine in claude.ai/code/routines
```

---

## 3. Bot 1 — General Market Bot ("the AIS clone")

**Goal:** Beat SPY total return over rolling 30 / 90 / 365 days using a fundamentals-driven swing strategy. Same shape as the AIS video.

**Universe:** Liquid US large-caps + S&P 500 + ETFs. Avoid options, avoid leverage, avoid sub-$5 stocks.

**Routines:**

| Routine        | Cron (CT)         | Job                                                         |
|----------------|-------------------|-------------------------------------------------------------|
| pre-market     | `0 7  * * 1-5`    | Research catalysts → write today's trade ideas              |
| market-open    | `30 8 * * 1-5`    | Execute planned trades; set 10% trailing stops              |
| midday         | `0 11 * * 1-5`    | Cut −7% losers; tighten stops on winners; rebalance         |
| eod            | `0 15 * * 1-5`    | Snapshot portfolio + SPY; append benchmark; send report     |
| weekly-review  | `30 15 * * 5`     | Compute weekly stats; grade itself; update strategy.md      |

**Guardrails (lives in `bots/general/strategy.md` AND root `CLAUDE.md`):**
- Paper mode default. `LIVE_MODE=true` env var required to send real orders.
- Max position size: **5%** of portfolio.
- Max **3** new positions per week.
- Daily loss cap: **−2%** halts further trading for the day.
- No options, ever. No leverage. No earnings-day entries.
- Every trade requires a written thesis in `reasoning.md`.

---

## 4. Bot 2 — Day-Trading Bot for Kraken Robotics

**The asset.** Kraken Robotics Inc. trades on TSX as `KRKN` and on US OTC as `KRKNF`. Alpaca paper supports OTC tickers but liquidity is thin and bar data may be delayed. We will:
1. **Default to KRKNF** for paper trading on Alpaca.
2. **Validate liquidity each pre-market**; if average 5-min volume < 5k shares we skip the day (logged, not traded).
3. Keep the strategy document broker-agnostic so it ports to Questrade / IBKR for real money on TSX `KRKN`.

**Why a single name?** Day trading rewards *deep* knowledge of one instrument's personality — its typical range, its float behaviour, who pushes it around. The bot becomes a specialist, not a generalist.

### 4.A — Day-trading best practices (from books & research)

Codified into `bots/day-trader-kraken/strategy.md` and reflected in the routine prompts. Sources distilled in `docs/day-trading-research.md`.

| Source                                                  | Rule we adopt                                                              |
|---------------------------------------------------------|----------------------------------------------------------------------------|
| Aziz, *How to Day Trade for a Living*                   | Risk **1%** of equity per trade (not 5%); R/R ≥ **2:1**                    |
| Aziz                                                    | Trade only in the **first 2 hrs** + **last hour**; lunch lull = no entries |
| Aziz                                                    | Patterns: **ABCD**, **Bull Flag**, **VWAP reclaim**, **ORB**, reversal     |
| Douglas, *Trading in the Zone*                          | Pre-defined exit before entry; no discretionary re-anchoring stops          |
| Douglas                                                 | After **3 consecutive losing trades** → stop trading for the day            |
| Douglas / Lefèvre                                       | No revenge trades; routine forces a 30-min cooldown after a loss            |
| ORB literature (Crabel, *Day Trading with Short-Term Price Patterns*) | Use **15-min opening range**; long break above ORH on volume, short below ORL |
| General quant convention                                | Position size from **ATR(14)**: shares = (equity × 0.01) / (1.5 × ATR)     |
| Risk management consensus                               | Daily loss cap **−1.5%**; weekly loss cap **−4%** halts the bot            |

### 4.B — Pattern analysis of KRKNF

`pattern-research.md` is **regenerated weekly** by the weekly-review routine using a `research` skill call to Perplexity + an Alpaca bars query. It captures, for the trailing 90 days:

- Average True Range (ATR-14) on 5-min and daily bars
- Typical opening range size (first 15 min)
- Gap statistics: % of days gapping > 2%; gap-fill rate
- Typical intraday volume profile (which 30-min buckets carry liquidity)
- Volatility regime (range-bound vs trending), classified by ADX
- Relationship to sector ETFs and to Brent crude (Kraken Robotics serves offshore energy + defence)
- Recurring news catalysts (contract awards, earnings dates, defence budgets)

The bot reads this file **before every entry** and refuses trades when current behaviour doesn't match a documented pattern.

**Routines (US Eastern time, since US OTC follows US session):**

| Routine        | Cron (ET)         | Job                                                                |
|----------------|-------------------|--------------------------------------------------------------------|
| pre-market     | `15 8 * * 1-5`    | Read pattern-research; check overnight news; mark levels; go/no-go |
| opening-range  | `45 9 * * 1-5`    | After 15-min ORB forms: enter if break + volume + R/R ≥ 2          |
| trend-scan-1   | `30 10 * * 1-5`   | Manage open trade; trail stop; look for continuation patterns      |
| trend-scan-2   | `30 13 * * 1-5`   | Same, plus reversal-pattern check off afternoon lows/highs         |
| close-flatten  | `50 15 * * 1-5`   | **Force-flatten any open position** by 3:55 PM. No overnights.     |
| weekly-review  | `30 16 * * 5`     | Re-run pattern analysis; compute win-rate, avg-R, expectancy       |

---

## 5. Bot 3 — News-Based Bot (Micro + Macro)

**Goal:** Convert filtered news flow into directional trades, separately for two thesis types.

### 5.A Micro-economics (ticker-tagged news)

- **Inputs:** Alpaca News API filtered by `symbols=` from `watchlist.md`. Polled every 30 min during the US session.
- **Workflow:** ingest → dedupe vs `seen-headlines.md` → pass through `news-filter` skill (importance + sentiment) → keep only items rated ≥ 4/5 importance with non-neutral sentiment → trade decision via `trade` skill.
- **Triggers we act on:** earnings beats/misses, guidance changes, contract awards, M&A, regulatory approvals, analyst upgrades/downgrades from top-tier shops, insider buys.
- **Position size:** 2% of equity, hard-stopped at −5%, take-profit 8% or trailing.

### 5.B Macro-economics (broad-market news)

- **Inputs:** Finnhub `/news?category=general` + `/news?category=forex` + Fed calendar polled hourly.
- **Themes (in `macro-themes.md`):** US rates, China growth, energy supply shocks, AI policy, defence spending, semis export controls, USD index moves.
- **Workflow:** rank by importance → map theme → expected sector reaction (e.g. "China stimulus → long FXI, IYM; short CNY-exposed staples") → execute via sector ETFs only (XLE, XLF, XLK, XLI, IYM, EWZ, FXI, …).
- **Position size:** 3% of equity per macro thesis, max 2 macro positions open at a time.

### News filtering logic (the `news-filter` skill)

1. **Hash dedupe** against `seen-headlines.md` so we don't act twice on the same wire story.
2. **Importance score 1–5** assigned by Claude in the routine itself, with a rubric in the prompt:
   - 5 = market-moving, named catalyst (earnings, M&A, FOMC decision)
   - 4 = directional analyst action from top-tier shop, large contract
   - 3 = sector-wide trend piece
   - 2 = corporate housekeeping
   - 1 = noise / repost
3. **Sentiment direction** (long / short / unclear).
4. **Source tier** (Reuters / Bloomberg / WSJ / FT / company filing > tier-2 outlets > blogs).
5. Only items scoring ≥ 4 from a tier-1 source with clear direction become trades.

**Routines (ET):**

| Routine          | Cron (ET)            | Job                                                            |
|------------------|----------------------|----------------------------------------------------------------|
| pre-market-news  | `30 7 * * 1-5`       | Overnight digest from both feeds; flag tradeable items         |
| micro-scan       | `*/30 9-15 * * 1-5`  | Every 30 min in session: ticker-tagged news for watchlist      |
| macro-scan       | `15 9-15/1 * * 1-5`  | Hourly in session: macro themes + Fed calendar                 |
| eod              | `15 16 * * 1-5`      | Daily report; mark which signals would have worked vs didn't   |
| weekly-review    | `0 17 * * 5`         | Filter calibration: were our 4/5-rated items actually right?   |

### Webhook vs polling — honest answer

The user asked for "api/webhook based logic." The truth:

- Alpaca News supports a **WebSocket stream** (`wss://stream.data.alpaca.markets/v1beta1/news`), not HTTP webhooks.
- Cloud routines are pull-not-push, so a persistent WebSocket inside a routine doesn't fit.
- We get the same signal with **30-minute polling** during the session — small latency cost, much simpler ops.
- If sub-minute latency ever matters, we can stand up a tiny always-on listener (a small VPS or Cloudflare Worker) that POSTs to a ClickUp task; the bot's next poll picks up urgent items first. **Documented, not built**, in `docs/news-source-comparison.md`.

---

## 6. Phased Rollout — "Teaching the bike"

| Phase | Weeks | What's on                                                                                | What's off                              |
|-------|-------|------------------------------------------------------------------------------------------|-----------------------------------------|
| 0     | 1     | Repo built, all routines runnable manually only ("Run now")                              | All cron schedules                      |
| 1     | 2–3   | Bot 1 schedules turn on, **paper money only**                                            | Bot 2, Bot 3 schedules                  |
| 2     | 4–5   | Bot 3 micro schedule turns on, paper                                                     | Bot 2; Bot 3 macro                      |
| 3     | 6–7   | Bot 2 schedule turns on (Kraken), paper. Bot 3 macro turns on, paper                     | Real money on anything                  |
| 4     | 8+    | Per-bot real-money toggle, **only after** ≥ 30 paper-trading days with positive expectancy and a written post-mortem | —                                       |

Real-money flip is **per bot**, never global. Each bot's `strategy.md` documents the criteria its operator must meet before flipping `LIVE_MODE=true`.

---

## 7. Operator Setup Checklist

1. Clone the repo locally.
2. Create paper Alpaca account → copy `ALPACA_API_KEY`, `ALPACA_SECRET_KEY`. Endpoint stays `https://paper-api.alpaca.markets`.
3. Get `PERPLEXITY_API_KEY` from perplexity.ai/settings/api.
4. Get `FINNHUB_API_KEY` from finnhub.io (free tier is enough to start).
5. Get `CLICKUP_API_KEY` + `CLICKUP_TASK_ID` (one task per bot is recommended).
6. In claude.ai/code/routines, create **3 environments** named `general`, `day-trader-kraken`, `news-based`. Set the env vars per environment.
7. For each routine in `bots/<bot>/routines/*.md`: paste the prompt, set the cron, point at this GitHub repo, **enable unrestricted branch pushes**, save.
8. For each routine, click "Run now" once to validate API keys + memory file writes before letting cron take over.
9. Watch the first week of every bot manually. Read every transcript. Tighten guardrails.

Full step-by-step in `docs/routine-setup-guide.md`.

---

## 8. Operator decisions (locked in)

These are the calls the operator has made. They supersede the "recommendations" elsewhere in this file.

1. **Three Alpaca paper accounts, $100k each (Alpaca default).** One per bot. Each bot's routine environment gets its own `ALPACA_API_KEY` / `ALPACA_SECRET_KEY`. This keeps P/L attribution clean — bot 1's wins aren't masked by bot 2's losses. `env.template` documents the shape. Per-bot account sign-ups happen at alpaca.markets (paper accounts are free and unlimited).

2. **One ClickUp task, shared by all three bots.** Messages are prefixed with `[GENERAL]`, `[KRAKEN]`, `[NEWS]` so the single thread stays readable. Simpler setup, one env var pair (`CLICKUP_API_KEY`, `CLICKUP_TASK_ID`) shared across all environments. Setup: in ClickUp, pick one workspace + one List (e.g. "Trading Bot") → create one Task ("Bot Activity Log") → the URL ends with `…/t/86xxxxx` and that string is `CLICKUP_TASK_ID`. Generate `CLICKUP_API_KEY` at Settings → Apps → API.

3. **Day trader starts on KRKNF (US OTC) via Alpaca.** No Questrade / IBKR build for phase 1. The liquidity research in `bots/day-trader-kraken/pattern-research.md` (April 2026 pass) confirms KRKNF's actual avg-daily-volume is ~1.0–1.2M shares with ~$6–8M daily dollar-volume — *substantially* more liquid than the conservative priors in the first scaffold. We can swap in a Canadian broker later without touching strategy logic; `scripts/alpaca.py` is the only file that changes.

4. **News bot macro aggressiveness:** default sizing (3% per thesis, max 2 concurrent) stands. Revisit at the first weekly-review.

5. **Timezone standardized to America/New_York (Eastern Time).** Operator is in Belgium (UTC+1/+2) but the markets and the data feeds run on ET. All routines now use ET cron expressions to make times match what the strategy actually means ("9:30 ET = market open"). Brussels equivalents are documented in each bot's README. The general bot was originally in CT (carryover from the AIS reference build); converted to ET as part of this decision.

6. **Day-trader benchmark = `ITA`** (iShares US Aerospace & Defense). Closer comp for Kraken Robotics' defence + offshore-marine exposure than `XLI` (broad industrials). The benchmark skill default and the day-trader's EOD routine both updated. `XLI` and `XLE` remain as secondary correlations in the weekly pattern audit.

## 9. Still open

- **Real-money graduation criteria** — documented per-bot in each `strategy.md`, but the operator has final sign-off. No bot flips live without explicit approval in `memory/weekly-review.md`.
- **When to add a 4th bot** — if this works, a crypto or options bot could slot in under `bots/`. Not for phase 1.
