#!/usr/bin/env bash
# Ops alert email with deduplication (default: same key max once per 30 minutes).
# Delivery: local Exim sendmail (droplet default), optional SMTP via curl.
# Sources /etc/nsfwdroid.env when present. Requires ALERT_EMAIL_TO to send.
set -euo pipefail

APP_DIR="${NSFWDROID_APP_DIR:-/var/www/nsfwdroid}"
ENV_FILE="${NSFWDROID_ENV_FILE:-/etc/nsfwdroid.env}"
DEDUPE_DIR="${ALERT_DEDUPE_DIR:-/var/lib/nsfwdroid/alert-dedupe}"
DEDUPE_MINUTES="${ALERT_DEDUPE_MINUTES:-30}"

usage() {
  echo "Usage: $0 --key <dedupe-key> --subject <subject> [--body <text>]" >&2
  exit 2
}

KEY=""
SUBJECT=""
BODY=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --key) KEY="${2:-}"; shift 2 ;;
    --subject) SUBJECT="${2:-}"; shift 2 ;;
    --body) BODY="${2:-}"; shift 2 ;;
    -h|--help) usage ;;
    *) echo "Unknown arg: $1" >&2; usage ;;
  esac
done

[[ -n "$KEY" && -n "$SUBJECT" ]] || usage
if [[ -z "$BODY" ]]; then
  BODY="$SUBJECT"
fi

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

TO="${ALERT_EMAIL_TO:-${ALERT_EMAIL:-}}"
if [[ -z "$TO" ]]; then
  echo "[alert-email] ALERT_EMAIL_TO (or ALERT_EMAIL) unset — skipping: $SUBJECT" >&2
  exit 0
fi

mkdir -p "$DEDUPE_DIR"
safe_key=$(echo "$KEY" | tr -c 'a-zA-Z0-9._-' '_')
stamp_file="$DEDUPE_DIR/$safe_key"
now=$(date +%s)
if [[ -f "$stamp_file" ]]; then
  last=$(cat "$stamp_file" 2>/dev/null || echo 0)
  if [[ "$last" =~ ^[0-9]+$ ]] && (( now - last < DEDUPE_MINUTES * 60 )); then
    echo "[alert-email] deduped key=$KEY (${DEDUPE_MINUTES}m window)"
    exit 0
  fi
fi

FROM="${ALERT_EMAIL_FROM:-alerts@nsfwdroid.com}"
HOSTNAME_SHORT=$(hostname -s 2>/dev/null || hostname)
FULL_BODY="[$HOSTNAME_SHORT] $(date -Is)

$BODY

---
NSFW Droid ops alert (key=$KEY)"

sendmail_bin() {
  if [[ -n "${SENDMAIL_PATH:-}" && -x "${SENDMAIL_PATH}" ]]; then
    echo "$SENDMAIL_PATH"
    return 0
  fi
  if command -v sendmail >/dev/null 2>&1; then
    command -v sendmail
    return 0
  fi
  if [[ -x /usr/sbin/sendmail ]]; then
    echo /usr/sbin/sendmail
    return 0
  fi
  return 1
}

transport_lc=$(echo "${ALERT_EMAIL_TRANSPORT:-sendmail}" | tr '[:upper:]' '[:lower:]')
sent=false

try_sendmail() {
  local bin
  bin=$(sendmail_bin) || return 1
  {
    echo "To: $TO"
    echo "From: $FROM"
    echo "Subject: $SUBJECT"
    echo
    echo "$FULL_BODY"
  } | "$bin" -t -oi
}

if [[ "$transport_lc" != "smtp" ]]; then
  try_sendmail && sent=true
fi

if [[ "$sent" == false && -n "${SMTP_HOST:-}" ]]; then
  SMTP_PORT="${SMTP_PORT:-587}"
  SMTP_USER="${SMTP_USER:-}"
  SMTP_PASS="${SMTP_PASS:-}"
  if command -v curl >/dev/null; then
    url="smtp://${SMTP_HOST}:${SMTP_PORT}"
    auth=()
    if [[ -n "$SMTP_USER" ]]; then
      auth=(--mail-user "$SMTP_USER:$SMTP_PASS")
    fi
    if curl -sf --max-time 30 "${auth[@]}" \
      --mail-from "$FROM" \
      --mail-rcpt "$TO" \
      --url "$url" \
      -T - <<<"Subject: $SUBJECT

$FULL_BODY"; then
      sent=true
    fi
  fi
fi

if [[ "$sent" == false && "$transport_lc" == "smtp" ]]; then
  try_sendmail && sent=true
fi

if [[ "$sent" == false ]]; then
  echo "[alert-email] no mail transport configured (install Exim/sendmail or set SMTP_HOST; ALERT_EMAIL_TRANSPORT=sendmail|smtp)" >&2
  exit 1
fi

echo "$now" >"$stamp_file"
echo "[alert-email] sent: $SUBJECT"
