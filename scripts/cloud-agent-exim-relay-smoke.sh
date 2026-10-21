#!/usr/bin/env bash
# From a Cloud Agent VM: SSH to the droplet and run read-only Exim relay checks.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOST_ALIAS="${NSFWDROID_SSH_HOST:-nsfwdroid-droplet}"
SETUP="${SCRIPT_DIR}/cloud-agent-ssh-setup.sh"

if [[ -x "$SETUP" ]]; then
  "$SETUP"
elif [[ -f "$SETUP" ]]; then
  bash "$SETUP"
else
  echo "Note: ${SETUP} not found; assuming SSH config for ${HOST_ALIAS} is already wired." >&2
fi

exec ssh -o BatchMode=yes "${HOST_ALIAS}" 'bash -s' < "${SCRIPT_DIR}/exim-relay-smoke.sh"
