#!/usr/bin/env bash
set -euo pipefail
ENV_FILE="${NSFWDROID_ENV_FILE:-/etc/nsfwdroid.env}"
LOG_FILE="${NSFWDROID_NEWSLETTER_LOG:-/var/log/nsfwdroid-newsletter.log}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[[ -f "$ENV_FILE" ]] && set -a && source "$ENV_FILE" && set +a
[[ "${NEWSLETTER_ENABLED:-0}" == "1" ]] || { echo "NEWSLETTER_ENABLED!=1 skip"; exit 0; }

# Cron is hourly on Saturday UTC. 21:00 America/New_York is 01:00 UTC (EDT)
# or 02:00 UTC (EST) on Saturday. Exit before catalog-maintenance so a no-op
# does not stop the site. NEWSLETTER_FORCE_WINDOW=1 is for a manual send.
if [[ "${NEWSLETTER_FORCE_WINDOW:-0}" != "1" ]]; then
  et_dow=$(TZ=America/New_York date +%u)
  et_hour=$(TZ=America/New_York date +%H)
  if [[ "$et_dow" != "5" || "$et_hour" != "21" ]]; then
    echo "[weekly-newsletter-cron] skip; America/New_York is not Friday 21:00 (dow=$et_dow hour=$et_hour)"
    exit 0
  fi
fi

# send-weekly-newsletter.ts runs as www-data and must record the week here.
STATE_DIR="${NEWSLETTER_WEEKLY_STATE_DIR:-/var/lib/nsfwdroid}"
mkdir -p "$STATE_DIR"
chown www-data:www-data "$STATE_DIR"
chmod 775 "$STATE_DIR"
preflight_body=$("$SCRIPT_DIR/newsletter-preflight.sh" 2>&1) || {
  "$SCRIPT_DIR/alert-email.sh" --key "newsletter-preflight-$(date -u +%Y-%m-%d)" \
    --subject "NSFW Droid: weekly newsletter preflight failed" --body "$preflight_body" || true
  exit 1
}
set +e
"$SCRIPT_DIR/catalog-maintenance.sh" -- npx --yes tsx scripts/send-weekly-newsletter.ts
rc=$?
set -e
if [[ "$rc" -ne 0 ]]; then
  tail_lines=$(tail -n 40 "$LOG_FILE" 2>/dev/null || true)
  "$SCRIPT_DIR/alert-email.sh" --key "newsletter-send-failed-$(date -u +%Y-%m-%d)" \
    --subject "NSFW Droid: weekly newsletter send failed" \
    --body "exit=$rc

$tail_lines

See docs/newsletter-exim-runbook.md" || true
  exit "$rc"
fi
echo "[weekly-newsletter-cron] ok"
