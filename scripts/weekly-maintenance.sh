#!/usr/bin/env bash
# Tuesday 03:00–04:00 UTC: stop storefront, run deep catalog maintenance, hard health checks, start by 04:00 UTC latest.
set -euo pipefail

APP_DIR="${NSFWDROID_APP_DIR:-/var/www/nsfwdroid}"
ENV_FILE="${NSFWDROID_ENV_FILE:-/etc/nsfwdroid.env}"
SERVICE="${NSFWDROID_SERVICE:-nsfwdroid}"
LOCK_FILE="$APP_DIR/data/.weekly-maintenance.lock"
LOG_FILE="${NSFWDROID_WEEKLY_LOG:-/var/log/nsfwdroid-weekly-maintenance.log}"
HEALTH_URL="${NSFWDROID_HEALTH_URL:-http://127.0.0.1:3000/api/health}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/ops-health-probe.sh"

log() {
  echo "[$(date -Is)] [weekly-maintenance] $*" | tee -a "$LOG_FILE"
}

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

deadline_epoch() {
  date -u -d "today 04:00" +%s 2>/dev/null || date -u -j -f "%Y-%m-%d %H:%M:%S" "$(date -u +%Y-%m-%d) 04:00:00" +%s
}

DEADLINE=$(deadline_epoch)
now=$(date +%s)
if (( now >= DEADLINE )); then
  log "past 04:00 UTC deadline — aborting (run next Tuesday)"
  exit 0
fi

mkdir -p "$APP_DIR/data"
echo "$$" >"$LOCK_FILE"
chown www-data:www-data "$LOCK_FILE" 2>/dev/null || true

cleanup() {
  rm -f "$LOCK_FILE"
}
trap cleanup EXIT

log "starting weekly window (hard deadline 04:00 UTC, epoch=$DEADLINE)"

"$SCRIPT_DIR/alert-email.sh" \
  --key "weekly-maintenance-start-$(date -u +%Y-%m-%d)" \
  --subject "NSFW Droid: weekly maintenance started (03:00 UTC)" \
  --body "nsfwdroid will be stopped for catalog integrity work until checks pass or 04:00 UTC."

maint_rc=0
"$SCRIPT_DIR/catalog-maintenance.sh" -- "$SCRIPT_DIR/weekly-maintenance-inner.sh" &
maint_pid=$!

while kill -0 "$maint_pid" 2>/dev/null; do
  now=$(date +%s)
  if (( now >= DEADLINE )); then
    log "04:00 UTC deadline — terminating maintenance worker"
    kill -TERM "$maint_pid" 2>/dev/null || true
    break
  fi
  sleep 15
done

wait "$maint_pid" 2>/dev/null || maint_rc=$?

if [[ "$maint_rc" -ne 0 ]]; then
  log "maintenance command exited with status $maint_rc"
fi

# catalog-maintenance trap should have started the service; enforce hard health checks before declaring done.
log "hard health/catalog checks"
checks_ok=false
for attempt in $(seq 1 12); do
  now=$(date +%s)
  if (( now >= DEADLINE )); then
    break
  fi
  if systemctl is-active --quiet "$SERVICE"; then
    if health_fetch "$HEALTH_URL" && health_probe_ok; then
      checks_ok=true
      log "health ok (attempt $attempt)"
      break
    fi
    if health_fetch "$HEALTH_URL" 2>/dev/null; then
      health_probe_analyze "$HEALTH_FETCH_BODY" "$HEALTH_FETCH_CODE"
      log "health not ok yet (attempt $attempt): $(health_probe_summary)"
    else
      log "health not ok yet (attempt $attempt): unreachable"
    fi
  else
    log "health not ok yet (attempt $attempt): unit $SERVICE inactive"
  fi
  sleep 10
done

if [[ "$checks_ok" != true ]]; then
  log "hard health checks failed before deadline"
  health_fetch "$HEALTH_URL" 2>/dev/null || true
  health_probe_analyze "${HEALTH_FETCH_BODY:-}" "${HEALTH_FETCH_CODE:-0}"
  detail=$(health_probe_detail_block "$HEALTH_URL")
  "$SCRIPT_DIR/alert-email.sh" \
    --key "weekly-maintenance-failed-$(date -u +%Y-%m-%d)" \
    --subject "NSFW Droid: weekly maintenance finished unhealthy" \
    --body "Service may still be down or /api/health is not ok after the Tuesday window.

$detail

Check: journalctl -u $SERVICE -n 80 --no-pager
Log: $LOG_FILE"
  exit 1
fi

# Clear banner notice after successful window
rm -f "$APP_DIR/data/maintenance-notice.json"

"$SCRIPT_DIR/alert-email.sh" \
  --key "weekly-maintenance-end-$(date -u +%Y-%m-%d)" \
  --subject "NSFW Droid: weekly maintenance complete" \
  --body "Storefront is up and /api/health passed catalog checks."

log "weekly maintenance complete"
exit 0
