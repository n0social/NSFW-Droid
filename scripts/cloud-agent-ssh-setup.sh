#!/usr/bin/env bash
# Wire Cloud Agent VM → production droplet SSH.
# Key: ~/.ssh/cursor-cloud-agent-nsfwdroid (see scripts/cloud-agent-ssh-keygen.sh).
set -euo pipefail

SSH_DIR="${HOME}/.ssh"
KEY="${SSH_DIR}/cursor-cloud-agent-nsfwdroid"
HOST_ALIAS="nsfwdroid-droplet"

mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"

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

if ! grep -q 'Host nsfwdroid-droplet' "$SSH_DIR/config" 2>/dev/null; then
  cat >> "$SSH_DIR/config" <<EOF

Host ${HOST_ALIAS}
  HostName 159.203.136.220
  User root
  IdentityFile ${KEY}
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
EOF
  chmod 600 "$SSH_DIR/config"
fi

ssh -o BatchMode=yes "${HOST_ALIAS}" "echo 'ssh ok' && hostname && test -d /var/www/nsfwdroid"
