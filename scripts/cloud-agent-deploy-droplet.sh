#!/usr/bin/env bash
# Release to production per docs/deploy-droplet.md §4b (small droplet — full node_modules tarball).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source=cloud-agent-droplet-ssh-vars.sh
source "${SCRIPT_DIR}/cloud-agent-droplet-ssh-vars.sh"

HOST_ALIAS="${NSFWDROID_SSH_HOST_ALIAS}"
REMOTE_ROOT="${NSFWDROID_APP_DIR}"
DEPLOY_USER="${NSFWDROID_DEPLOY_SSH_USER}"
# Droplet /tmp is often a small tmpfs; node_modules.tgz exceeds it — upload on disk.
REMOTE_UPLOAD_DIR="${REMOTE_UPLOAD_DIR:-${REMOTE_ROOT}/.deploy-upload}"

"${SCRIPT_DIR}/cloud-agent-ssh-setup.sh"

if [[ "$DEPLOY_USER" == "root" ]]; then
  REMOTE_FINISH="chown -R www-data:www-data node_modules
systemctl restart nsfwdroid
sleep 2
curl -sfI http://127.0.0.1:3000/api/health | head -1"
else
  REMOTE_FINISH="sudo /usr/local/sbin/nsfwdroid-deploy-release.sh"
fi

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

echo "Uploading to droplet (${REMOTE_UPLOAD_DIR}) as ${DEPLOY_USER}..."
ssh "${HOST_ALIAS}" "mkdir -p '${REMOTE_UPLOAD_DIR}'"
scp "$SRC_TAR" "$NM_TAR" "${HOST_ALIAS}:${REMOTE_UPLOAD_DIR}/"

ssh "${HOST_ALIAS}" bash -s <<EOF
set -euo pipefail
cd "${REMOTE_ROOT}"
SRC="${REMOTE_UPLOAD_DIR}/$(basename "$SRC_TAR")"
NM="${REMOTE_UPLOAD_DIR}/$(basename "$NM_TAR")"
tar xzf "\$SRC"
tar xzf "\$NM"
rm -f "\$SRC" "\$NM"
${REMOTE_FINISH}
EOF

echo "Deploy finished. Verify: curl -sI https://www.nsfwdroid.com/api/health"
