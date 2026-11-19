#!/usr/bin/env bash
# Stop app and reset ownership so nsfwdroid-deploy can extract release tarballs (sudo only).
set -euo pipefail

APP_DIR="${NSFWDROID_APP_DIR:-/var/www/nsfwdroid}"
DEPLOY_USER="${NSFWDROID_DEPLOY_USER:-nsfwdroid-deploy}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root (e.g. sudo $0)." >&2
  exit 1
fi

systemctl stop nsfwdroid || true
chown -R "${DEPLOY_USER}:www-data" "${APP_DIR}"
find "${APP_DIR}" -type d -exec chmod u+rwx,g+rx,o-rwx {} +
find "${APP_DIR}" -type f -exec chmod u+rw,g+r,o-rwx {} +
if [[ -d "${APP_DIR}/data" ]]; then
  chown -R www-data:www-data "${APP_DIR}/data"
fi
if [[ -d "${APP_DIR}/.deploy-upload" ]]; then
  chown "${DEPLOY_USER}:www-data" "${APP_DIR}/.deploy-upload"
  chmod 2770 "${APP_DIR}/.deploy-upload"
fi