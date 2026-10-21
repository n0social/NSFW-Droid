#!/usr/bin/env bash
# Inner steps for nsfwdroid-ingest cron (invoked via catalog-maintenance.sh).
set -euo pipefail
npx --yes tsx scripts/db-migrate.ts
npx --yes tsx scripts/recycle-stale-listings.ts --apply
if [[ "${LINK_CHECK_SAMPLE_PER_INGEST:-20}" != "0" ]]; then
  LINK_CHECK_LIMIT="${LINK_CHECK_SAMPLE_PER_INGEST:-20}" npx --yes tsx scripts/check-listing-links.ts --apply
fi
ingest_rc=0
npx --yes tsx scripts/ingest-all.ts || ingest_rc=$?

# Social queue is independent of ingest-all success (e.g. duplicate slug during
# auto-publish should not skip Mastodon enqueue/drain for listings already live).
if [[ "${SOCIAL_MASTODON_ENABLED:-0}" == "1" ]] || [[ "${SOCIAL_ENQUEUE_ENABLED:-0}" == "1" ]] || [[ "${PILLOWFORT_ENABLED:-0}" == "1" ]]; then
  SOCIAL_LOG="${NSFWDROID_SOCIAL_LOG:-/var/log/nsfwdroid-social.log}"
  npx --yes tsx scripts/social-enqueue.ts >>"$SOCIAL_LOG" 2>&1 || true
  npx --yes tsx scripts/social-drain.ts >>"$SOCIAL_LOG" 2>&1 || true
fi
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/check-ingest-stale.sh"
if (( ingest_rc != 0 )); then
  exit "$ingest_rc"
fi
