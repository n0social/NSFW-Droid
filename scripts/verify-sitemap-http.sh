#!/usr/bin/env bash
# Smoke-check a deployed sitemap (no secrets). Usage: ./scripts/verify-sitemap-http.sh [base-url]
set -euo pipefail

BASE="${1:-https://www.nsfwdroid.com}"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

curl -fsS "${BASE}/sitemap.xml" -o "$TMP"
LOCS="$(grep -c '<loc>' "$TMP" || true)"
BAD="$(grep -cE '/game/[^<]*-https://</loc>' "$TMP" || true)"
GAMES="$(grep -c '<loc>[^<]*/game/' "$TMP" || true)"

echo "sitemap: locs=${LOCS} game_urls=${GAMES} malformed_game_slugs=${BAD}"

if [[ "$LOCS" -lt 100 ]]; then
  echo "FAIL: expected catalog game URLs in sitemap (got only ${LOCS} locs)" >&2
  exit 1
fi
if [[ "$BAD" -ne 0 ]]; then
  echo "FAIL: sitemap still lists ingest-junk slugs ending in -https://" >&2
  exit 1
fi
echo "ok"
