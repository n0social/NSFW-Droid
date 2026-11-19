#!/usr/bin/env bash
# On the production droplet as root — sync authorized_keys from deploy/cursor-cloud-agent-nsfwdroid.pub.
# Usage (laptop SSH):
#   cd /var/www/nsfwdroid && git pull && sudo ./scripts/install-droplet-cloud-agent-ssh-key.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ "$(id -u)" -ne 0 ]]; then
  exec sudo -n bash "$0" "$@" 2>/dev/null || exec sudo bash "$0" "$@"
fi

exec bash "${REPO_ROOT}/deploy/nsfwdroid-install-agent-ssh-key.sh" "$@"