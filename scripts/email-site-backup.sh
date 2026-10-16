#!/usr/bin/env bash
# Email a site backup tarball via Resend (attachments; auto-split for Gmail ~25MB limit).
# Usage: email-site-backup.sh <to-email> <path-to.tar.gz>
# Requires RESEND_API_KEY in /etc/nsfwdroid.env (or env). Uses ALERT_EMAIL_FROM when set.
set -euo pipefail

TO="${1:?recipient email}"
ARCHIVE="${2:?path to .tar.gz}"
ENV_FILE="${NSFWDROID_ENV_FILE:-/etc/nsfwdroid.env}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

FROM="${ALERT_EMAIL_FROM:-alerts@nsfwdroid.com}"
SUBJECT="${BACKUP_EMAIL_SUBJECT:-NSFW Droid site_launch_01_default backup}"

if [[ -z "${RESEND_API_KEY:-}" ]]; then
  echo "[email-site-backup] RESEND_API_KEY not set (add to $ENV_FILE)" >&2
  exit 1
fi

if [[ ! -f "$ARCHIVE" ]]; then
  echo "[email-site-backup] missing file: $ARCHIVE" >&2
  exit 1
fi

MANIFEST_BODY=""
for m in "$(dirname "$ARCHIVE")/site_launch_01_default/MANIFEST.txt" \
         "/var/backups/nsfwdroid/site_launch_01_default/MANIFEST.txt"; do
  if [[ -f "$m" ]]; then
    MANIFEST_BODY=$(cat "$m")
    break
  fi
done

RESTORE=$(cat <<'EOF'
Restore (on droplet as root):
  tar -xzf site_launch_01_default_YYYYMMDD.tar.gz -C /var/www
  cd /var/www/nsfwdroid && npm ci --omit=dev && systemctl restart nsfwdroid
Ensure /etc/nsfwdroid.env exists (not in archive). Verify: curl -sf http://localhost:3000/api/health

If you received split parts (part_00, part_01, ...):
  cat site_launch_01_default_20261015.tar.gz.part_* > site_launch_01_default_20261015.tar.gz
EOF
)

BASE_TEXT="NSFW Droid launch backup delivery.

MANIFEST:
${MANIFEST_BODY:-"(MANIFEST.txt not found on server)"}

${RESTORE}
"

# Gmail practical limit ~25MB; Resend allows larger but recipients may reject. Split at 20MiB.
MAX_PART=$((20 * 1024 * 1024))
SIZE=$(stat -c%s "$ARCHIVE")
WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT

send_one() {
  local file="$1"
  local part_label="$2"
  local subject="$SUBJECT"
  [[ -n "$part_label" ]] && subject="$SUBJECT ($part_label)"

  local fname
  fname=$(basename "$file")

  local json_file
  json_file=$(mktemp)
  FROM="$FROM" TO="$TO" SUBJECT="$subject" BODY="$BASE_TEXT" FNAME="$fname" PART_FILE="$file" \
    node <<'NODE' >"$json_file"
const fs = require("fs");
const payload = {
  from: process.env.FROM,
  to: [process.env.TO],
  subject: process.env.SUBJECT,
  text: process.env.BODY,
  attachments: [{
    filename: process.env.FNAME,
    content: fs.readFileSync(process.env.PART_FILE).toString("base64"),
  }],
};
process.stdout.write(JSON.stringify(payload));
NODE

  local http_code
  http_code=$(curl -sS --max-time 300 -w "%{http_code}" -o /tmp/resend-email-response.json -X POST "https://api.resend.com/emails" \
    -H "Authorization: Bearer $RESEND_API_KEY" \
    -H "Content-Type: application/json" \
    -d @"$json_file")
  rm -f "$json_file"
  if [[ "$http_code" != "200" ]]; then
    echo "[email-site-backup] Resend API HTTP $http_code: $(cat /tmp/resend-email-response.json)" >&2
    exit 1
  fi
  echo "[email-site-backup] Resend ok: $(cat /tmp/resend-email-response.json)"
}

if (( SIZE <= MAX_PART )); then
  echo "[email-site-backup] sending single attachment ($(basename "$ARCHIVE"), ${SIZE} bytes)"
  send_one "$ARCHIVE" ""
  echo "[email-site-backup] sent 1 email, 1 attachment, ${SIZE} bytes"
  exit 0
fi

echo "[email-site-backup] splitting $(basename "$ARCHIVE") (${SIZE} bytes) into ${MAX_PART}-byte parts"
PREFIX="$WORKDIR/$(basename "$ARCHIVE").part_"
split -b "$MAX_PART" -d -a 2 "$ARCHIVE" "$PREFIX"
shopt -s nullglob
parts=("$PREFIX"*)
count=${#parts[@]}
idx=0
for p in "${parts[@]}"; do
  idx=$((idx + 1))
  psz=$(stat -c%s "$p")
  echo "[email-site-backup] sending part $idx/$count ($psz bytes)"
  send_one "$p" "part $idx of $count"
done
echo "[email-site-backup] sent $count emails, total ${SIZE} bytes (reassemble: cat $(basename "$ARCHIVE").part_* > $(basename "$ARCHIVE"))"
