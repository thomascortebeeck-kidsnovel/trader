# Event-Trigger Migration Plan
# Intraday Trader (Kraken) + News Bot

> Written: 2026-04-22  
> Status: **IMPLEMENTING** — changes being applied on branch `claude/trading-bot-intraday-plan-Km0pn`

---

## 1. Decision recap

| Decision | Choice |
|---|---|
| Kraken bot scope | Ship now (even though KRKNF currently unroutable on Alpaca paper — infrastructure is built, fires when data is available) |
| Daily cap on routine fires | No cap — rely on the layer-1 filter in the poller |
| Old scheduled kraken routines | Delete `opening-range.md`, `trend-scan-1.md`, `trend-scan-2.md` |
| Old scheduled news routines | Delete `micro-scan.md`, `macro-scan.md` |
| Trigger mechanism | GitHub Actions (every 5 min) → deterministic filter → POST to Routine API trigger |
| News architecture | Two-layer filter: layer-1 in poller (deterministic, free), layer-2 in routine (LLM, only when layer-1 passes) |

---

## 2. Before vs after

### Before — pure hourly cron polling

```
Every hour on the clock
       │
  Claude Routine wakes up
       │
  Reads ALL news / ALL bars
       │
  Decides (often: nothing to do)
       │
  Commits reasoning, exits
```

Problem: routine fires 7–8× per day per bot regardless of whether anything actionable happened. Wastes tokens and takes 15–30 min to detect a catalyst that broke 55 minutes ago.

### After — event-driven (what this plan implements)

```
GitHub Actions (every 5 min, market hours)
       │
  Poller script runs (< 2 seconds, no LLM cost)
       │
  Layer-1 filter (deterministic):
    • Kraken: new bar data? volume spike? VWAP cross? OR complete?
    • News:   new article? watchlist ticker? tier-1 source domain?
       │
  ┌────┴────┐
 NO       YES
  │         │
  Exit   POST to Routine API trigger
  (0 tokens)   (routine fires within ~15 seconds)
                 │
            Claude Routine (full LLM, pattern recognition, trade decision)
```

Benefit: routine fires only when something worth evaluating has happened. On a quiet day with no news and no setups, the routine may fire zero times. On a breaking-news day it fires multiple times, each carrying only the relevant context.

---

## 3. Architecture

### 3.1 Kraken intraday system

```
┌──────────────────────────────────────────────────────┐
│  GitHub Actions: intraday-poller.yml                 │
│  Cron: */5 13-20 * * 1-5  (09:00-16:59 ET, weekdays)│
│                                                      │
│  scripts/intraday_poller.py                          │
│  ├─ GET /v2/stocks/KRKNF/bars (5Min, last 30 bars)   │
│  ├─ GET /v2/account (for position P/L)               │
│  ├─ Detect events (VWAP cross, volume spike, OR set) │
│  ├─ Load /tmp/kraken_poller_state.json (from cache)  │
│  ├─ Skip events already fired today                  │
│  └─ If new event: POST to KRAKEN_ROUTINE_TRIGGER_URL │
│       body: {event_type, bars, computed indicators}  │
└──────────────────────────────────────────────────────┘
                              │
                    fires via API trigger
                              │
┌──────────────────────────────────────────────────────┐
│  Claude Routine: kraken / intraday-event             │
│  Environment: day-trader-kraken                      │
│                                                      │
│  Reads memory files (strategy, pattern-cache,        │
│  trade-log, reasoning)                               │
│  Evaluates event against allowed patterns            │
│  Places / manages trade if conditions met            │
│  Commits reasoning.md + trade-log.md + pattern-cache │
└──────────────────────────────────────────────────────┘
```

**Scheduled routines kept as-is (pre-market, close-flatten, weekly-review):**

| Routine | Role | Cron (ET) | Changes |
|---|---|---|---|
| `pre-market.md` | Daily plan, writes pattern-cache.md | `15 8 * * 1-5` | None |
| `close-flatten.md` | Force-flat at 15:55 ET | `50 15 * * 1-5` | None |
| `weekly-review.md` | Stats + pattern refresh | `30 16 * * 5` | None |

**New event-driven routine:**

| Routine | Role | Trigger |
|---|---|---|
| `intraday-event.md` | Evaluate event, trade or pass | API (from poller) |

**Deleted (replaced by poller + intraday-event.md):**
- `opening-range.md`
- `trend-scan-1.md`
- `trend-scan-2.md`

### 3.2 News event system

