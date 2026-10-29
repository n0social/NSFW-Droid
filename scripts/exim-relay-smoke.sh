#!/usr/bin/env bash
# Read-only Exim relay smoke test for the production droplet.
# Run on the server as root (or via cloud-agent-exim-relay-smoke.sh over SSH).
# Confirms: loopback-only listener, no open relay from the internet, www-data can route outbound mail.
set -euo pipefail

failures=0
note() { printf '%s\n' "$*"; }
ok() { note "OK: $*"; }
bad() { note "FAIL: $*"; failures=$((failures + 1)); }

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    bad "missing command: $1"
    return 1
  fi
  return 0
}

require_cmd systemctl || true
require_cmd exim || true
require_cmd ss || true

note "=== exim-relay-smoke ($(date -u +%Y-%m-%dT%H:%M:%SZ)) ==="

if command -v systemctl >/dev/null 2>&1; then
  if systemctl is-active --quiet exim4; then
    ok "exim4 is active"
  else
    bad "exim4 is not active ($(systemctl is-active exim4 2>/dev/null || echo unknown))"
  fi
else
  note "SKIP: systemctl not available"
fi

if command -v exim >/dev/null 2>&1; then
  primary="$(exim -bP primary_hostname 2>/dev/null | awk '{print $NF}' || true)"
  [[ -n "$primary" ]] && ok "primary_hostname=${primary}" || bad "could not read primary_hostname"
  li="$(exim -bP local_interfaces 2>/dev/null || true)"
  if [[ "$li" == *127.0.0.1* && "$li" == *::1* && "$li" != *0.0.0.0* ]]; then
    ok "local_interfaces loopback only (${li})"
  else
    bad "local_interfaces not loopback-only: ${li:-<empty>}"
  fi
else
  bad "exim binary missing"
fi

conf=/etc/exim4/update-exim4.conf.conf
if [[ -f "$conf" ]]; then
  if grep -q "dc_relay_nets=''" "$conf"; then
    ok "dc_relay_nets is empty in ${conf}"
  else
    bad "dc_relay_nets is not empty — review ${conf}"
  fi
  if grep -q "dc_local_interfaces='127.0.0.1 ; ::1'" "$conf"; then
    ok "dc_local_interfaces restricted to loopback in ${conf}"
  else
    bad "dc_local_interfaces not loopback in ${conf}"
  fi
else
  bad "missing ${conf}"
fi

macros=/etc/exim4/exim4.conf.localmacros
if [[ -f "$macros" ]]; then
  if grep -q 'MAIN_TRUSTED_USERS = www-data' "$macros"; then
    ok "MAIN_TRUSTED_USERS includes www-data"
  else
    bad "MAIN_TRUSTED_USERS does not include www-data in ${macros}"
  fi
else
  note "WARN: ${macros} not found (DKIM/trusted-user macros may be unset)"
fi

if command -v ss >/dev/null 2>&1; then
  if ss -lnt 2>/dev/null | awk 'NR>1 {print $4}' | grep -qE ':25$'; then
    if ss -lnt 2>/dev/null | grep ':25' | grep -qvE '127\.0\.0\.1:25|\[::1\]:25'; then
      bad "SMTP :25 listening on a non-loopback address"
    else
      ok "SMTP :25 listens on loopback only"
    fi
  else
    note "WARN: no :25 listener seen (exim down?)"
  fi
fi

if command -v exim >/dev/null 2>&1; then
  probe_out="$(exim -bh 203.0.113.50 2>&1 <<'SMTP' || true
EHLO relay-probe.example
MAIL FROM:<probe@evil.example>
RCPT TO:<relay-smoke@gmail.com>
QUIT
SMTP
)"
  if grep -q 'relay not permitted' <<<"$probe_out"; then
    ok "simulated remote client (203.0.113.50) cannot relay"
  else
    bad "simulated remote client did not get 'relay not permitted'"
    note "$probe_out"
  fi

  if id www-data >/dev/null 2>&1; then
    route_out="$(sudo -u www-data exim -bt relay-smoke@gmail.com 2>&1 || true)"
    if grep -q 'router = dnslookup' <<<"$route_out"; then
      ok "www-data can route outbound mail (dnslookup)"
    else
      bad "www-data outbound routing check failed"
      note "$route_out"
    fi
  else
    note "SKIP: www-data user missing"
  fi
fi

note "=== done (failures=${failures}) ==="
if [[ "$failures" -gt 0 ]]; then
  exit 1
fi
exit 0
