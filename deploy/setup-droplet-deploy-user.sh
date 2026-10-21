#!/usr/bin/env bash
# One-time droplet setup: dedicated deploy user + constrained agent SSH key + limited sudo.
# Run as root on the droplet (laptop SSH). Safe to re-run (idempotent).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${NSFWDROID_APP_DIR:-/var/www/nsfwdroid}"
DEPLOY_USER="${NSFWDROID_DEPLOY_USER:-nsfwdroid-deploy}"
DEPLOY_HOME="/home/${DEPLOY_USER}"
PUB_FILE="${SCRIPT_DIR}/cursor-cloud-agent-nsfwdroid.pub"
AUTH_LINE_SCRIPT="${APP_DIR}/scripts/cloud-agent-authorized-keys-line.sh"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root on the droplet." >&2
  exit 1
fi

if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd --create-home --shell /bin/bash "$DEPLOY_USER"
  echo "Created user ${DEPLOY_USER}"
fi

install -d -m 755 /usr/local/sbin
install -m 755 "${SCRIPT_DIR}/nsfwdroid-deploy-release.sh" /usr/local/sbin/nsfwdroid-deploy-release.sh
install -m 755 "${SCRIPT_DIR}/nsfwdroid-install-droplet-cron.sh" /usr/local/sbin/nsfwdroid-install-droplet-cron.sh

cat > /etc/sudoers.d/nsfwdroid-deploy <<'EOF'
Defaults:nsfwdroid-deploy !requiretty
nsfwdroid-deploy ALL=(root) NOPASSWD: /usr/local/sbin/nsfwdroid-deploy-release.sh
nsfwdroid-deploy ALL=(root) NOPASSWD: /usr/local/sbin/nsfwdroid-install-droplet-cron.sh
EOF
chmod 440 /etc/sudoers.d/nsfwdroid-deploy
visudo -cf /etc/sudoers.d/nsfwdroid-deploy

if [[ ! -d "$APP_DIR" ]]; then
  echo "Warning: ${APP_DIR} missing — clone/sync the app, then re-run to fix ownership." >&2
else
  mkdir -p "${APP_DIR}/.deploy-upload"
  chown -R "${DEPLOY_USER}:www-data" "$APP_DIR"
  find "$APP_DIR" -type d -exec chmod u+rwx,g+rx,o-rwx {} +
  find "$APP_DIR" -type f -exec chmod u+rw,g+r,o-rwx {} +
  if [[ -d "${APP_DIR}/data" ]]; then
    chown -R www-data:www-data "${APP_DIR}/data"
  fi
  chown "${DEPLOY_USER}:www-data" "${APP_DIR}/.deploy-upload"
  chmod 2770 "${APP_DIR}/.deploy-upload"
fi

install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "${DEPLOY_HOME}/.ssh"
AUTH_KEYS="${DEPLOY_HOME}/.ssh/authorized_keys"

if [[ -x "$AUTH_LINE_SCRIPT" ]]; then
  AUTH_LINE="$("$AUTH_LINE_SCRIPT" "$PUB_FILE")"
elif [[ -f "$PUB_FILE" ]]; then
  AUTH_LINE="restrict,port-forwarding $(tr -d '\n' < "$PUB_FILE")"
else
  echo "Missing ${PUB_FILE} — sync repo to ${APP_DIR} or copy deploy/cursor-cloud-agent-nsfwdroid.pub." >&2
  exit 1
fi

touch "$AUTH_KEYS"
chmod 600 "$AUTH_KEYS"
chown "${DEPLOY_USER}:${DEPLOY_USER}" "$AUTH_KEYS"
grep -qF 'cursor-cloud-agent-nsfwdroid' "$AUTH_KEYS" 2>/dev/null || echo "$AUTH_LINE" >> "$AUTH_KEYS"

echo ""
echo "Deploy user ${DEPLOY_USER} is ready."
echo "Cloud Agent SSH user: ${DEPLOY_USER} (not root)."
echo ""
echo "After verifying ./scripts/cloud-agent-ssh-setup.sh from an agent, remove the agent key from /root/.ssh/authorized_keys."
echo "Until then, agents can still use NSFWDROID_DEPLOY_SSH_USER=root."
