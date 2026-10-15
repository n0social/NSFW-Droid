#!/usr/bin/env bash
# Inner steps for nsfwdroid-ingest cron (invoked via catalog-maintenance.sh).
set -euo pipefail
npx --yes tsx scripts/db-migrate.ts
npx --yes tsx scripts/recycle-stale-listings.ts --apply
npx --yes tsx scripts/ingest-all.ts
