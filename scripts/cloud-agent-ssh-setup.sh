#!/usr/bin/env bash
# Wire Cloud Agent VM → production droplet SSH.
# Key: ~/.ssh/cursor-cloud-agent-nsfwdroid (see scripts/cloud-agent-ssh-keygen.sh).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source=cloud-agent-droplet-ssh-vars.sh
source "${SCRIPT_DIR}/cloud-agent-droplet-ssh-vars.sh"

SSH_DIR="${HOME}/.ssh"
KEY="${SSH_DIR}/cursor-cloud-agent-nsfwdroid"
HOST_ALIAS="${NSFWDROID_SSH_HOST_ALIAS}"
DEPLOY_USER="${NSFWDROID_DEPLOY_SSH_USER}"
PIN_FILE="${REPO_ROOT}/deploy/nsfwdroid-droplet.ssh_known_hosts"

mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"

if [[ -f "$PIN_FILE" ]]; then
  touch "$SSH_DIR/known_hosts"
  chmod 600 "$SSH_DIR/known_hosts"
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    if ! grep -qF "$line" "$SSH_DIR/known_hosts" 2>/dev/null; then
      echo "$line" >> "$SSH_DIR/known_hosts"
    fi
  done < "$PIN_FILE"
fi

if [[ ! -f "$KEY" ]]; then
  for var in \
    CURSOR_CLOUD_AGENT_NSFWDROID_PRIVATE_KEY \
    NSFWDROID_DEPLOY_SSH_PRIVATE_KEY \
    SSH_PRIVATE_KEY; do
    if [[ -n "${!var:-}" ]]; then
      umask 177
      printf '%s\n' "${!var}" > "$KEY"
      chmod 600 "$KEY"
      break
    fi
  done
fi

if [[ ! -f "$KEY" ]]; then
  echo "No key at $KEY. Run: ./scripts/cloud-agent-ssh-keygen.sh" >&2
  echo "Or set CURSOR_CLOUD_AGENT_NSFWDROID_PRIVATE_KEY in environment secrets." >&2
  exit 1
fi

CONFIG_BLOCK=$(cat <<EOF

Host ${HOST_ALIAS}
  HostName ${NSFWDROID_DROPLET_HOST}
  User ${DEPLOY_USER}
  IdentityFile ${KEY}
  IdentitiesOnly yes
  StrictHostKeyChecking yes
  UserKnownHostsFile ${SSH_DIR}/known_hosts
EOF
)

if grep -q "Host ${HOST_ALIAS}" "$SSH_DIR/config" 2>/dev/null; then
  sed -i 's/StrictHostKeyChecking accept-new/StrictHostKeyChecking yes/' "$SSH_DIR/config" 2>/dev/null || true
  sed -i "/^Host ${HOST_ALIAS}\$/,/^Host /{s/^  User .*/  User ${DEPLOY_USER}/}" "$SSH_DIR/config" 2>/dev/null || true
else
  printf '%s\n' "$CONFIG_BLOCK" >> "$SSH_DIR/config"
  chmod 600 "$SSH_DIR/config"
fi

ssh -o BatchMode=yes "${HOST_ALIAS}" "echo 'ssh ok (${DEPLOY_USER})' && hostname && test -d ${NSFWDROID_APP_DIR}"
