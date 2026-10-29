#!/usr/bin/env bash
# Stop the app before tarball extract (PGlite must not keep catalog files open).
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root (e.g. sudo $0)." >&2
  exit 1
fi

systemctl stop nsfwdroid || true
