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
AUTO_PUBLISH=1
EOF
  chmod 600 "$ENV_FILE"
  echo "Created $ENV_FILE — edit ADMIN_PASSWORD and GA id before going live."
fi

chown -R www-data:www-data "$APP_DIR/data" 2>/dev/null || mkdir -p "$APP_DIR/data" && chown -R www-data:www-data "$APP_DIR/data"

cp deploy/nsfwdroid.service /etc/systemd/system/nsfwdroid.service
systemctl daemon-reload
systemctl enable --now nsfwdroid

cp deploy/Caddyfile /etc/caddy/Caddyfile
systemctl reload caddy || systemctl restart caddy

echo "==> Done. Point DNS A records for @ and www to this droplet, then open https://www.nsfwdroid.com"
echo "    Cron ingest example: 0 6 * * * cd $APP_DIR && npm run ingest >> /var/log/nsfwdroid-ingest.log 2>&1"
