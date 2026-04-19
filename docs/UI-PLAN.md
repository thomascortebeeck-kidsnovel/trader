# UI Plan — Trader Dashboard

A companion web app that visualizes what the three bots are doing. **Read-only** at first — the bots still decide and trade via routines; the UI just *shows* the operator what happened and what's open.

> Scope is deliberately phased. MVP is one page that renders in a weekend. V2 and V3 are explicit roadmaps, not day-1 commitments.

---

## 1. Why a UI at all

- **Phone-first situational awareness.** Right now the only surface is ClickUp comments + markdown commits. That's fine for daily EOD reports but not for "check in mid-morning to see if kraken went long."
- **Trade-review discipline.** The week-in-review skill relies on the operator actually reading the weekly summary. A UI with equity curves + trade markers makes this 30 seconds instead of 30 minutes.
- **Catch bugs fast.** Routine that silently stopped pushing? The bot's last-run timestamp goes stale on the UI immediately.

---

## 2. Principles

1. **Read-only.** The UI never places or cancels orders. The bots are authoritative. No action buttons that touch money.
2. **Mobile-first.** Operator is in Belgium, often not at a desk. Every screen usable on a phone.
3. **No backend we have to run.** Prefer a static site + browser-side API calls. Alpaca CORS allows direct calls from a browser with API keys — *paper* is fine, but see §6 on the live-mode risk.
4. **Git is the source of truth for memory.** Equity history, trade log, reasoning all live in the repo. The UI fetches the files and renders them. Alpaca provides live state (positions, current equity). The two complement: Git = history, Alpaca = now.
5. **Three bots, not one.** Every view segregates by bot so we can compare them.

---

## 3. Data sources

| Data                              | Source                                                     | Fetch cadence              |
|-----------------------------------|------------------------------------------------------------|----------------------------|
| Current equity per bot            | Alpaca REST (`/v2/account`) x 3 accounts                   | on page load + 60s polling |
| Open positions per bot            | Alpaca REST (`/v2/positions`)                              | on page load + 60s polling |
| Today's open orders               | Alpaca REST (`/v2/orders?status=open`)                     | on page load + 60s polling |
| Intraday price bars               | Alpaca Data REST (`/v2/stocks/{sym}/bars?timeframe=5Min`) | on-demand per chart         |
| Equity history / vs-benchmark     | Git: parse `bots/*/memory/benchmark.md`                    | on page load                |
| Trade history                     | Git: parse `bots/*/memory/trade-log.md`                    | on page load                |
| Reasoning journal                 | Git: `bots/*/memory/reasoning.md` (render last N entries)  | on page load                |
| Pattern-research snapshot         | Git: `bots/day-trader-kraken/pattern-research.md`          | on page load                |
| Routine last-run + success        | GitHub commits API (filter by author = Claude routines)    | on page load                |
| News micro + macro hits           | Git: `bots/news-based/memory/seen-headlines.md` + reasoning | on page load               |

**Authentication:** the browser holds Alpaca keys (paper-mode only) in `localStorage`. No server stores them. GitHub is public read — no auth needed to read the repo once it's public, or a personal-access token for private.

---

## 4. Screens

### 4.1 Dashboard (landing page)

Single-scroll mobile layout, three cards stacked (one per bot):

```
┌─────────────────────────────────────────────┐
│  GENERAL                 equity $101,234    │
│  ├─ today  +0.42%  ├─ vs SPY  +0.11%        │
│  ├─ open positions: 7                        │
│  ├─ last routine: general/eod, 16:02 ET ✓   │
│  └─ [sparkline: 30d equity curve]           │
├─────────────────────────────────────────────┤
│  DAY-TRADER KRKNF        equity $100,870    │
│  ├─ today  +0.87%  ├─ vs ITA  +0.40%        │
│  ├─ plan today: TRADE                        │
│  ├─ open trade: LONG 770@$6.51, stop $6.43  │
│  └─ [sparkline: 5d equity curve]            │
├─────────────────────────────────────────────┤
│  NEWS                    equity  $99,450    │
│  ├─ today  −0.55%                            │
│  ├─ micro positions: 2, macro: 1             │
│  ├─ headlines today: 4 qualifying / 312 seen│
│  └─ [sparkline: 30d equity curve]           │
└─────────────────────────────────────────────┘
```

