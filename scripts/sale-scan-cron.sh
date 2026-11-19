#!/usr/bin/env bash
# Daily sale scan. Not part of catalog-ingest-cron.sh.
# Stops nsfwdroid around the PGlite write, then starts it again.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/catalog-maintenance.sh" -- bash -c 'npx --yes tsx scripts/db-migrate.ts && npx --yes tsx scripts/scan-listing-sales.ts --apply'
