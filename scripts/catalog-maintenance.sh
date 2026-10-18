#!/usr/bin/env bash
# Stop nsfwdroid, run a catalog command (migrate/ingest/scripts), fix ownership, always start again.
# Usage: catalog-maintenance.sh -- npx --yes tsx scripts/ingest-all.ts
#        catalog-maintenance.sh -- bash -c 'npx tsx scripts/db-migrate.ts && npx tsx scripts/ingest-all.ts'
set -euo pipefail

APP_DIR="${NSFWDROID_APP_DIR:-/var/www/nsfwdroid}"
ENV_FILE="${NSFWDROID_ENV_FILE:-/etc/nsfwdroid.env}"
SERVICE="${NSFWDROID_SERVICE:-nsfwdroid}"
CATALOG_DIR="$APP_DIR/data/catalog"
LOCK_FILE="$APP_DIR/data/.catalog-maintenance.lock"
LOG_TAG="catalog-maintenance"

log() {
  echo "[$(date -Is)] [$LOG_TAG] $*"
}

# PGlite writes postmaster.pid with a negative placeholder PID while embedded; only remove
# when the first line is a positive PID and that process is not running.
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

stopped=false
ensure_started() {
  if [[ "$stopped" == true ]]; then
    remove_stale_postmaster_pid
    log "starting $SERVICE"
    systemctl start "$SERVICE" || {
      log "systemctl start failed; see journalctl -u $SERVICE"
      return 1
    }
    stopped=false
  fi
}

release_lock() {
  rm -f "$LOCK_FILE"
}

trap 'rc=$?; release_lock; ensure_started || true; exit "$rc"' EXIT

mkdir -p "$(dirname "$LOCK_FILE")"
echo "$$" >"$LOCK_FILE"

if [[ $# -lt 1 || "$1" != "--" ]]; then
  echo "Usage: $0 -- <command> [args...]" >&2
  exit 2
fi
shift

stop_service() {
  local attempt
  for attempt in 1 2 3 4 5 6 7 8; do
    if ! systemctl is-active --quiet "$SERVICE"; then
      return 0
    fi
    log "stopping $SERVICE for maintenance (attempt $attempt)"
    stop_rc=0
    systemctl stop "$SERVICE" || stop_rc=$?
    if [[ "$stop_rc" -ne 0 ]]; then
      log "systemctl stop did not complete (exit $stop_rc); checking whether $SERVICE is inactive"
    fi
    if ! systemctl is-active --quiet "$SERVICE"; then
      return 0
    fi
    sleep 1
  done
  log "could not stop $SERVICE; aborting before opening the catalog"
  return 1
}

stop_service
stopped=true

cd "$APP_DIR"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

run_as_app_user() {
  if [[ "$(id -u)" -eq 0 ]]; then
    runuser -u www-data -- env NPM_CONFIG_CACHE="${NPM_CONFIG_CACHE:-/var/www/.npm}" "$@"
  else
    "$@"
  fi
}

log "running: $*"
run_as_app_user "$@"

if [[ -d "$CATALOG_DIR" ]]; then
  chown -R www-data:www-data "$CATALOG_DIR"
fi
remove_stale_postmaster_pid
log "maintenance command finished"
