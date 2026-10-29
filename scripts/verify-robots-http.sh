#!/usr/bin/env bash
# Smoke-check deployed robots.txt (no secrets). Usage: ./scripts/verify-robots-http.sh [base-url]
set -euo pipefail

BASE="${1:-https://www.nsfwdroid.com}"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

curl -fsS "${BASE}/robots.txt" -o "$TMP"

if ! grep -qi 'Sitemap:.*sitemap\.xml' "$TMP"; then
  echo "FAIL: robots.txt missing Sitemap directive" >&2
  exit 1
fi

# Googlebot must not have an explicit Disallow: / (Cloudflare blocks Google-Agent, not Googlebot).
if awk '
  BEGIN { ua="" }
  /^[Uu]ser-[Aa]gent:/ { ua=$0; sub(/^[Uu]ser-[Aa]gent:[[:space:]]*/,"",ua); next }
  /^[Dd]isallow:[[:space:]]*\/[[:space:]]*$/ {
    if (ua ~ /[Gg]ooglebot/) { bad=1 }
  }
  END { exit bad ? 0 : 1 }
' "$TMP"; then
  echo "FAIL: robots.txt appears to Disallow: / for a Googlebot user-agent" >&2
  exit 1
fi

for path in "/browse" "/game/"; do
  if ! grep -q "Allow: ${path}" "$TMP"; then
    echo "FAIL: robots.txt missing Allow: ${path}" >&2
    exit 1
  fi
done

if ! grep -qi '^User-agent:[[:space:]]*Googlebot' "$TMP"; then
  echo "FAIL: robots.txt missing User-agent: Googlebot block (deploy src/app/robots.ts change)" >&2
  exit 1
fi

if grep -q 'BEGIN Cloudflare Managed content' "$TMP"; then
  echo "warn: Cloudflare Managed robots.txt block is prepended (review in CF dashboard; Googlebot not in AI-agent disallow list)"
fi

echo "ok (robots.txt sitemap + Allow paths; Googlebot not fully disallowed)"
