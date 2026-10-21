#!/usr/bin/env bash
# Post-ingest ops hooks: ingest freshness alerts (Mastodon runs in ingest-all.ts on success).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${NSFWDROID_APP_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
ENV_FILE="${NSFWDROID_ENV_FILE:-/etc/nsfwdroid.env}"

if [[ -r "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

cd "$APP_DIR"

"$SCRIPT_DIR/check-ingest-stale.sh" || true
"$SCRIPT_DIR/check-ingest-overdue.sh" || true
