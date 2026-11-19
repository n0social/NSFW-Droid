#!/usr/bin/env bash
# Rotate Cloud Agent SSH key and install the public half on the droplet (when possible).
#
#   ./scripts/cloud-agent-enable-droplet-ssh.sh              # new key + install attempt
#   ./scripts/cloud-agent-enable-droplet-ssh.sh --skip-keygen
#   ./scripts/cloud-agent-enable-droplet-ssh.sh --commit-pub # git commit pub only
#   ./scripts/cloud-agent-enable-droplet-ssh.sh --debug      # verbose failures
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source=cloud-agent-droplet-ssh-vars.sh
source "${SCRIPT_DIR}/cloud-agent-droplet-ssh-vars.sh"

SKIP_KEYGEN=0
COMMIT_PUB=0
DEBUG=0
for arg in "$@"; do
  case "$arg" in
    --skip-keygen) SKIP_KEYGEN=1 ;;
    --commit-pub) COMMIT_PUB=1 ;;
    --debug) DEBUG=1 ;;
  esac
done

dbg() {
  [[ "$DEBUG" -eq 1 ]] && echo "[enable-droplet-ssh] $*" >&2
}

if [[ "$SKIP_KEYGEN" -eq 0 ]]; then
  "${SCRIPT_DIR}/cloud-agent-ssh-keygen.sh"
else
  echo "Skipping keygen (using existing ${HOME}/.ssh/cursor-cloud-agent-nsfwdroid)"
fi

KEY="${HOME}/.ssh/cursor-cloud-agent-nsfwdroid"
PUB_LOCAL="${REPO_ROOT}/deploy/cursor-cloud-agent-nsfwdroid.pub"
INSTALL_LOCAL="${REPO_ROOT}/deploy/nsfwdroid-install-agent-ssh-key.sh"

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

REMOTE_HOME_PUB="agent.pub"
REMOTE_HOME_INSTALL="nsfwdroid-install-agent-ssh-key.sh"
REMOTE_SBIN="/usr/local/sbin/nsfwdroid-install-agent-ssh-key.sh"
REMOTE_FALLBACK="${NSFWDROID_APP_DIR}/deploy/nsfwdroid-install-agent-ssh-key.sh"
REMOTE_UPLOAD_PUB="${NSFWDROID_APP_DIR}/.deploy-upload/cursor-cloud-agent-nsfwdroid.pub"
REMOTE_UPLOAD_INSTALL="${NSFWDROID_APP_DIR}/.deploy-upload/nsfwdroid-install-agent-ssh-key.sh"

"${SCRIPT_DIR}/cloud-agent-ssh-setup.sh" >/dev/null 2>&1 || dbg "ssh-setup not ok yet"

upload_ok=0
if [[ -f "$PUB_LOCAL" ]] && ssh -o BatchMode=yes -o ConnectTimeout=10 "${NSFWDROID_SSH_HOST_ALIAS}" true 2>/dev/null; then
  if scp -q -o BatchMode=yes "$PUB_LOCAL" "${NSFWDROID_SSH_HOST_ALIAS}:${REMOTE_HOME_PUB}" 2>/dev/null; then
    upload_ok=1
    dbg "uploaded pub to ~/${REMOTE_HOME_PUB}"
  fi
  if [[ -f "$INSTALL_LOCAL" ]]; then
  scp -q -o BatchMode=yes "$INSTALL_LOCAL" "${NSFWDROID_SSH_HOST_ALIAS}:${REMOTE_HOME_INSTALL}" 2>/dev/null \
    || dbg "scp install script to home failed"
  scp -q -o BatchMode=yes "$INSTALL_LOCAL" "${NSFWDROID_SSH_HOST_ALIAS}:${REMOTE_UPLOAD_INSTALL}" 2>/dev/null \
    || dbg ".deploy-upload not writable (expected when release chowned www-data); using ~/${REMOTE_HOME_INSTALL} for root"
  fi
fi

install_via_sudo() {
  local pub_on_droplet="$1"
  local err
  if err="$(ssh -o BatchMode=yes -o ConnectTimeout=15 "${NSFWDROID_SSH_HOST_ALIAS}" \
    "sudo -n ${REMOTE_SBIN} ${pub_on_droplet}" 2>&1)"; then
    echo "$err"
    return 0
  fi
  dbg "sudo sbin failed: $err"
  return 1
}

install_via_repo() {
  local pub_on_droplet="$1"
  local err
  if err="$(ssh -o BatchMode=yes -o ConnectTimeout=15 "${NSFWDROID_SSH_HOST_ALIAS}" \
    "test -f ${REMOTE_FALLBACK} && sudo -n bash ${REMOTE_FALLBACK} ${pub_on_droplet}" 2>&1)"; then
    echo "$err"
    return 0
  fi
  dbg "sudo repo script failed: $err"
  return 1
}

installed=0
if [[ "$upload_ok" -eq 1 ]]; then
  if out="$(install_via_sudo "${REMOTE_HOME_PUB}")"; then
    echo "$out"
    echo "Droplet authorized_keys updated via ${REMOTE_SBIN}."
    installed=1
  elif ssh -o BatchMode=yes "${NSFWDROID_SSH_HOST_ALIAS}" "test -f ${REMOTE_FALLBACK}" 2>/dev/null \
    && out="$(install_via_repo "${REMOTE_HOME_PUB}")"; then
    echo "$out"
    echo "Droplet authorized_keys updated via repo install script."
    installed=1
  fi
fi

if [[ "$installed" -eq 0 ]]; then
  echo "=== Could not install key over SSH (needs one-time droplet setup) ==="
  echo "Run on droplet as **root** (159.203.136.220):"
  echo ""
  echo "  cd ${NSFWDROID_APP_DIR}"
  echo "  ./deploy/setup-droplet-deploy-user.sh"
  echo ""
  echo "If the agent already uploaded a new public key to ~nsfwdroid-deploy/${REMOTE_HOME_PUB}:"
  echo ""
  echo "  sudo bash ~nsfwdroid-deploy/${REMOTE_HOME_INSTALL} ~nsfwdroid-deploy/${REMOTE_HOME_PUB}"
  echo ""
  echo "Or from repo after deploy/git pull:"
  echo "  sudo ./scripts/install-droplet-cloud-agent-ssh-key.sh"
  echo ""
  echo "Diagnostics: ./scripts/cloud-agent-debug-droplet-ssh.sh"
  exit 0
fi

"${SCRIPT_DIR}/cloud-agent-ssh-setup.sh"
echo "SSH ready for ${NSFWDROID_DEPLOY_SSH_USER}@${NSFWDROID_DROPLET_HOST}"