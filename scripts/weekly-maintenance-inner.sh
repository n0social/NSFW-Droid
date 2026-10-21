#!/usr/bin/env bash
# Deep weekly catalog checks (service must be stopped — run via catalog-maintenance.sh).
set -euo pipefail

APP_DIR="${NSFWDROID_APP_DIR:-/var/www/nsfwdroid}"
cd "$APP_DIR"

log() {
  echo "[$(date -Is)] [weekly-maintenance] $*"
}

log "disk usage (data + app)"
df -h "$APP_DIR" "$APP_DIR/data" 2>/dev/null || df -h "$APP_DIR"

used_pct=$(df -P "$APP_DIR/data" 2>/dev/null | awk 'NR==2 {gsub(/%/,"",$5); print $5}')
if [[ -n "$used_pct" && "$used_pct" =~ ^[0-9]+$ && "$used_pct" -ge 90 ]]; then
  log "WARNING: data filesystem at ${used_pct}% capacity"
fi

log "catalog migrate + recycle + link health (full) + counts"
npx --yes tsx scripts/db-migrate.ts
npx --yes tsx scripts/recycle-stale-listings.ts --apply
LINK_CHECK_LIMIT=0 LINK_CHECK_ONLY_OK=0 npx --yes tsx scripts/check-listing-links.ts --apply
npx --yes tsx scripts/catalog-counts.ts

if [[ "${NSFWDROID_WEEKLY_INGEST:-0}" == "1" ]]; then
  log "optional full ingest (NSFWDROID_WEEKLY_INGEST=1)"
  npx --yes tsx scripts/ingest-all.ts
else
  log "skipping ingest-all (daily cron at 06/14/22 UTC handles refresh)"
fi

if [[ "${NSFWDROID_WEEKLY_NPM_CI:-0}" == "1" ]]; then
  log "optional npm ci --omit=dev (NSFWDROID_WEEKLY_NPM_CI=1)"
  npm ci --omit=dev
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -x "$SCRIPT_DIR/post-ingest-hooks.sh" ]]; then
  log "post-ingest hooks (social + ingest alerts)"
  "$SCRIPT_DIR/post-ingest-hooks.sh" || true
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
log "exim relay smoke (ops alert on failure)"
"$SCRIPT_DIR/ops-exim-relay-smoke-alert.sh" || log "exim relay smoke failed — see /var/log/nsfwdroid-exim-smoke.log"

log "inner weekly steps complete"
