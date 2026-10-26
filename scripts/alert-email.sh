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

HOSTNAME_SHORT=$(hostname -s 2>/dev/null || hostname)
FULL_BODY="[$HOSTNAME_SHORT] $(date -Is)

$BODY

---
NSFW Droid ops alert (key=$KEY)"

APP_DIR="${NSFWDROID_APP_DIR:-/var/www/nsfwdroid}"
if [[ -d "$APP_DIR/node_modules" ]]; then
  cd "$APP_DIR"
fi

if ! npx --yes tsx scripts/send-alert-email.ts \
  --to "$TO" \
  --subject "$SUBJECT" \
  --body "$FULL_BODY"; then
  echo "[alert-email] send-alert-email.ts failed" >&2
  exit 1
fi

echo "$now" >"$stamp_file"
echo "[alert-email] sent: $SUBJECT"
