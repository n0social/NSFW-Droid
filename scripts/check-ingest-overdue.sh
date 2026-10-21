#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${NSFWDROID_APP_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
ENV_FILE="${NSFWDROID_ENV_FILE:-/etc/nsfwdroid.env}"

if [[ -r "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

MAX_HOURS="${INGEST_ALERT_MAX_AGE_HOURS:-0}"
if [[ ! "$MAX_HOURS" =~ ^[0-9]+$ ]] || (( MAX_HOURS < 1 )); then
  exit 0
fi

cd "$APP_DIR"
json=$(npx --yes tsx "$SCRIPT_DIR/check-ingest-overdue.ts" | tail -1)
should_alert=$(node -e 'const j=JSON.parse(process.argv[1]); console.log(j.shouldAlert?"1":"0")' "$json")
[[ "$should_alert" == "1" ]] || exit 0

body=$(node -e 'const j=JSON.parse(process.argv[1]); console.log(j.body||"")' "$json")
"$SCRIPT_DIR/alert-email.sh" \
  --key "ingest-overdue-${MAX_HOURS}h" \
  --subject "NSFW Droid: catalog ingest overdue (>${MAX_HOURS}h since last success)" \
  --body "${body:-catalogLastIngestAt stale; see nsfwdroid-ingest.log}"
