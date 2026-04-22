# Testing the event-driven pollers

Two GitHub Actions pollers drive the API-triggered bots:

- `.github/workflows/intraday-poller.yml` → triggers `kraken / intraday-event` routine
- `.github/workflows/news-poller.yml` → triggers `news / news-event` routine

Both run every 5 min during the relevant window and call the Claude Routine
API trigger URL when they detect something actionable. Neither pushes commits
directly — they fire the routine, which then runs and commits from its own
session.

If you've set up the routines but see zero `kraken: intraday ...` or
`news: event-driven ...` commits on main, this doc walks through the three
most common causes in order.

---

## 1. Verify repo secrets are set

Go to **Settings → Secrets and variables → Actions**. All of these must exist
(as secrets, not variables). Missing ones will cause the workflow to fail
silently or error on the very first step.

### Shared
- `FINNHUB_API_KEY`

### For intraday poller
- `KRAKEN_ALPACA_API_KEY`
- `KRAKEN_ALPACA_SECRET_KEY`
- `KRAKEN_ROUTINE_TRIGGER_URL` — copy from `claude.ai/code/routines` → open `kraken / intraday-event` → **Add trigger → API**
- `KRAKEN_ROUTINE_TOKEN` — bearer token shown on the same page

### For news poller
- `NEWS_ALPACA_API_KEY`
- `NEWS_ALPACA_SECRET_KEY`
- `NEWS_ROUTINE_TRIGGER_URL` — same pattern, but on the `news / news-event` routine
- `NEWS_ROUTINE_TOKEN`

### Optional variables (Settings → Secrets and variables → **Variables**)
- `INTRADAY_DRY_RUN` — set to `true` to log events without firing the routine
- `NEWS_DRY_RUN` — same for news
- `NEWS_LOOKBACK_MIN` — minutes of news history per poll (default `10`)

---

## 2. Verify the workflows are running

Go to the **Actions** tab. You should see two entries in the sidebar:

- **Intraday Poller — Kraken Day Trader** — scheduled every 5 min, `13:00-20:59 UTC`, Mon-Fri (= ~09:00-16:59 ET during DST).
- **News Poller — Event Trigger** — scheduled every 5 min, `11:00-20:59 UTC`, Mon-Fri (= ~07:00-16:59 ET during DST).

Symptoms and fixes:

| What you see | Meaning | Fix |
|---|---|---|
| No recent runs at all | Scheduled workflows disabled (60-day inactivity) or crons unparseable | Click the workflow → "Enable workflow" button, or push any trivial commit |
| Runs every 5 min, all green | Pollers healthy, no events to report | Confirm with a dry-run (section 3) |
| Runs every 5 min, all red | Missing/invalid secret or API outage | Open a failed run → inspect step logs |
| Runs only show up outside market hours | Crons are correct but evaluated in UTC — this is fine | — |

---

## 3. Manual dry-run to see what the poller evaluates

Each workflow has `workflow_dispatch` with a `dry_run` input. This is the
fastest way to confirm the logic is healthy without firing a real routine run
(which costs Claude Routines quota).

**How to run:**

1. Actions tab → select **Intraday Poller — Kraken Day Trader** (or News).
2. Click **Run workflow** (top right of the runs list).
3. Set `Dry run (log but do not fire routine)` → `true`.
4. Branch: `main`. Click **Run workflow**.
5. Refresh. The new run appears at the top of the list within a few seconds.
6. Click the run → click the `poll` job → expand **Run intraday poller** (or **Run news poller**).

### What a healthy intraday-poller dry-run looks like

Inside market hours with no active position and no triggering event:

```
Outside market hours (09:12:00 ET). Exiting.
```
— or —
```
Fetched 42 bars. Session high 68.12, low 67.55, VWAP 67.88, latest close 67.92.
No events detected this cycle. Exiting silently.
```

With an event in dry-run:

```
Event detected: OR_COMPLETE
DRY_RUN=true — would have fired routine with:

[OR_COMPLETE] opening range set: high=67.92 low=67.55 width=0.55%
VWAP: $67.88
Position: flat
Check strategy.md for the 3R-target / breakout-retest rules.
```