Each card is tappable → drills into the per-bot view.

**Header bar:** combined equity across all 3, combined vs SPY, last-global-refresh timestamp.

### 4.2 Per-bot detail view

Tabs: **Overview / Positions / Trades / Reasoning / Routine health** (+ Pattern for day-trader, News feed for news bot)

**Overview:**
- Equity curve chart (90 days) overlaid with benchmark line.
- Cumulative return vs benchmark (big number).
- Win rate, avg R, expectancy — computed from `trade-log.md`.
- Drawdown chart.

**Positions:**
- Table of open holdings: symbol, qty, avg cost, current, unrealized P/L %, stop level (if we know it).
- Each row tappable → mini candlestick chart with entry marker + stop line.

**Trades:**
- Sortable table: timestamp, symbol, side, qty, price, pattern (day-trader), importance score (news), thesis (≤ 20 chars summary).
- Filter chips: last 7d / 30d / all; winners / losers.
- Tap row → expand with full thesis + the reasoning entry that justified it + the exit if closed.

**Reasoning:**
- Timeline of `reasoning.md` entries. Most recent first. Each dated block rendered nicely.
- Search box (simple substring match across all entries).

**Routine health:**
- For each routine attached to this bot: last run time, success/fail icon, next scheduled time.
- Hover / tap → see the commit the run produced.

**Pattern (day-trader only):**
- Render `pattern-research.md` as formatted markdown.
- Below it: per-pattern expectancy table (ORB / VWAP-reclaim / flag / ABCD) pulled from trade log.
- Regime classification badge at top: `chop` / `trending` / `range`.

**News feed (news bot only):**
- Stream of recent qualifying headlines (importance ≥ 4, tier-1, direction tagged).
- Tap → see what the bot did with it (traded? skipped? why?).

### 4.3 Global: compare view

Optional screen. Line chart with 4 series: bot 1 equity / bot 2 equity / bot 3 equity / SPY. Same y-scale, normalized to 100 at start.

### 4.4 Global: live tape

Optional screen. Pulls Alpaca's latest trades for every symbol in all three bots' open positions. Helps the operator watch the day without the Alpaca app open.

---

## 5. Tech stack recommendation

### Option A — **simplest, MVP-fastest** (recommended for phase 1)

- **Next.js** (App Router) or **Astro**, deployed to **Cloudflare Pages** or **Vercel** (both free tiers).
- **Recharts** or **lightweight-charts** (from TradingView, free) for plots.
- **Tailwind CSS** for layout.
- **GitHub API** (REST) to fetch markdown memory files, parsed client-side.
- **Alpaca REST** called directly from the browser. Paper keys pasted into the app once (stored in `localStorage`).
- **No backend.** Everything runs in the browser.

**Time to ship MVP:** ~1–2 days of focused work, less if Claude writes most of it.

### Option B — adds live-ness

- Same frontend, plus a tiny **Cloudflare Worker** backend that:
  - Polls Alpaca News WebSocket and pushes to the client.
  - Caches parsed markdown to reduce GitHub API calls.
- Enables a real "live tape" and reduces GitHub rate-limit risk.

**Time to ship:** +1 day after MVP.

### Option C — full-platform

- Adds **authentication** (Clerk / Auth0 free tier) so a partner could share the dashboard read-only.
- Adds **alerts** (web-push notifications when a stop hits or a position goes > −3%).
- Adds a **"what-if" backtester** — re-run the decision logic against historical bars.

**Time to ship:** +1 week after Option B. Skip until MVP is proven useful.

---

## 6. Security model

The dashboard holds **Alpaca paper API keys** in the browser. Paper keys can only access paper accounts and paper money — rotating them is free and instant. Acceptable risk for MVP.

