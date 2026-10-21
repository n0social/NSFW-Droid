#!/usr/bin/env bash
# Weekly (or manual) Exim relay smoke with ops email on failure.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${NSFWDROID_ENV_FILE:-/etc/nsfwdroid.env}"
LOG_FILE="${NSFWDROID_EXIM_SMOKE_LOG:-/var/log/nsfwdroid-exim-smoke.log}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

if [[ "${EXIM_RELAY_SMOKE_WEEKLY:-1}" == "0" ]]; then
  echo "[exim-smoke-alert] EXIM_RELAY_SMOKE_WEEKLY=0 — skip"
  exit 0
fi

mkdir -p "$(dirname "$LOG_FILE")"
stamp="[$(date -Is)]"
smoke_out=$(mktemp)
smoke_rc=0
if ! "$SCRIPT_DIR/exim-relay-smoke.sh" >"$smoke_out" 2>&1; then
  smoke_rc=1
fi

{
  echo "$stamp === exim relay smoke ==="
  cat "$smoke_out"
  echo "$stamp === $([[ $smoke_rc -eq 0 ]] && echo OK || echo FAILED) ==="
} >>"$LOG_FILE"

if [[ "$smoke_rc" -ne 0 ]]; then
  tail_lines=$(tail -n 45 "$smoke_out" 2>/dev/null || true)
  "$SCRIPT_DIR/alert-email.sh" \
    --key "exim-relay-smoke-failed" \
    --subject "NSFW Droid: Exim relay smoke test failed" \
    --body "Read-only relay smoke failed. Log: $LOG_FILE

--- smoke output (tail) ---
${tail_lines}

Re-run: scripts/exim-relay-smoke.sh"
  rm -f "$smoke_out"
  exit 1
fi
rm -f "$smoke_out"
exit 0
