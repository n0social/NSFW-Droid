#!/usr/bin/env bash
# Tuesday 02:00 UTC: show site banner + optional ops email before weekly maintenance (03:00–04:00 UTC).
set -euo pipefail

APP_DIR="${NSFWDROID_APP_DIR:-/var/www/nsfwdroid}"
ENV_FILE="${NSFWDROID_ENV_FILE:-/etc/nsfwdroid.env}"
NOTICE_FILE="$APP_DIR/data/maintenance-notice.json"
LOG_FILE="${NSFWDROID_NOTICE_LOG:-/var/log/nsfwdroid-maintenance-notice.log}"

log() {
  echo "[$(date -Is)] [maintenance-notice] $*" | tee -a "$LOG_FILE"
}

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

# Cron: Tuesday 02:00 UTC — maintenance window is same calendar day 03:00–04:00 UTC.
dow=$(date -u +%u)
hour=$(date -u +%H)
if [[ "$dow" == "2" && "$hour" -lt 4 ]]; then
  window_start=$(date -u -d "today 03:00" +%Y-%m-%dT%H:%M:%SZ)
  window_end=$(date -u -d "today 04:00" +%Y-%m-%dT%H:%M:%SZ)
else
  window_start=$(date -u -d "next tuesday 03:00" +%Y-%m-%dT%H:%M:%SZ)
  window_end=$(date -u -d "next tuesday 04:00" +%Y-%m-%dT%H:%M:%SZ)
fi

message="Scheduled maintenance ${window_start%%T*} 03:00–04:00 UTC. The site will show the maintenance page while work runs."

mkdir -p "$APP_DIR/data"
node -e '
const fs = require("fs");
const path = process.argv[1];
const payload = {
  until: process.argv[2],
  windowStart: process.argv[3],
  message: process.argv[4],
};
fs.writeFileSync(path, JSON.stringify(payload));
' "$NOTICE_FILE" "$window_end" "$window_start" "$message"
chown www-data:www-data "$NOTICE_FILE" 2>/dev/null || true

log "wrote $NOTICE_FILE (until=$window_end)"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/alert-email.sh" \
  --key "maintenance-notice-$(date -u +%Y-%m-%d)" \
  --subject "NSFW Droid: maintenance in 1 hour (03:00–04:00 UTC)" \
  --body "Weekly maintenance is scheduled for $window_start through $window_end (UTC). Visitors see a site banner until the window ends; the storefront will show the Caddy maintenance page while nsfwdroid is stopped."
