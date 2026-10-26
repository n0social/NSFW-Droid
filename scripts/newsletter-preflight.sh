#!/usr/bin/env bash
set -euo pipefail
ENV_FILE="${NSFWDROID_ENV_FILE:-/etc/nsfwdroid.env}"
HEALTH_URL="${NSFWDROID_HEALTH_URL:-http://127.0.0.1:3000/api/health}"
failures=() warnings=()
note_failure() { failures+=("$1"); }
note_warning() { warnings+=("$1"); }
if [[ -f "$ENV_FILE" ]]; then set -a; source "$ENV_FILE"; set +a; fi
[[ "${NEWSLETTER_ENABLED:-0}" == "1" ]] || note_failure "NEWSLETTER_ENABLED is not 1"
transport_lc=$(echo "${NEWSLETTER_TRANSPORT:-sendmail}" | tr '[:upper:]' '[:lower:]')
if [[ "$transport_lc" == "brevo" ]]; then
  note_failure "NEWSLETTER_TRANSPORT=brevo is not used; set NEWSLETTER_TRANSPORT=sendmail (Exim on droplet)"
elif [[ "$transport_lc" == "sendmail" ]]; then
  command -v sendmail >/dev/null 2>&1 || [[ -x "${SENDMAIL_PATH:-/usr/sbin/sendmail}" ]] || note_failure "sendmail missing"
  command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet exim4 2>/dev/null || note_failure "exim4 not active"
else
  note_failure "unknown NEWSLETTER_TRANSPORT=$transport_lc (use sendmail)"
fi
[[ -n "${NEWSLETTER_TOKEN_SECRET:-}" || -n "${SESSION_SECRET:-}" ]] || note_failure "signing secret unset"
if command -v curl >/dev/null 2>&1; then
  health_body=$(curl -sf --max-time 15 "$HEALTH_URL" 2>/dev/null || true)
  [[ -n "$health_body" ]] || note_warning "health unreachable"
  [[ "$health_body" == *'"signingSecretConfigured":false'* ]] && note_failure "health signingSecretConfigured=false"
fi
echo "[newsletter-preflight] transport=$transport_lc"
for w in "${warnings[@]:-}"; do echo "warning: $w"; done
if ((${#failures[@]})); then for f in "${failures[@]}"; do echo "FAIL: $f" >&2; done; exit 1; fi
echo ok
