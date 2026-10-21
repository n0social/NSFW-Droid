#!/usr/bin/env bash
# Release to production per docs/deploy-droplet.md §4b (small droplet — full node_modules tarball).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
HOST_ALIAS="nsfwdroid-droplet"
REMOTE_ROOT="/var/www/nsfwdroid"

"${SCRIPT_DIR}/cloud-agent-ssh-setup.sh"

cd "$ROOT_DIR"

echo "Building Next.js app (production env vars must be set for NEXT_PUBLIC_* )..."
npm run build

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SRC_TAR="/tmp/nsfwdroid-src-${STAMP}.tgz"
NM_TAR="/tmp/nsfwdroid-node_modules-${STAMP}.tgz"

tar czf "$SRC_TAR" \
  --exclude=node_modules \
  --exclude='data/catalog' \
  --exclude=.git \
  -C "$ROOT_DIR" .

echo "Packaging production node_modules..."
npm ci --omit=dev
tar czf "$NM_TAR" -C "$ROOT_DIR" node_modules

echo "Uploading to droplet..."
scp "$SRC_TAR" "$NM_TAR" "${HOST_ALIAS}:/tmp/"

ssh "${HOST_ALIAS}" bash -s <<EOF
set -euo pipefail
cd "${REMOTE_ROOT}"
tar xzf "/tmp/$(basename "$SRC_TAR")"
tar xzf "/tmp/$(basename "$NM_TAR")"
chown -R www-data:www-data node_modules
systemctl restart nsfwdroid
sleep 2
curl -sfI http://127.0.0.1:3000/api/health | head -1
EOF

echo "Deploy finished. Verify: curl -sI https://www.nsfwdroid.com/api/health"
