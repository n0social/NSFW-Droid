#!/usr/bin/env bash
# Quick Exim + newsletter DNS status (run on droplet as root).
set -euo pipefail
APP_DIR="${NSFWDROID_APP_DIR:-/var/www/nsfwdroid}"
ENV_FILE="${NSFWDROID_ENV_FILE:-/etc/nsfwdroid.env}"

echo "=== exim4 ==="
systemctl is-active exim4 || true
exim -bP primary_hostname 2>/dev/null || true
echo "=== queue (first 15 lines) ==="
exim -bp 2>/dev/null | head -15 || true
echo "=== newsletter DNS (transport from env) ==="
set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a
cd "$APP_DIR"
npx --yes tsx scripts/check-newsletter-dns.ts
