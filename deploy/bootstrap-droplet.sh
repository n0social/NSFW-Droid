#!/usr/bin/env bash
# Run on the DigitalOcean droplet as root (Ubuntu 22.04/24.04).
# Usage: curl -fsSL <raw-url>/deploy/bootstrap-droplet.sh | bash
# Or copy this repo to /var/www/nsfwdroid and run locally.
set -euo pipefail

APP_DIR=/var/www/nsfwdroid
ENV_FILE=/etc/nsfwdroid.env

echo "==> Installing Node 20, Caddy, git"
apt-get update -qq
apt-get install -y -qq curl git ca-certificates
if ! command -v node >/dev/null || [[ "$(node -v)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi
if ! command -v caddy >/dev/null; then
  apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq
  apt-get install -y -qq caddy
fi

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "Clone your private repo into $APP_DIR first, then re-run this script."
  exit 1
fi

cd "$APP_DIR"
npm ci
npm run build

if [[ ! -f "$ENV_FILE" ]]; then
  cat >"$ENV_FILE" <<'EOF'
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://www.nsfwdroid.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=
ADMIN_PASSWORD=
# ADMIN_SESSION_SECRET=
AUTO_PUBLISH=1
EOF
  chmod 600 "$ENV_FILE"
  echo "Created $ENV_FILE — edit ADMIN_PASSWORD and GA id before going live."
fi

chown -R www-data:www-data "$APP_DIR/data" 2>/dev/null || mkdir -p "$APP_DIR/data" && chown -R www-data:www-data "$APP_DIR/data"

chmod +x "$APP_DIR/scripts/catalog-maintenance.sh" \
  "$APP_DIR/scripts/catalog-ingest-cron.sh" \
  "$APP_DIR/scripts/check-ingest-stale.sh" \
  "$APP_DIR/scripts/check-ingest-overdue.sh" \
  "$APP_DIR/scripts/post-ingest-hooks.sh" \
  "$APP_DIR/scripts/ensure-nsfwdroid.sh" \
  "$APP_DIR/scripts/alert-email.sh" \
  "$APP_DIR/scripts/ops-alert-email-test.sh" \
  "$APP_DIR/scripts/maintenance-notice.sh" \
  "$APP_DIR/scripts/weekly-maintenance.sh" \
  "$APP_DIR/scripts/weekly-maintenance-inner.sh" \
  "$APP_DIR/scripts/exim-relay-smoke.sh" \
  "$APP_DIR/scripts/ops-exim-relay-smoke-alert.sh" 2>/dev/null || true
mkdir -p /var/lib/nsfwdroid/alert-dedupe

cp deploy/nsfwdroid.service /etc/systemd/system/nsfwdroid.service
systemctl daemon-reload
systemctl enable --now nsfwdroid

if [[ -f deploy/cron.d/nsfwdroid-watchdog ]]; then
  cp deploy/cron.d/nsfwdroid-watchdog /etc/cron.d/nsfwdroid-watchdog
  chmod 644 /etc/cron.d/nsfwdroid-watchdog
  touch /var/log/nsfwdroid-watchdog.log
fi
if [[ -f deploy/cron.d/nsfwdroid-ingest ]]; then
  cp deploy/cron.d/nsfwdroid-ingest /etc/cron.d/nsfwdroid-ingest
  chmod 644 /etc/cron.d/nsfwdroid-ingest
  touch /var/log/nsfwdroid-ingest.log
fi
if [[ -f deploy/cron.d/nsfwdroid-maintenance-notice ]]; then
  cp deploy/cron.d/nsfwdroid-maintenance-notice /etc/cron.d/nsfwdroid-maintenance-notice
  chmod 644 /etc/cron.d/nsfwdroid-maintenance-notice
  touch /var/log/nsfwdroid-maintenance-notice.log
fi
if [[ -f deploy/cron.d/nsfwdroid-weekly-maintenance ]]; then
  cp deploy/cron.d/nsfwdroid-weekly-maintenance /etc/cron.d/nsfwdroid-weekly-maintenance
  chmod 644 /etc/cron.d/nsfwdroid-weekly-maintenance
  touch /var/log/nsfwdroid-weekly-maintenance.log
fi

cp deploy/Caddyfile /etc/caddy/Caddyfile
systemctl reload caddy || systemctl restart caddy

echo "==> Done. Point DNS A records for @ and www to this droplet, then open https://www.nsfwdroid.com"
echo "    Watchdog: /etc/cron.d/nsfwdroid-watchdog (every 5 min)"
echo "    Ingest:   /etc/cron.d/nsfwdroid-ingest (06:00, 14:00, 22:00 UTC) via scripts/catalog-maintenance.sh"
echo "    Weekly:   notice Tue 02:00 UTC, maintenance Tue 03:00–04:00 UTC (see deploy-droplet.md)"
