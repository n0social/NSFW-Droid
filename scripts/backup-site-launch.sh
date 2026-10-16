#!/usr/bin/env bash
# Create a launch snapshot of the production app tree (catalog + build + source).
# Run on the droplet as root (or with write access to BACKUP_ROOT).
#
# Usage:
#   ./scripts/backup-site-launch.sh [launch_name]
#   ./scripts/backup-site-launch.sh site_launch_01_default
#
# Cold snapshot (default): stops nsfwdroid via catalog-maintenance.sh while tarring PGlite.
# Hot snapshot (not recommended): NSFWDROID_BACKUP_HOT=1 ./scripts/backup-site-launch.sh
#
# Secrets are never included: .env*, /etc/nsfwdroid.env (document env separately).
set -euo pipefail

LAUNCH_NAME="${1:-site_launch_01_default}"
APP_DIR="${NSFWDROID_APP_DIR:-/var/www/nsfwdroid}"
BACKUP_ROOT="${NSFWDROID_BACKUP_ROOT:-/var/backups/nsfwdroid}"
DATE_TAG="$(date -u +%Y%m%d)"
STAMP_DIR="$BACKUP_ROOT/$LAUNCH_NAME"
TARBALL="$BACKUP_ROOT/${LAUNCH_NAME}_${DATE_TAG}.tar.gz"
MANIFEST="$STAMP_DIR/MANIFEST.txt"
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"

log() {
  echo "[$(date -Is)] [backup-site-launch] $*"
}

write_manifest() {
  local deploy_sha deploy_commit build_id listing_count
  deploy_sha="$(cat "$APP_DIR/.deploy-sha" 2>/dev/null || echo unknown)"
  deploy_commit="$(cat "$APP_DIR/.deploy-commit" 2>/dev/null || echo unknown)"
  build_id="$(cat "$APP_DIR/.next/BUILD_ID" 2>/dev/null || echo unknown)"
  listing_count="$(curl -sf http://127.0.0.1:3000/api/health 2>/dev/null | sed -n 's/.*"listingCount":\([0-9]*\).*/\1/p' || echo unknown)"

  mkdir -p "$STAMP_DIR"
  cat >"$MANIFEST" <<EOF
launch_name=$LAUNCH_NAME
created_utc=$(date -u -Is)
app_dir=$APP_DIR
deploy_sha=$deploy_sha
deploy_commit=$deploy_commit
next_build_id=$build_id
listing_count_at_manifest=$listing_count
tarball=$(basename "$TARBALL")
excludes=node_modules,.env*,.npm,.npm-cache,postmaster.pid
secrets_policy=/etc/nsfwdroid.env is NOT in this archive; copy separately to a secure store.
EOF
}

create_tarball() {
  mkdir -p "$BACKUP_ROOT"
  write_manifest

  log "writing $TARBALL"
  tar -czf "$TARBALL" \
    -C "$APP_DIR" \
    --exclude='node_modules' \
    --exclude='.env' \
    --exclude='.env.*' \
    --exclude='.npm' \
    --exclude='.npm-cache' \
    --exclude='data/catalog/postmaster.pid' \
    .deploy-sha .deploy-commit package.json package-lock.json .next data/catalog public src scripts deploy drizzle docs \
    next.config.mjs drizzle.config.ts tsconfig.json postcss.config.mjs eslint.config.mjs README.md SECURITY.md

  cp -f "$TARBALL" "$STAMP_DIR/"
  ln -sfn "$(basename "$TARBALL")" "$STAMP_DIR/latest.tar.gz"
  log "done: $TARBALL ($(du -h "$TARBALL" | awk '{print $1}'))"
  log "manifest: $MANIFEST"
}

if [[ "${2:-}" == "--inner" ]]; then
  create_tarball
  exit 0
fi

if [[ "${NSFWDROID_BACKUP_HOT:-0}" == "1" ]]; then
  log "hot backup (service stays up)"
  create_tarball
  exit 0
fi

MAINT="$APP_DIR/scripts/catalog-maintenance.sh"
if [[ ! -x "$MAINT" ]]; then
  log "missing $MAINT; falling back to hot backup"
  NSFWDROID_BACKUP_HOT=1 create_tarball
  exit 0
fi

log "cold backup via catalog-maintenance (brief downtime)"
exec "$MAINT" -- bash "$SCRIPT_PATH" "$LAUNCH_NAME" --inner
