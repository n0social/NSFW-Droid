#!/usr/bin/env bash
# Finish a Cloud Agent code deploy (run via sudo only — see setup-droplet-deploy-user.sh).
set -euo pipefail

APP_DIR="${NSFWDROID_APP_DIR:-/var/www/nsfwdroid}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root (e.g. sudo $0)." >&2
  exit 1
fi

if [[ ! -d "${APP_DIR}/node_modules" ]]; then
  echo "Missing ${APP_DIR}/node_modules — extract tarball first." >&2
  exit 1
fi

systemctl stop nsfwdroid || true
chown -R www-data:www-data "${APP_DIR}"
# Drop stale Next.js sitemap ISR artifacts (see src/app/sitemap.ts).
rm -rf "${APP_DIR}/.next/server/route-cache" \
  "${APP_DIR}/.next/server/app/sitemap.xml.body" \
  "${APP_DIR}/.next/server/app/sitemap.xml.meta"
systemctl start nsfwdroid
sleep 3
curl -sfI http://127.0.0.1:3000/api/health | head -1