```
┌──────────────────────────────────────────────────────┐
│  GitHub Actions: news-poller.yml                     │
│  Cron: */5 11-20 * * 1-5  (07:00-16:59 ET, weekdays)│
│                                                      │
│  scripts/news_poller.py                              │
│                                                      │
│  MICRO stream (Alpaca News):                         │
│  ├─ GET /v1beta1/news?symbols=<watchlist>&limit=50   │
│  ├─ Layer-1: domain in TIER1_DOMAINS?                │
│  ├─ Layer-1: symbol in watchlist?                    │
│  ├─ Layer-1: article ID not in today's fired set?    │
│  └─ Surviving items → batch into one POST            │
│                                                      │
│  MACRO stream (Finnhub):                             │
│  ├─ GET /api/v1/news?category=general                │
│  ├─ GET /api/v1/news?category=forex                  │
│  ├─ Layer-1: source domain in TIER1_DOMAINS?         │
│  ├─ Layer-1: broad macro keywords present?           │
│  └─ Surviving items → batched with MICRO items       │
│                                                      │
│  If any items survive: POST to NEWS_ROUTINE_TRIGGER  │
│  State: /tmp/news_poller_state.json (GitHub cache)   │
└──────────────────────────────────────────────────────┘
                              │
                    fires via API trigger
                              │
┌──────────────────────────────────────────────────────┐
│  Claude Routine: news / news-event                   │
│  Environment: news-based                             │
│                                                      │
│  Receives event payload (pre-filtered article list)  │
│  Runs news-filter skill (layer-2: importance, dir.)  │
│  Checks daily halt, position count, seen-headlines   │
│  Places trades for qualifying items                  │
│  Updates seen-headlines.md, trade-log.md, reasoning  │
│  Commits + pushes                                    │
└──────────────────────────────────────────────────────┘
```

**Scheduled news routines kept as-is:**

| Routine | Role | Cron (ET) | Changes |
|---|---|---|---|
| `pre-market-news.md` | Morning briefing, suppressions | `30 7 * * 1-5` | None |
| `eod.md` | Evening review | `15 16 * * 1-5` | None |
| `weekly-review.md` | Stats + filter calibration | `0 17 * * 5` | None |

**New event-driven routine:**

| Routine | Role | Trigger |
|---|---|---|
| `news-event.md` | Layer-2 score + trade decision | API (from poller) |

**Deleted (replaced by poller + news-event.md):**
- `micro-scan.md`
- `macro-scan.md`

---

## 4. Layer-1 filter logic (deterministic, in poller scripts)

### 4.1 Kraken intraday events

The poller detects these events. Each has a cooldown to prevent duplicate fires.

| Event type | Condition | Cooldown |
|---|---|---|
| `OR_COMPLETE` | Time is 09:45–09:55 ET AND at least 3 5-min bars exist since 09:30 | Once per day |
| `VWAP_CROSSOVER_LONG` | Last bar closed above VWAP AND previous bar closed below | 30 min |
| `VWAP_CROSSOVER_SHORT` | Last bar closed below VWAP AND previous bar closed above | 30 min |
| `VOLUME_SPIKE` | Last bar volume > 1.5× session avg 5-min volume AND > 5,000 shares | 15 min |
| `POSITION_MILESTONE` | Open KRKNF position unrealized P/L ≥ 1R (entry stop distance) | Once per milestone |

The poller does NOT detect patterns (flags, ORB break, VWAP reclaim trade) — that's the LLM's job. The poller only fires a signal saying "something potentially interesting happened; you should look at the tape."

If KRKNF returns no bars (current state — OTC feed 403), the poller logs a warning and exits silently. Zero routine fires. Zero token spend.

### 4.2 News layer-1 filter

**Tier-1 domains (deterministic match):**
```
reuters.com, wsj.com, ft.com, apnews.com, bloomberg.com,
sec.gov, federalreserve.gov, bls.gov, bea.gov, fdic.gov
```

**Macro keywords (broad, intentionally wide — LLM does fine-grained):**
```
Fed, FOMC, inflation, CPI, NFP, GDP, OPEC, rate cut, rate hike,
tariff, sanctions, earnings, guidance, M&A, acquisition, merger,
bankruptcy, buyout, recall, FDA, SEC enforcement
```

**Deduplication:** each article ID (Alpaca) or URL hash (Finnhub) is tracked in the poller's daily state file. An article is only included in a POST once per day.

**Batching:** all items that pass layer-1 in a single 5-min poll cycle are batched into one POST. This keeps routine fires to a minimum even on busy news days.

---

## 5. Files changed by this plan

### Created

| File | Purpose |
|---|---|
| `docs/EVENT-TRIGGER-PLAN.md` | This document |
| `scripts/intraday_poller.py` | Kraken event detector |
| `scripts/news_poller.py` | News event detector |
| `.github/workflows/intraday-poller.yml` | 5-min GitHub Actions runner |
| `.github/workflows/news-poller.yml` | 5-min GitHub Actions runner |
| `bots/day-trader-kraken/routines/intraday-event.md` | New event-driven routine prompt |
| `bots/news-based/routines/news-event.md` | New event-driven routine prompt |

