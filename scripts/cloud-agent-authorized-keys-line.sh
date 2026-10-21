#!/usr/bin/env bash
# Print one authorized_keys line for the Cloud Agent deploy key (restricted, no forwarding).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PUB_FILE="${1:-${REPO_ROOT}/deploy/cursor-cloud-agent-nsfwdroid.pub}"

if [[ ! -f "$PUB_FILE" ]]; then
  echo "Missing public key: $PUB_FILE" >&2
  exit 1
fi

PUB_LINE="$(tr -d '\n' < "$PUB_FILE")"
# restrict = no-agent-forwarding, no-port-forwarding, no-X11-forwarding, no-user-rc, …
echo "restrict,port-forwarding ${PUB_LINE}"
