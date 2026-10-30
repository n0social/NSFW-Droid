#!/usr/bin/env bash
# Inner steps for nsfwdroid-ingest cron (invoked via catalog-maintenance.sh).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

npx --yes tsx scripts/db-migrate.ts
npx --yes tsx scripts/backfill-listing-store-descriptions.ts
npx --yes tsx scripts/recycle-stale-listings.ts --apply
if [[ "${LINK_CHECK_SAMPLE_PER_INGEST:-20}" != "0" ]]; then
  LINK_CHECK_LIMIT="${LINK_CHECK_SAMPLE_PER_INGEST:-20}" npx --yes tsx scripts/check-listing-links.ts --apply
fi
ingest_rc=0
npx --yes tsx scripts/ingest-all.ts || ingest_rc=$?

# Mastodon enqueue/drain runs inside ingest-all.ts after successful ingest_all.
"$SCRIPT_DIR/post-ingest-hooks.sh"

if (( ingest_rc != 0 )); then
  exit "$ingest_rc"
fi
