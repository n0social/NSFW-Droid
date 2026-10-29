#!/usr/bin/env bash
# From a Cloud Agent: SSH to the droplet and install cron.d from /var/www/nsfwdroid.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=cloud-agent-droplet-ssh-vars.sh
source "${SCRIPT_DIR}/cloud-agent-droplet-ssh-vars.sh"

"${SCRIPT_DIR}/cloud-agent-ssh-setup.sh"

if [[ "${NSFWDROID_DEPLOY_SSH_USER}" == "root" ]]; then
  ssh "${NSFWDROID_SSH_HOST_ALIAS}" "NSFWDROID_APP_DIR=${NSFWDROID_APP_DIR} bash -s" \
    < "${SCRIPT_DIR}/install-droplet-cron.sh"
else
  ssh "${NSFWDROID_SSH_HOST_ALIAS}" "sudo NSFWDROID_APP_DIR=${NSFWDROID_APP_DIR} /usr/local/sbin/nsfwdroid-install-droplet-cron.sh"
fi