**Before wiring live keys** (which we're not doing for months):
- Move Alpaca calls behind a backend that holds the keys server-side.
- Require auth on the dashboard itself.
- Never store live keys in `localStorage`.

The dashboard never writes to Alpaca — no order placement, no cancels. Even if a key leaks, the worst case is read-only account access + someone seeing paper P/L.

---

## 7. Repo layout (where the app would live)

```
trader/
├── ... (existing bot code)
└── ui/                              ← the app
    ├── package.json
    ├── next.config.js (or astro.config.mjs)
    ├── app/
    │   ├── page.tsx                 ← dashboard
    │   ├── [bot]/page.tsx           ← per-bot detail
    │   └── compare/page.tsx         ← optional compare view
    ├── components/
    │   ├── EquityCurve.tsx
    │   ├── PositionsTable.tsx
    │   ├── TradesTable.tsx
    │   ├── ReasoningTimeline.tsx
    │   └── RoutineHealth.tsx
    ├── lib/
    │   ├── alpaca.ts                ← browser-side Alpaca client
    │   ├── github.ts                ← GitHub raw-file fetcher
    │   └── parsers/
    │       ├── trade-log.ts
    │       ├── benchmark.ts
    │       └── reasoning.ts
    └── public/
        └── favicon.ico
```

Deploy: `cd ui && npx vercel` (or equivalent). Point a subdomain at it.

---

## 8. MVP feature list (ship this first)

Just enough to be useful on a phone during a trading session:

1. Dashboard (§4.1) with 3 bot cards. No drilldown yet — just sparklines.
2. Per-bot **Overview** tab with 90-day equity curve + benchmark.
3. Per-bot **Positions** tab with the open holdings table.
4. Per-bot **Trades** tab as a plain sortable table (last 30 days).
5. Routine health strip on the dashboard — "last run: NN min ago" per routine.

Not in MVP: reasoning timeline, news feed, pattern view, compare view, live tape, auth, alerts. Those land in v2.

---

## 9. Open questions for the operator

Before we start coding the UI, pick one from each:

1. **Host:** Cloudflare Pages (my default — fastest + free + good for static sites) or Vercel?
2. **Domain:** subdomain of something you own, or use the `.vercel.app` / `.pages.dev` free subdomain?
3. **Public or gated:** is the dashboard just for you, or do you want to share it? MVP = just you, no auth. V3 = auth.
4. **Next.js or Astro:** Next.js has more ecosystem and works for V3 auth easily. Astro is simpler for a static dashboard. I'd default to Next.js.
5. **Charting library:** Recharts (simple, React-native feel) or `lightweight-charts` (TradingView's lib, looks pro). I'd default to Recharts for MVP, upgrade to lightweight-charts if we care about candle charts.

---

## 10. Phasing summary

| Phase | What ships                                    | Time estimate (Claude-assisted) |
|-------|-----------------------------------------------|---------------------------------|
| UI-0  | This plan, discussed and approved             | today                           |
| UI-1  | MVP (§8) — dashboard + 3 bot detail tabs      | 1–2 evenings                    |
| UI-2  | Reasoning timeline, news feed, pattern view   | +1 evening                      |
| UI-3  | Compare view, live tape                       | +1 evening                      |
| UI-4  | Auth, alerts, mobile-push                     | +1 week                         |

We do **not** start UI-1 until at least one week of the bots is running and committing memory — otherwise we're building a dashboard for empty tables. Earliest practical start: ~end of Week 1 of bot operation.

---

## 11. Anti-scope (explicit non-goals)

- **No order placement from the UI.** Ever. The bots are the authority; the UI observes.
- **No multi-user tenancy.** One operator.
- **No mobile app** (native iOS/Android). Responsive web is enough.
- **No paid data feeds.** Stick to Alpaca + GitHub.
- **No attempt to outperform TradingView at TradingView's job.** We're not a charting platform; we're a bot-activity monitor that happens to show charts.