### Deleted

| File | Replaced by |
|---|---|
| `bots/day-trader-kraken/routines/opening-range.md` | `intraday-event.md` + poller |
| `bots/day-trader-kraken/routines/trend-scan-1.md` | `intraday-event.md` + poller |
| `bots/day-trader-kraken/routines/trend-scan-2.md` | `intraday-event.md` + poller |
| `bots/news-based/routines/micro-scan.md` | `news-event.md` + poller |
| `bots/news-based/routines/macro-scan.md` | `news-event.md` + poller |

### Updated

| File | Change |
|---|---|
| `docs/SETUP.md` | Routine table updated (16 → 13 routines), new API trigger setup section |

---

## 6. What YOU must do (operator tasks)

Estimated total: **~30 minutes**, split across 2 sessions (before and after the PR merges).

### Session A — before enabling (do once, any time after the PR merges to main)

**Step 1: Add GitHub repo secrets** (~10 minutes)

Go to: GitHub → `thomascortebeeck-kidsnovel/trader` → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

| Secret name | Value | Where to get it |
|---|---|---|
| `KRAKEN_ALPACA_API_KEY` | Alpaca paper key for bot 2 | alpaca.markets → Trading API |
| `KRAKEN_ALPACA_SECRET_KEY` | Alpaca paper secret for bot 2 | same |
| `NEWS_ALPACA_API_KEY` | Alpaca paper key for bot 3 | alpaca.markets → Trading API |
| `NEWS_ALPACA_SECRET_KEY` | Alpaca paper secret for bot 3 | same |
| `FINNHUB_API_KEY` | Finnhub API key (shared) | finnhub.io → dashboard |
| `KRAKEN_ROUTINE_TRIGGER_URL` | API trigger URL for kraken/intraday-event | See Step 2 |
| `KRAKEN_ROUTINE_TOKEN` | Bearer token for same | See Step 2 |
| `NEWS_ROUTINE_TRIGGER_URL` | API trigger URL for news/news-event | See Step 3 |
| `NEWS_ROUTINE_TOKEN` | Bearer token for same | See Step 3 |

Note: `KRAKEN_ALPACA_API_KEY` and `NEWS_ALPACA_API_KEY` may already exist if you set them up earlier for the routine environments. In that case just confirm the names match exactly.

---

**Step 2: Create the `kraken / intraday-event` routine + get API trigger** (~5 minutes)

In claude.ai/code → Routines → New routine:

- **Name:** `kraken / intraday-event`
- **Environment:** `day-trader-kraken`
- **Model:** `Opus 4.7 1M`
- **Trigger:** click **Add trigger → API** (NOT Schedule)
- **Permissions:** Allow unrestricted branch pushes = ON
- **Prompt:** paste the entire contents of `bots/day-trader-kraken/routines/intraday-event.md`

After saving, click the API trigger to expand it. You will see:
- A trigger URL like `https://api.anthropic.com/v1/claude_code/routines/trig_XXXXXX/fire`
- A bearer token (shown once — copy it now)

Copy the trigger URL → paste as GitHub secret `KRAKEN_ROUTINE_TRIGGER_URL`  
Copy the bearer token → paste as GitHub secret `KRAKEN_ROUTINE_TOKEN`

---

**Step 3: Create the `news / news-event` routine + get API trigger** (~5 minutes)

Same process as Step 2, but:

- **Name:** `news / news-event`
- **Environment:** `news-based`
- **Prompt:** paste `bots/news-based/routines/news-event.md`

Copy trigger URL → `NEWS_ROUTINE_TRIGGER_URL`  
Copy bearer token → `NEWS_ROUTINE_TOKEN`

---

**Step 4: Delete the old routines in claude.ai/code** (~5 minutes)

Delete these 5 routines from claude.ai/code (their schedules will keep firing otherwise):

- `kraken / opening-range`
- `kraken / trend-scan-1`
- `kraken / trend-scan-2`
- `news / micro-scan`
- `news / macro-scan`

If you haven't created them yet, skip this step.

---

**Step 5: Enable the GitHub Actions workflows** (~2 minutes)

Go to: GitHub → Actions tab. You should see two new workflows:
- `Intraday Poller — Kraken Day Trader`
- `News Poller — Event Trigger`

Both are on by default but will fail if the secrets aren't set yet. Complete Steps 1-3 first.

To test immediately without waiting for cron: click **Run workflow** on each.

---

**Step 6: Validate** (~5 minutes)

