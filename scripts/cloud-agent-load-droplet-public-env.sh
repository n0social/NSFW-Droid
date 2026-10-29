#!/usr/bin/env bash
# Export NEXT_PUBLIC_* from droplet /etc/nsfwdroid.env for local `npm run build` (Cloud Agent deploy).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=cloud-agent-droplet-ssh-vars.sh
source "${SCRIPT_DIR}/cloud-agent-droplet-ssh-vars.sh"

"${SCRIPT_DIR}/cloud-agent-ssh-setup.sh"

HOST_ALIAS="${NSFWDROID_SSH_HOST_ALIAS}"

echo "Loading NEXT_PUBLIC_* from ${HOST_ALIAS}:/etc/nsfwdroid.env ..."

mapfile -t _lines < <(
  ssh "${HOST_ALIAS}" 'bash -s' <<'REMOTE'
set -euo pipefail
if [[ ! -r /etc/nsfwdroid.env ]]; then
  echo "ERROR: /etc/nsfwdroid.env not readable" >&2
  exit 1
fi
set -a
# shellcheck disable=SC1091
source /etc/nsfwdroid.env
set +a
env | grep '^NEXT_PUBLIC_' || true
REMOTE
)

count=0
for line in "${_lines[@]}"; do
  [[ -z "$line" ]] && continue
  export "$line"
  count=$((count + 1))
done

if [[ "$count" -eq 0 ]]; then
  echo "No NEXT_PUBLIC_* variables found on droplet." >&2
  exit 1
fi

echo "Exported ${count} NEXT_PUBLIC_* variable(s) for this shell."
