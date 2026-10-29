#!/usr/bin/env bash
# Post-ingest ops alert when the last N ingest_all runs added zero new candidates.
# Env (e.g. /etc/nsfwdroid.env): INGEST_ALERT_ZERO_NEW_RUNS=3 to enable; unset/0 = skip.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${NSFWDROID_APP_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
ENV_FILE="${NSFWDROID_ENV_FILE:-/etc/nsfwdroid.env}"

# Cron drops to www-data after root has already loaded this file. www-data cannot
# read the root-only env file; keep the inherited environment in that case.
if [[ -r "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

THRESHOLD="${INGEST_ALERT_ZERO_NEW_RUNS:-0}"
if [[ ! "$THRESHOLD" =~ ^[0-9]+$ ]] || (( THRESHOLD < 1 )); then
  exit 0
fi

cd "$APP_DIR"
json=$(npx --yes tsx "$SCRIPT_DIR/check-ingest-stale.ts" | tail -1)
should_alert=$(node -e 'const j=JSON.parse(process.argv[1]); console.log(j.shouldAlert?"1":"0")' "$json")
if [[ "$should_alert" != "1" ]]; then
  exit 0
fi

body=$(node -e 'const j=JSON.parse(process.argv[1]); console.log(j.body||"")' "$json")
if [[ -z "$body" ]]; then
  body="Last $THRESHOLD ingest_all run(s) had zero new candidates. See admin ingest runs and nsfwdroid-ingest.log."
fi

host_short=$(hostname -s 2>/dev/null || hostname)
"$SCRIPT_DIR/alert-email.sh" \
  --key "ingest-zero-new-${THRESHOLD}" \
  --subject "NSFW Droid: ingest stale — 0 new candidates for ${THRESHOLD} run(s) on ${host_short}" \
  --body "$body"
