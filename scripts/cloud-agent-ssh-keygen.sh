#!/usr/bin/env bash
# Create (or rotate) the Cloud Agent → droplet SSH key. Public key is committed in deploy/.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SSH_DIR="${HOME}/.ssh"
KEY="${SSH_DIR}/cursor-cloud-agent-nsfwdroid"
PUB_FILE="${REPO_ROOT}/deploy/cursor-cloud-agent-nsfwdroid.pub"
COMMENT="cursor-cloud-agent-nsfwdroid"

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

PUB_LINE="$(cat "$PUB_FILE")"
echo ""
echo "=== Run on the droplet as root (phone or laptop SSH) ==="
echo ""
echo "mkdir -p ~/.ssh && chmod 700 ~/.ssh"
echo "grep -q 'cursor-cloud-agent-nsfwdroid' ~/.ssh/authorized_keys 2>/dev/null || echo '${PUB_LINE}' >> ~/.ssh/authorized_keys"
echo "chmod 600 ~/.ssh/authorized_keys"
echo ""
echo "=== Cursor environment (for future agents) ==="
echo "Add runtime secret CURSOR_CLOUD_AGENT_NSFWDROID_PRIVATE_KEY with the contents of:"
echo "  $KEY"
echo "(Never commit the private key.)"
echo ""
echo "Then on this VM: ./scripts/cloud-agent-ssh-setup.sh"