Key signals you want to see:
- **"Fetched N bars"** — Alpaca creds work, market is open.
- **"No events detected this cycle."** — deterministic logic ran to completion, nothing actionable (this is the normal steady state).
- **"Event detected: ..."** + **"DRY_RUN=true — would have fired routine"** — the detector caught something.

Error signatures and what they mean:

| Output | Cause |
|---|---|
| `KeyError: 'KRAKEN_ALPACA_API_KEY'` | Secret missing in repo settings |
| `HTTP 403` from Alpaca bars | API key lacks the paper-data permission |
| `No bars returned for KRKNF — symbol may be inactive` | KRKNF is OTC and Alpaca's free feed blocks it — non-fatal, poller exits cleanly (this is why today's kraken pre-market said `plan=SKIP, KRKNF inactive on Alpaca paper`) |
| `Outside market hours (09:12 ET). Exiting.` | Fired outside cron window due to `workflow_dispatch` — re-run during 09:30-16:00 ET |
| `ERROR firing routine — HTTP 401` | `KRAKEN_ROUTINE_TOKEN` is wrong or expired |
| `ERROR firing routine — HTTP 404` | `KRAKEN_ROUTINE_TRIGGER_URL` points at a deleted routine |

### What a healthy news-poller dry-run looks like

```
  Alpaca: 3 raw articles
  PASS (micro): Amazon Announces New GLP-1 Initiative Through One Medi...
  Finnhub/general: 12 raw articles
  Finnhub/forex: 4 raw articles
1 item(s) survived layer-1 filter.
DRY_RUN=true — would have fired routine with:

[news-event 2026-04-22T14:12:00Z]
Micro items (watchlist):
  - Amazon Announces New GLP-1 Initiative ...
...
```

Or the silent case:

```
  Alpaca: 0 raw articles
  Finnhub/general: 8 raw articles
  Finnhub/forex: 2 raw articles
No news survived layer-1 filter this cycle. Nothing fired.
```

The watchlist is `bots/news-based/watchlist.md`. If that file is empty or the
tickers don't match today's news, no micro items will pass. Check the file if
surviving = 0 consistently for a full trading day.

---

## 4. Why the pollers legitimately produce nothing

Both pollers are deterministic, narrow filters. On a quiet day it is normal
and correct for them to fire zero routine triggers.

**Intraday (kraken):** zero events means none of these happened:
- Opening range (first 3 bars of session) completed — this fires exactly once per day at ~09:55 ET if KRKNF has tradable bars (it often doesn't on Alpaca's paper feed).
- 5-min close crossed VWAP.
- Single-bar volume > 1.5× session average and > 5,000 shares.
- An open position crossed the 1R or 1.5R unrealised-P/L milestone.

With no open position and KRKNF inactive on the feed, this can sit silent for
a whole session — **not a bug**.

**News:** zero events means no article in the last `NEWS_LOOKBACK_MIN` (default
10 min) matched:
- Source domain in the tier-1 allowlist, AND
- Ticker in `bots/news-based/watchlist.md` OR a broad macro keyword, AND
- Not already fired today (dedup on article ID / hash).

Typical tier-1 tape produces 3-10 qualifying micro items per trading day,
often clustered around pre-market and the 10:00-11:00 ET slot. If a full
trading day passes with zero surviving items, widen the watchlist.

---

## 5. Sanity-test checklist in order

When the API bots don't seem to be firing, run through this in order and stop
at the first "no":

1. Secrets present? → §1
2. Workflows running every 5 min on the schedule, not disabled? → §2
3. Most recent scheduled run green (exit code 0)? If red, read the step log.
4. Dry-run produces "No events detected" cleanly (no tracebacks)? → §3
5. Dry-run produces a "would have fired" output when an event is present? (Hard to force — easiest is to wait for OR_COMPLETE ~09:55 ET.)

If all five pass, the pollers are working as designed and the reason you see
no routine-triggered commits is simply that the filters haven't fired on a
real event yet. Give it a day of live market hours before assuming there's a
bug.
