#!/usr/bin/env bash
# Watchdog: restart nsfwdroid if the unit is down or /api/health fails on localhost.
# Skips recovery during intentional weekly maintenance (.weekly-maintenance.lock).
# On persistent failure, sends a rate-limited ops email (see scripts/alert-email.sh).
set -euo pipefail

APP_DIR="${NSFWDROID_APP_DIR:-/var/www/nsfwdroid}"
SERVICE="${NSFWDROID_SERVICE:-nsfwdroid}"
HEALTH_URL="${NSFWDROID_HEALTH_URL:-http://127.0.0.1:3000/api/health}"
LOG_FILE="${NSFWDROID_WATCHDOG_LOG:-/var/log/nsfwdroid-watchdog.log}"
CATALOG_DIR="$APP_DIR/data/catalog"
LOCK_FILE="$APP_DIR/data/.weekly-maintenance.lock"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${NSFWDROID_ENV_FILE:-/etc/nsfwdroid.env}"

log() {
  echo "[$(date -Is)] [ensure-nsfwdroid] $*" | tee -a "$LOG_FILE"
}

if [[ -f "$LOCK_FILE" ]]; then
  exit 0
fi

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

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
  log "systemctl restart failed; trying reset-failed"
  systemctl reset-failed "$SERVICE" 2>/dev/null || true
  if ! systemctl restart "$SERVICE"; then
    log "systemctl restart failed after reset-failed"
    "$SCRIPT_DIR/alert-email.sh" \
      --key "watchdog-restart-failed" \
      --subject "NSFW Droid: watchdog could not restart $SERVICE" \
      --body "Reason: $reason. Check journalctl -u $SERVICE and $LOG_FILE"
    exit 1
  fi
fi
sleep 3
remove_stale_postmaster_pid
if service_active && health_ok; then
  log "recovery ok"
  exit 0
fi
log "recovery incomplete after restart (check journalctl -u $SERVICE)"
"$SCRIPT_DIR/alert-email.sh" \
  --key "watchdog-recovery-incomplete" \
  --subject "NSFW Droid: watchdog recovery incomplete (502/503 risk)" \
  --body "Initial issue: $reason. Service restarted but health still failing at $HEALTH_URL. Visitors may see the Caddy maintenance page (502/503/504)."
exit 1
