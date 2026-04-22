# Cloud Scheduler → GitHub Actions — reliable 5-min poller triggering

**Why this exists.** GitHub Actions' `schedule:` trigger is best-effort —
under load, runs are delayed by 10-30 min and sometimes dropped entirely.
For market-hours pollers that need to fire every 5 min during the 09:30-16:00 ET
window, that reliability is not good enough. We saw ~7 runs in a 10-hour
window when ~120 were scheduled.

The fix: run the cron in Google Cloud Scheduler and have it POST to GitHub's
`workflow_dispatch` API at the exact times we want. Cloud Scheduler fires on
time, on schedule, with at-least-once delivery. The GitHub Actions workflow
still runs — it's just triggered externally instead of by GitHub's own cron.

## Cost

- Cloud Scheduler: 3 jobs free per billing account. We create 2 (news + intraday).
  Even beyond the free tier, jobs are $0.10/job/month. Effective cost: **$0/month**.
- Network egress: trivial (one POST every 5 min, empty body).

## One-time setup

### 1. Create a fine-grained GitHub PAT

1. GitHub → your avatar (top-right) → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. Name: `trader-cloud-scheduler`
3. Expiration: 90 days (set a calendar reminder to renew)
4. **Repository access**: "Only select repositories" → pick `thomascortebeeck-kidsnovel/trader`.
5. **Permissions** → Repository permissions → **Actions: Read and write**. (This alone is enough for `workflow_dispatch`.)
6. Generate token. Copy it once — you can't re-read it.

### 2. Run the setup script

Easiest: open [Cloud Shell](https://console.cloud.google.com/?cloudshell=true&project=trader-dashboard-tc01) in a browser — `gcloud` is pre-authenticated there, no local install needed.

```bash
# Clone the repo (if not already cloned in Cloud Shell)
git clone https://github.com/thomascortebeeck-kidsnovel/trader.git
cd trader

# Paste your PAT (leading space so it's not saved to shell history)
 export GH_PAT=<paste-your-PAT>

# Run
./scripts/setup-cloud-scheduler.sh
```

The script is idempotent — you can re-run it to update the schedule or rotate the PAT.

### 3. Verify it's working

In Cloud Shell:

```bash
# List the jobs you just created
gcloud scheduler jobs list \
  --project=trader-dashboard-tc01 \
  --location=europe-west1

# Force a one-off run to test end-to-end
gcloud scheduler jobs run news-poller-trigger \
  --project=trader-dashboard-tc01 \
  --location=europe-west1
```

Within ~30 seconds you should see a new run in **GitHub → Actions → News Poller — Event Trigger**, triggered by `workflow_dispatch` with actor `github-actions[bot]` (or similar). Expand the **Run news poller** step — same log format as a scheduled run.

### 4. Disable GitHub's own cron (optional)

Once Cloud Scheduler is firing reliably for a day or two, you can remove the `schedule:` block from `.github/workflows/news-poller.yml` and `.github/workflows/intraday-poller.yml` — keep only `workflow_dispatch:` so Cloud Scheduler is the single source of truth.

Or leave them in as a belt-and-suspenders fallback: GitHub's cron will occasionally fire a run too (deduplication happens naturally because each poller keeps a per-day state file and won't re-fire events for already-seen IDs).

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `gcloud scheduler jobs create` → `PERMISSION_DENIED` | Cloud Scheduler API not enabled, or your account lacks `roles/cloudscheduler.admin` | `gcloud services enable cloudscheduler.googleapis.com` + grant `Cloud Scheduler Admin` in IAM |
| Scheduler run succeeds but no new GitHub Actions run | PAT wrong / expired / lacks Actions:Write on the repo | Regenerate PAT in §1, re-run script |
| GitHub Actions run starts but workflow exits instantly | `workflow_dispatch` payload is malformed (rare) | Check the job's "Last execution" in Cloud Scheduler — GitHub responds with a 4xx error body |
| Scheduler fires correctly 9-5 UTC but we want wider window | Edit the `schedule` in `scripts/setup-cloud-scheduler.sh` and re-run | — |

## DST handling

The scheduler runs on UTC, so US DST transitions shift the ET window by 1h twice a year:

- **March (US springs forward)**: 11:00-20:59 UTC covers 07:00-16:59 ET ✓ (the intended window — no change needed)
- **November (US falls back)**: 11:00-20:59 UTC covers 06:00-15:59 ET — market close (16:00 ET = 21:00 UTC) falls outside

If you want to be strict about covering the full close window in winter, edit the schedule in `setup-cloud-scheduler.sh` to `*/5 12-21 * * 1-5` for the EST period and re-run. Or add both schedules to cover both halves year-round.

## Why not use GitHub Pro?

GitHub's docs explicitly say scheduled workflows are best-effort regardless of plan. Paid plans don't guarantee on-time cron delivery — they just give more runner minutes and larger runners. Cloud Scheduler sidesteps the problem entirely.
