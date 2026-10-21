#!/usr/bin/env bash
# Send a one-off ops alert to ALERT_EMAIL_TO (dedupe key is unique per run).
# Safe for production: TEST subject, no state changes. Sources /etc/nsfwdroid.env via alert-email.sh.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/alert-email.sh" \
  --key "ops-selftest-$(date -u +%Y%m%d-%H%M%S)" \
  --subject "[NSFW Droid TEST] Ops alert routing self-test" \
  --body "If you received this message, scripts/alert-email.sh delivered mail to ALERT_EMAIL_TO using Resend (when RESEND_API_KEY is set) or SMTP/sendmail fallback."
