#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/ops-health-probe.sh"
HEALTH_FETCH_BODY='{"status":"ok","catalog":{"healthy":true}}'
HEALTH_FETCH_CODE="200"
health_probe_analyze "$HEALTH_FETCH_BODY" "$HEALTH_FETCH_CODE"
node -e 'const j=JSON.parse(process.argv[1]); if(!j.ok) process.exit(1)' "$HEALTH_PROBE_JSON"
HEALTH_FETCH_BODY='{"status":"degraded","catalog":{"healthy":false,"error":"PGlite failed"}}'
HEALTH_FETCH_CODE="503"
health_probe_analyze "$HEALTH_FETCH_BODY" "$HEALTH_FETCH_CODE"
node -e 'const j=JSON.parse(process.argv[1]); if(j.ok||j.status!=="degraded") process.exit(1)' "$HEALTH_PROBE_JSON"
echo "health-probe-selftest: ok"
