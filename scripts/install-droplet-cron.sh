#!/usr/bin/env bash
# Install or refresh all nsfwdroid /etc/cron.d jobs from the repo. Run on the droplet as root.
set -euo pipefail

APP_DIR="${NSFWDROID_APP_DIR:-/var/www/nsfwdroid}"
CRON_SRC="${APP_DIR}/deploy/cron.d"

if [[ ! -d "$CRON_SRC" ]]; then
  echo "Missing $CRON_SRC — sync the app tree first." >&2
  exit 1
fi

chmod +x \
  "$APP_DIR/scripts/catalog-maintenance.sh" \
  "$APP_DIR/scripts/catalog-ingest-cron.sh" \
  "$APP_DIR/scripts/ensure-nsfwdroid.sh" \
  "$APP_DIR/scripts/maintenance-notice.sh" \
  "$APP_DIR/scripts/weekly-maintenance.sh" \
  "$APP_DIR/scripts/weekly-maintenance-inner.sh" \
  "$APP_DIR/scripts/alert-email.sh" \
  "$APP_DIR/scripts/check-ingest-stale.sh" \
  "$APP_DIR/scripts/check-ingest-overdue.sh" \
  "$APP_DIR/scripts/post-ingest-hooks.sh" \
  "$APP_DIR/scripts/newsletter-preflight.sh" \
  "$APP_DIR/scripts/weekly-newsletter-cron.sh" \
  "$APP_DIR/scripts/exim-relay-smoke.sh" \
  "$APP_DIR/scripts/ops-exim-relay-smoke-alert.sh" \
  "$APP_DIR/scripts/health-probe-selftest.sh" 2>/dev/null || true

for f in nsfwdroid-ingest nsfwdroid-watchdog nsfwdroid-maintenance-notice \
  nsfwdroid-weekly-maintenance nsfwdroid-weekly-newsletter; do
  src="${CRON_SRC}/${f}"
  if [[ ! -f "$src" ]]; then
    echo "skip missing $src" >&2
    continue
  fi
  install -m 644 "$src" "/etc/cron.d/${f}"
  echo "installed /etc/cron.d/${f}"
done

touch \
  /var/log/nsfwdroid-ingest.log \
  /var/log/nsfwdroid-watchdog.log \
  /var/log/nsfwdroid-maintenance-notice.log \
  /var/log/nsfwdroid-weekly-maintenance.log \
  /var/log/nsfwdroid-newsletter.log \
  /var/log/nsfwdroid-social.log \
  /var/log/nsfwdroid-exim-smoke.log 2>/dev/null || true

mkdir -p /var/lib/nsfwdroid/alert-dedupe /var/lib/nsfwdroid /var/lock
chown root:root /var/log/nsfwdroid-*.log 2>/dev/null || true

echo "Cron jobs:"
ls -la /etc/cron.d/nsfwdroid-* 2>/dev/null || true
