#!/usr/bin/env bash
# Stop nsfwdroid, run a catalog command (migrate/ingest/scripts), fix ownership, always start again.
# Usage: catalog-maintenance.sh -- npx --yes tsx scripts/ingest-all.ts
#        catalog-maintenance.sh -- bash -c 'npx tsx scripts/db-migrate.ts && npx tsx scripts/ingest-all.ts'
set -euo pipefail

APP_DIR="${NSFWDROID_APP_DIR:-/var/www/nsfwdroid}"
ENV_FILE="${NSFWDROID_ENV_FILE:-/etc/nsfwdroid.env}"
SERVICE="${NSFWDROID_SERVICE:-nsfwdroid}"
CATALOG_DIR="$APP_DIR/data/catalog"
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

trap 'rc=$?; ensure_started || true; exit "$rc"' EXIT

if [[ $# -lt 1 || "$1" != "--" ]]; then
  echo "Usage: $0 -- <command> [args...]" >&2
  exit 2
fi
shift

log "stopping $SERVICE for maintenance"
systemctl stop "$SERVICE"
stopped=true

cd "$APP_DIR"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

log "running: $*"
"$@"

if [[ -d "$CATALOG_DIR" ]]; then
  chown -R www-data:www-data "$CATALOG_DIR"
fi
remove_stale_postmaster_pid
log "maintenance command finished"
