#!/usr/bin/env bash
# Install the Cloud Agent deploy public key on nsfwdroid-deploy (replace prior agent keys).
# Run as root: /usr/local/sbin/nsfwdroid-install-agent-ssh-key.sh
#   or: cd /var/www/nsfwdroid && ./deploy/nsfwdroid-install-agent-ssh-key.sh
set -euo pipefail

APP_DIR="${NSFWDROID_APP_DIR:-/var/www/nsfwdroid}"
DEPLOY_USER="${NSFWDROID_DEPLOY_USER:-nsfwdroid-deploy}"
DEPLOY_HOME="/home/${DEPLOY_USER}"
AUTH_KEYS="${DEPLOY_HOME}/.ssh/authorized_keys"
PUB_FILE="${1:-${APP_DIR}/deploy/cursor-cloud-agent-nsfwdroid.pub}"
AUTH_LINE_SCRIPT="${APP_DIR}/scripts/cloud-agent-authorized-keys-line.sh"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root (e.g. sudo $0)." >&2
  exit 1
fi

if [[ ! -f "$PUB_FILE" ]]; then
  echo "Missing public key: $PUB_FILE" >&2
  echo "On a Cloud Agent: ./scripts/cloud-agent-ssh-keygen.sh, commit deploy/cursor-cloud-agent-nsfwdroid.pub, deploy or git pull here." >&2
  exit 1
fi

if [[ -x "$AUTH_LINE_SCRIPT" ]]; then
  AUTH_LINE="$("$AUTH_LINE_SCRIPT" "$PUB_FILE")"
else
  AUTH_LINE="restrict,port-forwarding $(tr -d '\n' < "$PUB_FILE")"
fi

if ! id "$DEPLOY_USER" &>/dev/null; then
  echo "Missing user ${DEPLOY_USER}. Run ${APP_DIR}/deploy/setup-droplet-deploy-user.sh first." >&2
  exit 1
fi

install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "${DEPLOY_HOME}/.ssh"
touch "$AUTH_KEYS"
chmod 600 "$AUTH_KEYS"
chown "${DEPLOY_USER}:${DEPLOY_USER}" "$AUTH_KEYS"

tmp="$(mktemp)"
grep -v 'cursor-cloud-agent-nsfwdroid' "$AUTH_KEYS" >"$tmp" || true
printf '%s\n' "$AUTH_LINE" >>"$tmp"
mv "$tmp" "$AUTH_KEYS"
chmod 600 "$AUTH_KEYS"
chown "${DEPLOY_USER}:${DEPLOY_USER}" "$AUTH_KEYS"

if [[ -f /root/.ssh/authorized_keys ]]; then
  grep -v 'cursor-cloud-agent-nsfwdroid' /root/.ssh/authorized_keys >"${tmp}.root" 2>/dev/null || true
  mv "${tmp}.root" /root/.ssh/authorized_keys
  chmod 600 /root/.ssh/authorized_keys
fi

fpr="$(ssh-keygen -lf "$PUB_FILE" | awk '{print $2}')"
echo "Installed Cloud Agent key for ${DEPLOY_USER} (${fpr})."
echo "Test from Cloud Agent: ./scripts/cloud-agent-ssh-setup.sh"