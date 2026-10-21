#!/usr/bin/env bash
set -euo pipefail
ENV_FILE="${NSFWDROID_ENV_FILE:-/etc/nsfwdroid.env}"
LOG_FILE="${NSFWDROID_NEWSLETTER_LOG:-/var/log/nsfwdroid-newsletter.log}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[[ -f "$ENV_FILE" ]] && set -a && source "$ENV_FILE" && set +a
[[ "${NEWSLETTER_ENABLED:-0}" == "1" ]] || { echo "NEWSLETTER_ENABLED!=1 skip"; exit 0; }
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
