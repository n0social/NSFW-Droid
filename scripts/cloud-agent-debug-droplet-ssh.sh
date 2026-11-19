#!/usr/bin/env bash
# Diagnostics for Cloud Agent → droplet SSH (safe to run every turn; no secrets printed).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source=cloud-agent-droplet-ssh-vars.sh
source "${SCRIPT_DIR}/cloud-agent-droplet-ssh-vars.sh"

ARTIFACT="${1:-/opt/cursor/artifacts/droplet-ssh-debug.md}"
mkdir -p "$(dirname "$ARTIFACT")"

KEY="${HOME}/.ssh/cursor-cloud-agent-nsfwdroid"
PUB_LOCAL="${REPO_ROOT}/deploy/cursor-cloud-agent-nsfwdroid.pub"
STAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

log() {
  echo "$*" | tee -a "$ARTIFACT"
}

: >"$ARTIFACT"
log "# Droplet SSH debug ($STAMP UTC)"
log ""

log "## Agent VM"
log "- deploy_ssh_user: ${NSFWDROID_DEPLOY_SSH_USER}"
log "- host: ${NSFWDROID_DROPLET_HOST} (alias ${NSFWDROID_SSH_HOST_ALIAS})"
log "- private_key: $([[ -f $KEY ]] && echo present || echo missing)"
if [[ -n "${CURSOR_CLOUD_AGENT_NSFWDROID_PRIVATE_KEY:-}" ]]; then
  log "- env secret CURSOR_CLOUD_AGENT_NSFWDROID_PRIVATE_KEY: set"
else
  log "- env secret CURSOR_CLOUD_AGENT_NSFWDROID_PRIVATE_KEY: not set"
fi
if [[ -f "$PUB_LOCAL" ]]; then
  log "- repo pub fingerprint: $(ssh-keygen -lf "$PUB_LOCAL" 2>/dev/null | awk '{print $2}')"
else
  log "- repo pub: missing"
fi

log ""
log "## ssh-setup"
if "${SCRIPT_DIR}/cloud-agent-ssh-setup.sh" >>"$ARTIFACT" 2>&1; then
  log "- ssh-setup: ok"
else
  log "- ssh-setup: failed (see output above)"
fi

log ""
log "## Remote (batch SSH)"
REMOTE_CMD='
set +e
echo "- hostname: $(hostname)"
echo "- app_dir: '"${NSFWDROID_APP_DIR}"'"
echo "- env_readable: $(test -r /etc/nsfwdroid.env && echo yes || echo no)"
echo "- groups: $(id -Gn)"
echo "- sbin_install_agent: $(test -x /usr/local/sbin/nsfwdroid-install-agent-ssh-key.sh && echo yes || echo no)"
echo "- sbin_prepare_tarball: $(test -x /usr/local/sbin/nsfwdroid-deploy-prepare-tarball.sh && echo yes || echo no)"
echo "- repo_install_script: $(test -f '"${NSFWDROID_APP_DIR}"'/deploy/nsfwdroid-install-agent-ssh-key.sh && echo yes || echo no)"
echo "- deploy_upload_writable: $(test -w '"${NSFWDROID_APP_DIR}"'/.deploy-upload 2>/dev/null && echo yes || echo no)"
echo "- home_writable: $(test -w "$HOME" && echo yes || echo no)"
if sudo -n true 2>/dev/null; then echo "- sudo_nopasswd: partial"; else echo "- sudo_nopasswd: none for generic true"; fi
sudo -n -l 2>/dev/null | sed "s/^/- sudoers: /" || echo "- sudoers: (could not list)"
AUTH=/home/nsfwdroid-deploy/.ssh/authorized_keys
if [[ -f $AUTH ]]; then
  echo "- authorized_keys lines with cursor-cloud-agent: $(grep -c cursor-cloud-agent-nsfwdroid "$AUTH" || true)"
  ssh-keygen -lf /dev/null 2>/dev/null # no-op
  head -1 <(grep cursor-cloud-agent-nsfwdroid "$AUTH" || true) | while read -r line; do
    keypart="${line#restrict,port-forwarding }"
    keypart="${keypart#restrict, }"
    [[ "$keypart" != ssh-* ]] && continue
    echo "$keypart" > /tmp/agent-pub-line
    fp="$(ssh-keygen -lf /tmp/agent-pub-line 2>/dev/null | awk "{print \$2}")"
    [[ -n "$fp" ]] && echo "- droplet_live_fp: $fp"
  done
else
  echo "- authorized_keys: missing"
fi
'

if ssh -o BatchMode=yes -o ConnectTimeout=15 "${NSFWDROID_SSH_HOST_ALIAS}" "bash -s" <<<"$REMOTE_CMD" >>"$ARTIFACT" 2>&1 \
  && grep -q "^- hostname:" "$ARTIFACT"; then
  log "- remote probe: ok"
else
  log "- remote probe: failed (no SSH or host down)"
fi

if [[ -f "$PUB_LOCAL" ]] && grep -q "^- droplet_live_fp:" "$ARTIFACT"; then
  repo_fp="$(ssh-keygen -lf "$PUB_LOCAL" 2>/dev/null | awk '{print $2}')"
  live_fp="$(grep '^- droplet_live_fp:' "$ARTIFACT" | tail -1 | awk '{print $3}')"
  if [[ "$repo_fp" == "$live_fp" ]]; then
    log "- fingerprint_match: yes (repo pub matches authorized_keys)"
  else
    log "- fingerprint_match: no (repo $repo_fp vs droplet $live_fp) — run enable-droplet-ssh or owner root install"
  fi
fi

log ""
log "## Recommended next steps"
if grep -q "sbin_install_agent: no" "$ARTIFACT" 2>/dev/null; then
  log "1. On droplet as **root** (phone SSH): \`cd ${NSFWDROID_APP_DIR} && ./deploy/setup-droplet-deploy-user.sh\`"
  log "   (installs \`/usr/local/sbin/nsfwdroid-install-agent-ssh-key.sh\` + sudoers)"
fi
log "2. Agent: \`./scripts/cloud-agent-enable-droplet-ssh.sh --skip-keygen\`"
log "3. Cursor secret: \`CURSOR_CLOUD_AGENT_NSFWDROID_PRIVATE_KEY\` then **new agent run**"
log ""
log "Root-only install (when agent uploaded pub to home):"
log "  sudo bash ${NSFWDROID_APP_DIR}/.deploy-upload/nsfwdroid-install-agent-ssh-key.sh \\"
log "    /home/nsfwdroid-deploy/agent.pub"

echo "Wrote $ARTIFACT"