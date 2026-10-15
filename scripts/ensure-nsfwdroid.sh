#!/usr/bin/env bash
# Watchdog: restart nsfwdroid if the unit is down or /api/health fails on localhost.
# Install via cron (see docs/deploy-droplet.md).
set -euo pipefail

APP_DIR="${NSFWDROID_APP_DIR:-/var/www/nsfwdroid}"
SERVICE="${NSFWDROID_SERVICE:-nsfwdroid}"
HEALTH_URL="${NSFWDROID_HEALTH_URL:-http://127.0.0.1:3000/api/health}"
LOG_FILE="${NSFWDROID_WATCHDOG_LOG:-/var/log/nsfwdroid-watchdog.log}"
CATALOG_DIR="$APP_DIR/data/catalog"

log() {
  echo "[$(date -Is)] [ensure-nsfwdroid] $*" | tee -a "$LOG_FILE"
}

remove_stale_postmaster_pid() {
  local pidf="$CATALOG_DIR/postmaster.pid"
  [[ -f "$pidf" ]] || return 0
  local pid
  pid=$(head -1 "$pidf" 2>/dev/null || true)
  if [[ -z "$pid" ]]; then
    log "removing empty $pidf"
    rm -f "$pidf"
    return 0
  fi
  if [[ "$pid" =~ ^[0-9]+$ ]] && ! kill -0 "$pid" 2>/dev/null; then
    log "removing stale $pidf (pid=$pid)"
    rm -f "$pidf"
  fi
}

service_active() {
  systemctl is-active --quiet "$SERVICE"
}

health_ok() {
  local body
  body=$(curl -sf --max-time 15 "$HEALTH_URL" 2>/dev/null) || return 1
  [[ "$body" == *'"status":"ok"'* ]] && [[ "$body" == *'"healthy":true'* ]]
}

reason=""

if ! service_active; then
  reason="unit inactive"
elif ! health_ok; then
  reason="health check failed ($HEALTH_URL)"
fi

if [[ -z "$reason" ]]; then
  exit 0
fi

log "recovering: $reason"
remove_stale_postmaster_pid
if ! systemctl restart "$SERVICE"; then
  log "systemctl restart failed"
  exit 1
fi
sleep 3
if service_active && health_ok; then
  log "recovery ok"
  exit 0
fi
log "recovery incomplete after restart (check journalctl -u $SERVICE)"
exit 1
