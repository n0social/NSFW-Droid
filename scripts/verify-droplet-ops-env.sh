#!/usr/bin/env bash
# Production ops preflight: alert routing + watchdog flags (no secrets printed).
set -euo pipefail

ENV_FILE="${NSFWDROID_ENV_FILE:-/etc/nsfwdroid.env}"
fail=0

if [[ ! -f "$ENV_FILE" ]]; then
  echo "FAIL: missing $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

check_set() {
  local name="$1"
  local val="$2"
  if [[ -z "${val// }" ]]; then
    echo "FAIL: $name is unset or empty" >&2
    fail=1
  else
    echo "ok: $name is set"
  fi
}

TO="${ALERT_EMAIL_TO:-${ALERT_EMAIL:-}}"
check_set "ALERT_EMAIL_TO" "$TO"
check_set "ALERT_EMAIL_FROM" "${ALERT_EMAIL_FROM:-}"

transport="${ALERT_EMAIL_TRANSPORT:-sendmail}"
echo "info: ALERT_EMAIL_TRANSPORT=${transport}"
if [[ "$transport" == "smtp" ]]; then
  check_set "SMTP_HOST" "${SMTP_HOST:-}"
  check_set "SMTP_USER" "${SMTP_USER:-}"
  check_set "SMTP_PASS" "${SMTP_PASS:-}"
fi

echo "info: WATCHDOG_RESTART=${WATCHDOG_RESTART:-1}"
echo "info: CADDY_WATCHDOG_RESTART=${CADDY_WATCHDOG_RESTART:-1}"

if [[ "$fail" -ne 0 ]]; then
  echo "Fix $ENV_FILE then run: ./scripts/ops-alert-email-test.sh" >&2
  exit 1
fi

echo "verify-droplet-ops-env: ok"
