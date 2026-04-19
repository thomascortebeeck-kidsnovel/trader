# Mobile Walkthrough — first environment + first routine

Hand-holding for the very first setup on a phone. Once you've done one environment and one routine, the other 2 environments + 15 routines are pattern-matching.

**Skip the Anthropic API entirely.** Everything below is UI only.

**Total time, mobile:** ~2 hours first-time. After that, ongoing monitoring is a minute a day.

---

## Block 1 — Gather everything before you touch claude.ai (15 min)

Open these tabs in your phone browser (keep them open — you'll switch between them):

1. `alpaca.markets` → sign in (or sign up 3 times; paper accounts are free).
2. `perplexity.ai/settings/api`
3. `finnhub.io/dashboard`
4. `clickup.com` (stay logged in)
5. `github.com/thomascortebeeck-kidsnovel/trader/tree/claude/ai-trading-bot-system-magkk` → this repo, branch picker already on the feature branch.
6. `claude.ai/code` → the main Claude Code home (we'll come here last).

### Collect these values into your phone's **Notes app** (or Keep):

```
ALPACA_KEY_1 =
ALPACA_SEC_1 =
ALPACA_KEY_2 =
ALPACA_SEC_2 =
ALPACA_KEY_3 =
ALPACA_SEC_3 =
PERPLEXITY =
FINNHUB =
CLICKUP_API =
CLICKUP_TASK_ID = 869cyx7a5   (already known)
```

**How to get each:**

- **Alpaca paper keys (x3):** alpaca.markets → your account → **Paper Trading** section → Generate API Keys → copy Key + Secret into your notes. Do this 3 times (once per bot). If Alpaca only gives you one paper account, use email aliases like `you+general@gmail.com` / `you+kraken@gmail.com` / `you+news@gmail.com` for accounts 2 and 3.
- **Perplexity:** perplexity.ai → Settings → API → Generate new key → copy.
- **Finnhub:** finnhub.io → sign in → Dashboard → API key is shown on the main page → copy.
- **ClickUp:** clickup.com → your avatar → Settings → **Apps → API** → Generate → copy the token that starts with `pk_`.

Paste all 10 values into your notes. **Don't paste them into any chat** — not even this one.

Once your notes file has all 10 values filled in, move to Block 2.

---

## Block 2 — Create environment #1 only (10 min)

Goal: do the `general` environment end-to-end. Once you've done one, the other two are copy-paste.

### Open claude.ai/code on mobile

1. Go to **claude.ai/code**.
2. Look for **"Environments"** in the sidebar menu (may be called "Cloud environments"). On iOS Safari the menu is a hamburger ☰ top-left.
3. Tap **+ New environment**.

### Fill in the modal (top to bottom)

- **Name:** type `general`
- **Description (optional):** `Trading bot — general/swing, beat-SPY`
- **Network:** leave at `Trusted`
- **Environment variables:** tap into the text area, *delete any placeholder text*, and paste this block. **Replace `<...>` with the real values from your notes.**

  ```
  ALPACA_API_KEY=<ALPACA_KEY_1>
  ALPACA_SECRET_KEY=<ALPACA_SEC_1>
  ALPACA_BASE_URL=https://paper-api.alpaca.markets
  ALPACA_DATA_URL=https://data.alpaca.markets
  PERPLEXITY_API_KEY=<PERPLEXITY>
  FINNHUB_API_KEY=<FINNHUB>
  CLICKUP_API_KEY=<CLICKUP_API>
  CLICKUP_TASK_ID=869cyx7a5
  LIVE_MODE=false
  ```

  ⚠️ Format rules: no spaces around `=`, no quotes, no `<>` around URLs.

- **Setup script:** clear out the example, paste:

  ```bash
  #!/bin/bash
  python3 --version
  ```

- Tap **Create environment**.

### Check it's saved

- Go back to Environments list → you should see `general` with a green/ready indicator.

✅ **Done with environment #1.** Breathe.

---

## Block 3 — Create environment #2 and #3 (repeat Block 2, 5 min each)

Identical to Block 2, with two swaps per environment:

| Environment name     | Swap these 2 lines                                         |
|----------------------|------------------------------------------------------------|
| `day-trader-kraken`  | `ALPACA_API_KEY=<ALPACA_KEY_2>` / `ALPACA_SECRET_KEY=<ALPACA_SEC_2>` |
| `news-based`         | `ALPACA_API_KEY=<ALPACA_KEY_3>` / `ALPACA_SECRET_KEY=<ALPACA_SEC_3>` |

Everything else is identical to Block 2. Change the name and description, swap the two Alpaca lines, paste, create.

✅ **3 environments created. The hard part is over — the rest is repetition.**

---

## Block 4 — Create routine #1 (10 min, one-time pattern learning)

We'll do the first routine in full detail. The other 15 follow the same steps with different values from the SETUP.md table.

### Open the creation form

1. claude.ai/code → **Routines** in the sidebar → **+ New routine**.

### Fill in top-down (do NOT tap **Create** yet)

- **Name:** `general / pre-market`

- **Repository chip:** tap **+** next to the repo chip area → pick `thomascortebeeck-kidsnovel/trader`. It may ask for a **branch** — pick `claude/ai-trading-bot-system-magkk`.

- **Prompt (big text box — "Describe what Claude should do"):**

  1. Open your other tab: `github.com/thomascortebeeck-kidsnovel/trader/blob/claude/ai-trading-bot-system-magkk/bots/general/routines/pre-market.md`
  2. On mobile, tap the **"Raw"** button at the top-right of the file view → that opens the plain text.
  3. Long-press anywhere → **Select all** → **Copy**.
  4. Go back to the routine tab → long-press the prompt box → **Paste**.

- **Model selector:** should already show `Opus 4.7 1M`. If not, tap and pick it.

- **Environment dropdown (☁️ chip under the prompt):** tap → pick `general`.

- **Select a trigger → tap Schedule:**
  - Frequency: pick **Weekdays** (if there's a preset; else **Daily** and we'll fix via custom cron).
  - **Custom cron** field (may be under "Advanced" or "Show more"): enter `0 8 * * 1-5`
  - **Timezone:** `America/New_York` ← critical, set this on every routine.

- **Connectors section (scroll down):** if you see `Canva` or any connector chip, **tap the ✕ on each** to remove. Trading routines need **zero** connectors.

- **Permissions tab (next to Connectors):** tap it → find **"Allow unrestricted branch pushes"** → turn **ON**.

- Back to the main tab, scroll to the bottom → tap **Create**.

### Verify routine #1

- The routine appears in your Routines list.
- Tap it → tap **Run now**.
- Watch the transcript: it should read files, hit Alpaca, print today's catalysts, commit + push. **No ClickUp notification on pre-market** — that's by design.
- Open `github.com/thomascortebeeck-kidsnovel/trader/commits/main` — there should be a fresh commit starting with `general: pre-market`.

✅ **Routine #1 works. You just proved the whole stack.**

---

## Block 5 — Crank through routines #2–#16 (45–60 min)

Same drill as Block 4, but now using **SETUP.md Part 2** as the checklist. For each row:

1. Tap **+ New routine**.
2. **Name:** copy from SETUP.md column "Name".
3. **Prompt:** open the GitHub link in SETUP.md's "Prompt file" column → Raw → Copy all → Paste.
4. **Environment:** pick the one in SETUP.md's "Environment" column.
5. **Cron:** paste SETUP.md's "Cron (ET)" value. **Timezone: America/New_York** every time.
6. **Connectors:** remove all.
7. **Permissions → Allow unrestricted branch pushes: ON.**
8. **Create.**

### Suggested batching (don't try all 15 in one sitting)

| Batch | Routines                                                  | Break after |
|-------|-----------------------------------------------------------|-------------|
| A     | rows 2–5 (`general / *` remaining)                        | 15 min break |
| B     | rows 6–11 (all `kraken / *`)                              | 15 min break |
| C     | rows 12–16 (all `news / *`)                               | done        |

After each batch, run one routine from that batch as a smoke test.

---

## Block 6 — Phase the schedules on (1 week at a time)

By default, schedules are **ON** once you create the routine. If you want a phased rollout (recommended), go to each routine → toggle **Repeats** OFF for the bots you're not starting with yet.

- **Week 1:** only `general / *` schedules ON. Everything else OFF.
- **Week 2:** add `news / pre-market-news` + `news / eod`.
- **Week 3:** flip the rest on.
- **Week 4+:** read every transcript. Iterate. Do **not** flip `LIVE_MODE=true`.

---

## If you get stuck

- Take a screenshot of what you're seeing in claude.ai → paste it into this chat → I'll tell you the next tap.
- If a routine fails at runtime, tap the failed run → **Copy session link** → paste the transcript excerpt in chat → I'll diagnose.

---

## Desktop-vs-mobile honest take (again)

For the one-time setup, if you can borrow a laptop for 90 minutes it'll save ~30 minutes of thumb-typing. After that, **mobile is fine forever**. If laptop isn't available, mobile is totally workable — just chunk it.
