#!/usr/bin/env bash
# Watchdog: restart Caddy if the unit is down (reverse proxy / TLS / maintenance.html).
# CADDY_WATCHDOG_RESTART=0 → alert only (no systemctl restart).
set -euo pipefail

SERVICE="${CADDY_SERVICE:-caddy}"
LOG_FILE="${CADDY_WATCHDOG_LOG:-/var/log/nsfwdroid-caddy-watchdog.log}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${NSFWDROID_ENV_FILE:-/etc/nsfwdroid.env}"

log() { echo "[$(date -Is)] [ensure-caddy] $*" | tee -a "$LOG_FILE"; }

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

CADDY_WATCHDOG_RESTART="${CADDY_WATCHDOG_RESTART:-1}"

service_active() { systemctl is-active --quiet "$SERVICE"; }

if service_active; then
  exit 0
fi

reason="systemd unit $SERVICE is inactive"
detail="systemctl status $SERVICE --no-pager -n 20"

if [[ "$CADDY_WATCHDOG_RESTART" == "0" ]]; then
  log "CADDY_WATCHDOG_RESTART=0 — alerting only ($reason)"
  "$SCRIPT_DIR/alert-email.sh" --key "caddy-watchdog-alert-only" \
    --subject "NSFW Droid: Caddy inactive (no restart)" \
    --body "CADDY_WATCHDOG_RESTART=0 alert-only mode.

Issue: $reason

Run on droplet:
  systemctl status $SERVICE
  journalctl -u $SERVICE -n 80 --no-pager"
  exit 0
fi

log "recovering: $reason"
if ! systemctl restart "$SERVICE"; then
  systemctl reset-failed "$SERVICE" 2>/dev/null || true
  if ! systemctl restart "$SERVICE"; then
    "$SCRIPT_DIR/alert-email.sh" --key "caddy-watchdog-restart-failed" \
      --subject "NSFW Droid: could not restart Caddy (502 risk)" \
      --body "Reason: $reason

journalctl -u $SERVICE -n 80 --no-pager"
    exit 1
  fi
fi

sleep 2
if service_active; then
  log "recovery ok"
  exit 0
fi

"$SCRIPT_DIR/alert-email.sh" --key "caddy-watchdog-recovery-incomplete" \
  --subject "NSFW Droid: Caddy still inactive after restart" \
  --body "Initial: $reason

After systemctl restart, unit is still not active.

journalctl -u $SERVICE -n 80 --no-pager"
exit 1
