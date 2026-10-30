#!/usr/bin/env bash
# Watchdog: restart nsfwdroid if the unit is down or /api/health fails on localhost.
# WATCHDOG_RESTART=0 → alert only (no systemctl restart).
set -euo pipefail

APP_DIR="${NSFWDROID_APP_DIR:-/var/www/nsfwdroid}"
SERVICE="${NSFWDROID_SERVICE:-nsfwdroid}"
HEALTH_URL="${NSFWDROID_HEALTH_URL:-http://127.0.0.1:3000/api/health}"
LOG_FILE="${NSFWDROID_WATCHDOG_LOG:-/var/log/nsfwdroid-watchdog.log}"
CATALOG_DIR="$APP_DIR/data/catalog"
WEEKLY_LOCK_FILE="$APP_DIR/data/.weekly-maintenance.lock"
CATALOG_MAINT_LOCK_FILE="$APP_DIR/data/.catalog-maintenance.lock"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${NSFWDROID_ENV_FILE:-/etc/nsfwdroid.env}"

# shellcheck disable=SC1091
source "$SCRIPT_DIR/ops-health-probe.sh"

log() { echo "[$(date -Is)] [ensure-nsfwdroid] $*" | tee -a "$LOG_FILE"; }
maintenance_lock_present() { [[ -f "$WEEKLY_LOCK_FILE" || -f "$CATALOG_MAINT_LOCK_FILE" ]]; }

# Orphaned catalog-maintenance lock (crashed ingest) blocks recovery forever unless cleared.
clear_stale_catalog_maintenance_lock() {
  [[ -f "$CATALOG_MAINT_LOCK_FILE" ]] || return 0
  local lock_pid lock_age_sec max_age
  lock_pid=$(head -1 "$CATALOG_MAINT_LOCK_FILE" 2>/dev/null || true)
  if [[ -n "$lock_pid" && "$lock_pid" =~ ^[0-9]+$ ]] && kill -0 "$lock_pid" 2>/dev/null; then
    return 0
  fi
  max_age="${CATALOG_MAINT_LOCK_MAX_AGE_SEC:-7200}"
  lock_age_sec=$(( $(date +%s) - $(stat -c %Y "$CATALOG_MAINT_LOCK_FILE" 2>/dev/null || echo 0) ))
  if [[ -n "$lock_pid" && "$lock_pid" =~ ^[0-9]+$ ]] && ! kill -0 "$lock_pid" 2>/dev/null; then
    log "removing stale catalog maintenance lock (dead pid=$lock_pid)"
    rm -f "$CATALOG_MAINT_LOCK_FILE"
    return 0
  fi
  if [[ "$lock_age_sec" -gt "$max_age" ]]; then
    log "removing stale catalog maintenance lock (age=${lock_age_sec}s > ${max_age}s)"
    rm -f "$CATALOG_MAINT_LOCK_FILE"
  fi
}

clear_stale_catalog_maintenance_lock

if maintenance_lock_present; then exit 0; fi
if [[ -f "$ENV_FILE" ]]; then set -a; # shellcheck disable=SC1090
  source "$ENV_FILE"; set +a; fi

WATCHDOG_RESTART="${WATCHDOG_RESTART:-1}"

remove_stale_postmaster_pid() {
  local pidf="$CATALOG_DIR/postmaster.pid"
  [[ -f "$pidf" ]] || return 0
  local pid; pid=$(head -1 "$pidf" 2>/dev/null || true)
  if [[ -z "$pid" ]]; then log "removing empty $pidf"; rm -f "$pidf"; return 0; fi
  if [[ "$pid" =~ ^[0-9]+$ ]] && ! kill -0 "$pid" 2>/dev/null; then
    log "removing stale $pidf (pid=$pid)"; rm -f "$pidf"
  fi
}

service_active() { systemctl is-active --quiet "$SERVICE"; }

health_ok() {
  if ! health_fetch "$HEALTH_URL"; then health_probe_analyze "" "0"; return 1; fi
  health_probe_analyze "$HEALTH_FETCH_BODY" "$HEALTH_FETCH_CODE"
  health_probe_ok
}

health_detail_for_alert() {
  if ! health_fetch "$HEALTH_URL"; then health_probe_analyze "" "0"
  else health_probe_analyze "$HEALTH_FETCH_BODY" "$HEALTH_FETCH_CODE"; fi
  health_probe_detail_block "$HEALTH_URL"
}

reason=""
if ! service_active; then reason="systemd unit $SERVICE is inactive"
elif ! health_ok; then
  health_fetch "$HEALTH_URL" 2>/dev/null || true
  health_probe_analyze "${HEALTH_FETCH_BODY:-}" "${HEALTH_FETCH_CODE:-0}"
  summary=$(health_probe_summary)
  if [[ "$summary" == *degraded* ]] || [[ "$summary" == *catalog\ unhealthy* ]]; then
    reason="health degraded — $summary"
  else reason="health check failed — $summary"; fi
fi
if [[ -z "$reason" ]]; then
  if [[ -x "$SCRIPT_DIR/check-ingest-overdue.sh" ]]; then
    "$SCRIPT_DIR/check-ingest-overdue.sh" || true
  fi
  exit 0
fi
if maintenance_lock_present; then log "skipping recovery; maintenance lock ($reason)"; exit 0; fi

detail=$(health_detail_for_alert)
if [[ "$WATCHDOG_RESTART" == "0" ]]; then
  log "WATCHDOG_RESTART=0 — alerting only ($reason)"
  "$SCRIPT_DIR/alert-email.sh" --key "watchdog-health-alert-only" \
    --subject "NSFW Droid: watchdog unhealthy (no restart)" \
    --body "WATCHDOG_RESTART=0 alert-only mode.

Issue: $reason

$detail"
  exit 0
fi

log "recovering: $reason"
remove_stale_postmaster_pid
if ! systemctl restart "$SERVICE"; then
  systemctl reset-failed "$SERVICE" 2>/dev/null || true
  if ! systemctl restart "$SERVICE"; then
    "$SCRIPT_DIR/alert-email.sh" --key "watchdog-restart-failed" \
      --subject "NSFW Droid: watchdog could not restart $SERVICE" \
      --body "Reason: $reason

$detail

journalctl -u $SERVICE -n 80 --no-pager"
    exit 1
  fi
fi
sleep 3
remove_stale_postmaster_pid
if service_active && health_ok; then log "recovery ok"; exit 0; fi
detail=$(health_detail_for_alert)
"$SCRIPT_DIR/alert-email.sh" --key "watchdog-recovery-incomplete" \
  --subject "NSFW Droid: watchdog recovery incomplete (502/503 risk)" \
  --body "Initial: $reason

After restart, health still failing.

$detail

journalctl -u $SERVICE -n 80 --no-pager"
exit 1
