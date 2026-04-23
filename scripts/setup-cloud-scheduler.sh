#!/usr/bin/env bash
# Create (or update) Cloud Scheduler jobs that trigger the two GitHub
# Actions pollers every 5 min during market hours, instead of relying
# on GitHub's best-effort scheduled-workflow runner (which drops runs
# under load — see docs/cloud-scheduler-setup.md for context).
#
# Prereqs (see docs/cloud-scheduler-setup.md for the full walk-through):
#   1. A fine-grained GitHub PAT with "Actions: Write" on the repo,
#      exported as $GH_PAT in your shell.
#   2. gcloud CLI authenticated against the trader-dashboard-tc01 project,
#      or run this from Cloud Shell.
#   3. The two workflows (news-poller.yml, intraday-poller.yml) already
#      present on main — they are, this script only handles the trigger.
#
# Idempotent: re-running updates existing jobs in place.

set -euo pipefail

PROJECT=${GCP_PROJECT:-trader-dashboard-tc01}
REGION=${GCP_REGION:-europe-west1}
OWNER=${GH_OWNER:-thomascortebeeck-kidsnovel}
REPO=${GH_REPO:-trader}

: "${GH_PAT:?Set GH_PAT to a GitHub PAT with Actions:Write on $OWNER/$REPO — see docs/cloud-scheduler-setup.md}"

enable_apis() {
  echo "==> Ensuring Cloud Scheduler API is enabled on $PROJECT..."
  gcloud services enable cloudscheduler.googleapis.com --project="$PROJECT" --quiet
}

upsert_job() {
  local name=$1       # job id
  local workflow=$2   # yml filename
  local schedule=$3   # cron expression (UTC)
  local description=$4

  local uri="https://api.github.com/repos/$OWNER/$REPO/actions/workflows/$workflow/dispatches"
  local body='{"ref":"main"}'
  local headers="Authorization=Bearer $GH_PAT,Accept=application/vnd.github+json,X-GitHub-Api-Version=2022-11-28,Content-Type=application/json,User-Agent=trader-cloud-scheduler"

  if gcloud scheduler jobs describe "$name" \
      --project="$PROJECT" \
      --location="$REGION" \
      --quiet >/dev/null 2>&1; then
    echo "==> Updating existing job: $name"
    gcloud scheduler jobs update http "$name" \
      --project="$PROJECT" \
      --location="$REGION" \
      --schedule="$schedule" \
      --time-zone="Etc/UTC" \
      --uri="$uri" \
      --http-method=POST \
      --update-headers="$headers" \
      --message-body="$body" \
      --attempt-deadline=30s \
      --description="$description" \
      --quiet
  else
    echo "==> Creating job: $name"
    gcloud scheduler jobs create http "$name" \
      --project="$PROJECT" \
      --location="$REGION" \
      --schedule="$schedule" \
      --time-zone="Etc/UTC" \
      --uri="$uri" \
      --http-method=POST \
      --headers="$headers" \
      --message-body="$body" \
      --attempt-deadline=30s \
      --description="$description" \
      --quiet
  fi
}

enable_apis

# News poller: every 5 min, 11:00-20:59 UTC (covers 07:00-16:59 ET
# pre-market through close during EDT; shifts to 06:00-15:59 ET during
# EST — acceptable one-hour deviation for the winter half, easy to
# re-schedule here if needed).
upsert_job "news-poller-trigger" \
  "news-poller.yml" \
  "*/5 11-20 * * 1-5" \
  "Trigger news-poller.yml every 5 min during market hours"

# Intraday poller: every 5 min, 13:00-20:59 UTC (covers 09:00-16:59 ET
# regular session during EDT).
upsert_job "intraday-poller-trigger" \
  "intraday-poller.yml" \
  "*/5 13-20 * * 1-5" \
  "Trigger intraday-poller.yml every 5 min during market hours"

echo
echo "Done. Verify with:"
echo "  gcloud scheduler jobs list --project=$PROJECT --location=$REGION"
echo
echo "First-fire validation:"
echo "  gcloud scheduler jobs run news-poller-trigger --project=$PROJECT --location=$REGION"
echo "  # then check GitHub Actions for a new workflow_dispatch run within ~30s"
