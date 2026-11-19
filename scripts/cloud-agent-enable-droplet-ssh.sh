#!/usr/bin/env bash
# Rotate Cloud Agent SSH key and install the public half on the droplet (when possible).
#
# Agent with CURSOR_CLOUD_AGENT_NSFWDROID_PRIVATE_KEY or existing ~/.ssh/cursor-cloud-agent-nsfwdroid:
#   ./scripts/cloud-agent-enable-droplet-ssh.sh
#
# Fresh agent (no droplet access yet): generates a key, then prints the one root command for the droplet.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source=cloud-agent-droplet-ssh-vars.sh
source "${SCRIPT_DIR}/cloud-agent-droplet-ssh-vars.sh"

SKIP_KEYGEN=0
COMMIT_PUB=0
for arg in "$@"; do
  case "$arg" in
    --skip-keygen) SKIP_KEYGEN=1 ;;
    --commit-pub) COMMIT_PUB=1 ;;
  esac
done

if [[ "$SKIP_KEYGEN" -eq 0 ]]; then
  "${SCRIPT_DIR}/cloud-agent-ssh-keygen.sh"
else
  echo "Skipping keygen (using existing ${HOME}/.ssh/cursor-cloud-agent-nsfwdroid)"
fi

KEY="${HOME}/.ssh/cursor-cloud-agent-nsfwdroid"
if [[ ! -f "$KEY" ]]; then
  echo "No private key at $KEY. Run without --skip-keygen or set CURSOR_CLOUD_AGENT_NSFWDROID_PRIVATE_KEY." >&2
  exit 1
fi

if [[ "$COMMIT_PUB" -eq 1 ]]; then
  cd "$REPO_ROOT"
  git add deploy/cursor-cloud-agent-nsfwdroid.pub
  if git diff --cached --quiet; then
    echo "deploy/cursor-cloud-agent-nsfwdroid.pub unchanged (nothing to commit)."
  else
    git commit -m "Rotate Cloud Agent deploy SSH public key"
    echo "Committed public key. Push before the droplet can install: git push origin HEAD"
  fi
fi

echo ""
echo "=== Cursor Cloud Agent environment ==="
echo "Add or update secret CURSOR_CLOUD_AGENT_NSFWDROID_PRIVATE_KEY (never commit or paste in chat):"
echo "  cat $KEY"
echo "Start a new agent run after saving the secret."
echo ""

REMOTE_INSTALL="sudo /usr/local/sbin/nsfwdroid-install-agent-ssh-key.sh"
REMOTE_FALLBACK="cd ${NSFWDROID_APP_DIR} && sudo ./scripts/install-droplet-cloud-agent-ssh-key.sh"
PUB_LOCAL="${REPO_ROOT}/deploy/cursor-cloud-agent-nsfwdroid.pub"

"${SCRIPT_DIR}/cloud-agent-ssh-setup.sh" >/dev/null 2>&1 || true

REMOTE_PUB="${NSFWDROID_APP_DIR}/.deploy-upload/cursor-cloud-agent-nsfwdroid.pub"
if [[ -f "$PUB_LOCAL" ]] && ssh -o BatchMode=yes -o ConnectTimeout=10 "${NSFWDROID_SSH_HOST_ALIAS}" \
  "test -d ${NSFWDROID_APP_DIR}/.deploy-upload" 2>/dev/null; then
  scp -q -o BatchMode=yes "$PUB_LOCAL" "${NSFWDROID_SSH_HOST_ALIAS}:${REMOTE_PUB}"
fi

if ssh -o BatchMode=yes -o ConnectTimeout=10 "${NSFWDROID_SSH_HOST_ALIAS}" \
  "${REMOTE_INSTALL} ${REMOTE_PUB}" 2>/dev/null; then
  echo "Droplet authorized_keys updated via ${REMOTE_INSTALL}."
elif ssh -o BatchMode=yes -o ConnectTimeout=10 "${NSFWDROID_SSH_HOST_ALIAS}" \
  "test -f ${NSFWDROID_APP_DIR}/deploy/nsfwdroid-install-agent-ssh-key.sh && ${REMOTE_FALLBACK} ${REMOTE_PUB}" 2>/dev/null; then
  echo "Droplet authorized_keys updated via repo script (run setup-droplet-deploy-user.sh to install sbin helper)."
else
  echo "=== Droplet (root, one time after git pull or deploy with new scripts) ==="
  echo "  cd ${NSFWDROID_APP_DIR}"
  echo "  # optional: git pull origin main"
  echo "  ./deploy/setup-droplet-deploy-user.sh   # installs sudo + sbin helper"
  echo "  ./scripts/install-droplet-cloud-agent-ssh-key.sh"
  echo ""
  echo "If the app tree already has the new scripts:"
  echo "  sudo ./scripts/install-droplet-cloud-agent-ssh-key.sh"
  exit 0
fi

"${SCRIPT_DIR}/cloud-agent-ssh-setup.sh"
echo "SSH ready for ${NSFWDROID_DEPLOY_SSH_USER}@${NSFWDROID_DROPLET_HOST}"