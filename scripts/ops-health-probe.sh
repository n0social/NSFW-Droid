#!/usr/bin/env bash
# Shared /api/health probe for ops scripts (watchdog, weekly maintenance).
# Fetches JSON even on HTTP 503 (degraded catalog). Source from other scripts; do not run directly.
set -euo pipefail

health_fetch() {
  local url="${1:-${HEALTH_URL:-http://127.0.0.1:3000/api/health}}"
  local raw=""
  raw=$(curl -sS --max-time 15 -w $'\n%{http_code}' "$url" 2>/dev/null) || {
    HEALTH_FETCH_CODE="0"
    HEALTH_FETCH_BODY=""
    return 1
  }
  HEALTH_FETCH_CODE="${raw##*$'\n'}"
  HEALTH_FETCH_BODY="${raw%$'\n'*}"
  return 0
}

health_probe_analyze() {
  local body="${1:-}"
  local code="${2:-0}"
  HEALTH_PROBE_JSON=$(node -e '
const body = process.argv[1] ?? "";
const code = process.argv[2] ?? "0";
let parsed = null;
try {
  parsed = body ? JSON.parse(body) : null;
} catch {
  parsed = null;
}
const status = parsed?.status ?? null;
const catalogHealthy = parsed?.catalog?.healthy;
const catalogError = parsed?.catalog?.error ?? null;
const ok = parsed && status === "ok" && catalogHealthy === true;
const parts = [];
if (!parsed) parts.push("health response not JSON");
else {
  parts.push(`status=${status ?? "unknown"}`);
  if (catalogHealthy === false) parts.push("catalog unhealthy (degraded)");
  if (catalogError) parts.push(`catalog.error=${catalogError}`);
}
parts.push(`http=${code}`);
process.stdout.write(JSON.stringify({
  ok,
  httpCode: Number(code) || 0,
  status,
  catalogHealthy: catalogHealthy ?? null,
  catalogError,
  summary: ok ? "ok" : parts.join("; "),
}));
' "$body" "$code")
}

health_probe_ok() {
  health_probe_analyze "${HEALTH_FETCH_BODY:-}" "${HEALTH_FETCH_CODE:-0}"
  node -e 'const j=JSON.parse(process.argv[1]); process.exit(j.ok?0:1)' "$HEALTH_PROBE_JSON"
}

health_probe_summary() {
  node -e 'const j=JSON.parse(process.argv[1]); process.stdout.write(j.summary||"")' "${HEALTH_PROBE_JSON:-{\"summary\":\"\"}}"
}

health_probe_detail_block() {
  local url="${1:-${HEALTH_URL:-http://127.0.0.1:3000/api/health}}"
  health_probe_analyze "${HEALTH_FETCH_BODY:-}" "${HEALTH_FETCH_CODE:-0}"
  node -e '
const j = JSON.parse(process.argv[1]);
const url = process.argv[2];
const lines = [`Health URL: ${url}`, `HTTP: ${j.httpCode}`, `Summary: ${j.summary}`];
if (j.catalogError) lines.push(`Catalog error: ${j.catalogError}`);
if (j.status === "degraded") {
  lines.push("", "The app returned status=degraded (catalog DB unavailable or wedged).",
    "Common fix: stop nsfwdroid during ingest, or remove stale data/catalog/postmaster.pid.");
}
process.stdout.write(lines.join("\n"));
' "$HEALTH_PROBE_JSON" "$url"
}
