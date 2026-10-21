#!/usr/bin/env bash
# Create (or rotate) the Cloud Agent → droplet SSH key. Public key is committed in deploy/.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source=cloud-agent-droplet-ssh-vars.sh
source "${SCRIPT_DIR}/cloud-agent-droplet-ssh-vars.sh"

SSH_DIR="${HOME}/.ssh"
KEY="${SSH_DIR}/cursor-cloud-agent-nsfwdroid"
PUB_FILE="${REPO_ROOT}/deploy/cursor-cloud-agent-nsfwdroid.pub"
COMMENT="cursor-cloud-agent-nsfwdroid"
DEPLOY_USER="${NSFWDROID_DEPLOY_USER:-nsfwdroid-deploy}"
DEPLOY_HOME="/home/${DEPLOY_USER}"

mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"

if [[ -f "$KEY" ]]; then
  echo "Removing existing $KEY"
  rm -f "$KEY" "$KEY.pub"
fi

ssh-keygen -t ed25519 -f "$KEY" -N "" -C "$COMMENT"
chmod 600 "$KEY"
chmod 644 "$KEY.pub"

cp "$KEY.pub" "$PUB_FILE"
echo "Updated $PUB_FILE"

AUTH_LINE="$("${SCRIPT_DIR}/cloud-agent-authorized-keys-line.sh" "$PUB_FILE")"
echo ""
echo "=== Run on the droplet as root (phone or laptop SSH) ==="
echo ""
echo "Preferred (dedicated deploy user + sudo for systemctl only):"
echo "  cd /var/www/nsfwdroid && ./deploy/setup-droplet-deploy-user.sh"
echo ""
echo "Or append this line manually to ${DEPLOY_HOME}/.ssh/authorized_keys on the droplet:"
echo ""
echo "${AUTH_LINE}"
echo ""
echo "=== Legacy root SSH (until migration) ==="
echo "Leave the key in /root/.ssh/authorized_keys and set NSFWDROID_DEPLOY_SSH_USER=root on Cloud Agents."
echo ""
echo "=== Cursor environment (for future agents) ==="
echo "Add runtime secret CURSOR_CLOUD_AGENT_NSFWDROID_PRIVATE_KEY with the contents of:"
echo "  $KEY"
echo "(Never commit the private key.)"
echo ""
echo "Then on this VM: ./scripts/cloud-agent-ssh-setup.sh"
