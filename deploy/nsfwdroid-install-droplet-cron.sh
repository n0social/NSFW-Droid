#!/usr/bin/env bash
# Wrapper installed on the droplet; Cloud Agent calls via sudo (not direct root SSH).
set -euo pipefail

APP_DIR="${NSFWDROID_APP_DIR:-/var/www/nsfwdroid}"
INSTALL="${APP_DIR}/scripts/install-droplet-cron.sh"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root (e.g. sudo $0)." >&2
  exit 1
fi

if [[ ! -x "$INSTALL" ]]; then
  echo "Missing $INSTALL — sync the app tree first." >&2
  exit 1
fi

export NSFWDROID_APP_DIR="$APP_DIR"
exec "$INSTALL"