Run each workflow manually (Actions → workflow → Run workflow). In the log you should see one of:
- `No bars returned for KRKNF — symbol may be inactive. Skipping.` (kraken — expected until data issue resolved)
- `No news survived layer-1 filter this cycle. Nothing fired.` (news — expected on a quiet moment)
- `Firing routine for event: OR_COMPLETE` (kraken — if timed during market hours with live data)
- `Firing routine: 2 news items survived filter.` (news — if articles are available)

Any error mentioning a missing secret means a secret name mismatch — check the exact spelling against the table in Step 1.

---

### Session B — optional future upgrade (when ready for real-time)

Currently the pollers run every 5 minutes via GitHub Actions. This is adequate for fundamental catalyst trading. If you need sub-minute reaction (e.g., trading earnings first-minute moves), the upgrade path is:

1. Deploy a Cloud Run container running `scripts/news_poller.py --streaming` with `wss://stream.data.alpaca.markets/v1beta1/news` subscribed.
2. Same POST logic to the routine trigger URL — but now firing within seconds of a headline.
3. Keep GitHub Actions as the fallback/healthcheck.

This is documented here but not built. Come back to it after 30 paper sessions.

---

## 7. Cost analysis

### GitHub Actions cost
- 2 workflows × (6.5 trading hours × 12 runs/hour) × 20 trading days = **3,120 workflow runs/month**
- Each run takes ~5 seconds
- GitHub free tier: 2,000 minutes/month on public repos (unlimited on public). Private: 2,000 min/month free.
- 3,120 runs × 5 sec = ~260 minutes/month → within the free tier

### Claude Routine fires
- Kraken: 0 fires on no-setup days; ~2–5 on active days. Target: ≤ 10/week.
- News: highly variable. With layer-1 filter, tier-1 sources on watchlist tickers break ~2–8 times per day.
- Each fire is one Claude Code session — counts against your subscription plan.
- No additional API charges (Routines are subscription, not metered).

### Alpaca data cost
- Intraday poller: ~78 REST calls/day (5-min, 6.5 hours) — well within free tier (200 req/min).
- News poller: ~78 calls/day Alpaca + ~156 Finnhub calls/day — Finnhub free tier is 60/min.

---

## 8. Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| KRKNF still unroutable → poller fires zero | High (current state) | Poller exits gracefully. No cost, no noise. Resolve the Alpaca OTC data issue or switch to TSX `KRKN` via a Canadian broker. |
| News poller fires too many routines on a volatile news day | Medium | Layer-1 filter is conservative (tier-1 domain + watchlist only). Routine is the safety net (importance ≥ 4 cutoff in layer-2). No daily cap was set by operator decision — monitor first week and add cap if needed. |
| GitHub Actions clock drift vs ET timezone | Low | Poller script checks current time in ET before acting; if outside 09:30–16:00 ET, exits. The cron is just the outer fence. |
| API trigger URL expires or is rotated | Low | If routine fires fail, check claude.ai/code → routine → triggers. Regenerate token, update GitHub secret. |
| Poller state cache miss → double-fire | Low | Routine prompts are written to be idempotent: they check pattern-cache.md and trade-log.md before acting. A double-fire costs tokens but doesn't double-trade. |
| Finnhub free tier rate limit (60/min) | Very low | Poller makes 2 Finnhub calls per 5-min run. Max rate: 0.007 calls/sec. Zero risk. |
| GitHub Actions disabled on repo | Low | Would stop the pollers. Would NOT stop the 3 remaining scheduled routines (pre-market, close-flatten, weekly-review for kraken; pre-market-news, eod, weekly-review for news). You'd just lose intraday reactivity. |

---

## 9. Routine count change

| | Before | After |
|---|---|---|
| Kraken routines | 6 (pre-market, OR, trend-1, trend-2, flatten, weekly) | 4 (pre-market, intraday-event, flatten, weekly) |
| News routines | 5 (pre-market, micro, macro, eod, weekly) | 4 (pre-market, news-event, eod, weekly) |
| General routines | 5 | 5 (unchanged) |
| **Total** | **16** | **13** |

The 13 routines break down as:
- 5 scheduled + 0 API-triggered (general)
- 3 scheduled + 1 API-triggered (kraken)
- 3 scheduled + 1 API-triggered (news)

---

## 10. Phased enablement (updated)

| Phase | Action |
|---|---|
| Now | PR merged to main, workflow files live in repo |
| Week 1 | Complete Steps 1–6 above. Run pollers manually to test. Observe logs. |
| Week 2 | Enable the 5-min cron schedules on both pollers. Monitor for stray fires. |
| Week 3+ | Read every routine transcript that fires. Tighten layer-1 filter or layer-2 prompt if fires are low quality. |
| Future | Move to streaming WebSocket for news (Session B above). |
