#!/usr/bin/env bash
# From a Cloud Agent: SSH to the droplet and install cron.d from /var/www/nsfwdroid.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"${SCRIPT_DIR}/cloud-agent-ssh-setup.sh"
ssh nsfwdroid-droplet "NSFWDROID_APP_DIR=/var/www/nsfwdroid bash -s" < "${SCRIPT_DIR}/install-droplet-cron.sh"
