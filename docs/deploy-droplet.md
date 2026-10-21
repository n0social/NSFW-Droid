# Deploy to DigitalOcean Droplet (www.nsfwdroid.com)

**Production URL:** https://www.nsfwdroid.com (HTTPS via Caddy + Let’s Encrypt). Admin: `/admin/login`.  
**Droplet public IP:** `159.203.136.220`  
**Your key on droplet:** `icollar-droplet` (for you from your laptop).

**Cloud agent deploy key (add to droplet once):** public key in `deploy/nsfwdroid-deploy.pub`:

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMdIdQkh4DkAO9/giumJnatx9T2k0zkEmF/NuxKEPVmS nsfwdroid-cloud-agent-deploy
```

While logged in as **root** with your existing key, append it:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
grep -q 'nsfwdroid-cloud-agent-deploy' ~/.ssh/authorized_keys 2>/dev/null || \
  echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMdIdQkh4DkAO9/giumJnatx9T2k0zkEmF/NuxKEPVmS nsfwdroid-cloud-agent-deploy' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Or: DigitalOcean → **Settings → Security → SSH keys** → Add, then **Droplet → Access → Add SSH key** (or recreate with both keys).

After that, the Cursor cloud agent can `ssh root@159.203.136.220` and run bootstrap. The **private** key never leaves the agent VM and is **not** in git.

---

## 1. DNS (at your registrar)

| Host | Type | Value |
| --- | --- | --- |
| `@` (apex) | A | `159.203.136.220` |
| `www` | A | `159.203.136.220` |

Optional: CNAME `www` → apex if your DNS provider prefers it. Caddy in `deploy/Caddyfile` requests certificates for both `www.nsfwdroid.com` and `nsfwdroid.com`.

Propagation can take up to an hour.

---

## 2. SSH to the droplet

```bash
ssh -i ~/.ssh/icollar-droplet root@159.203.136.220
```

Create app directory and clone (private GitHub example):

```bash
apt-get update && apt-get install -y git
mkdir -p /var/www/nsfwdroid
cd /var/www/nsfwdroid
git clone git@github.com:YOUR_ORG/NSFW-Droid.git .
```

---

## 3. Environment (`/etc/nsfwdroid.env`)

Never commit this file. Example:

```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://www.nsfwdroid.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX   # same as Firebase web app measurementId
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
# FIREBASE_SERVICE_ACCOUNT_JSON=   # minified service account JSON (one line)
# SESSION_SECRET=
ADMIN_PASSWORD=choose-a-long-secret
# Auto-publish TOS-clear ingest (default on when NODE_ENV=production). Use 0 for all-manual review.
AUTO_PUBLISH=1
# Legacy local demo flag (also enables auto-publish in dev)
# DEMO_AUTO_PUBLISH=0
# Strict manual ingest (overrides AUTO_PUBLISH)
# INGEST_REQUIRE_REVIEW=0
STEAM_WEB_API_KEY=optional
ITCH_NSFW_ONLY=1
CATALOG_NSFW_ONLY=1
# Display ads (ExoClick) — keep 0 until publisher approval + counsel OK (see docs/exoclick-setup.md)
NEXT_PUBLIC_ADS_ENABLED=0
NEXT_PUBLIC_EXOCLICK_ZONE_ID_BANNER=
NEXT_PUBLIC_EXOCLICK_ZONE_ID_NATIVE=
# NEXT_PUBLIC_EXOCLICK_AD_SCRIPT_URL=https://a.magsrv.com/ad-provider.js
# NEXT_PUBLIC_EXOCLICK_INS_CLASS=
# Optional: AFFILIATE_EXPORT_PATH=/var/www/nsfwdroid/data/affiliate-export.json
```

- **Google Analytics:** use the Firebase web app **measurementId** (`G-…`) in `NEXT_PUBLIC_GA_MEASUREMENT_ID` (see [firebase-setup.md](firebase-setup.md)). Rebuild (`npm run build`), restart `nsfwdroid`.
- First-party rails still use `analytics_event` in Postgres/PGlite; GA is for marketing and funnel views.
- **Favorites** need full Firebase client env vars **and** `FIREBASE_SERVICE_ACCOUNT_JSON` + `SESSION_SECRET` on the droplet. Without them, hearts are hidden (`isFirebaseConfigured()`). Set all keys in `/etc/nsfwdroid.env`, then `systemctl restart nsfwdroid`.

---

## 4. Bootstrap script

From the repo on the server:

```bash
chmod +x deploy/bootstrap-droplet.sh
./deploy/bootstrap-droplet.sh
```

This installs Node 20, Caddy, builds the app, installs `deploy/nsfwdroid.service`, and proxies HTTPS → `localhost:3000`.

---

## 4b. Cloud agent release (code + build)

On the small droplet (~512 MiB RAM), **do not** rsync a partial `node_modules` tree — it causes `502` from Caddy when `next` or transitive deps (e.g. `lodash.isinteger` for `firebase-admin`) are missing.

Reliable pattern:

1. On the agent: `npm run build` with production `NEXT_PUBLIC_*` from `/etc/nsfwdroid.env` (never commit secrets). Keep `@electric-sql/pglite` external (`serverExternalPackages` in `next.config.mjs`) so the catalog DB works in `next start`.
2. Tar-sync the repo **excluding** `node_modules` and `data/catalog` to `/var/www/nsfwdroid`.
3. Install production deps either:
   - **On droplet:** `cd /var/www/nsfwdroid && npm ci --omit=dev` (slow; needs swap), or
   - **From agent:** `npm ci --omit=dev` in a temp dir, `tar czf node_modules.tgz node_modules`, copy to `/var/www/nsfwdroid` (not `/tmp` if tmpfs is full), extract, `chown -R www-data:www-data node_modules`.
4. `systemctl restart nsfwdroid` and verify `curl -sI http://localhost:3000` and `https://www.nsfwdroid.com`.

---

## 5. After deploy

### systemd (`nsfwdroid`)

`deploy/nsfwdroid.service` runs as **`www-data`**, uses **`Restart=always`** (crash/OOM recovery; explicit `systemctl stop` still stays stopped until `start`), and **`ExecStartPre`** removes a **stale** `data/catalog/postmaster.pid` when the PID is not running. **StartLimitBurst=10** / **StartLimitIntervalSec=300** caps rapid restart loops.

After pulling repo changes:

```bash
cp deploy/nsfwdroid.service /etc/systemd/system/nsfwdroid.service
systemctl daemon-reload
systemctl restart nsfwdroid
```

If the site shows **502**, check `systemctl is-active nsfwdroid` before debugging Caddy.

### Maintenance page vs in-app “catalog unavailable”

| Situation | What visitors see |
| --- | --- |
| **`nsfwdroid` stopped** or Caddy cannot connect to `127.0.0.1:3000` | Caddy serves `deploy/maintenance.html` (HTTP **502/503/504**). Blank gateway errors should not appear. |
| **App running** but PGlite/catalog read fails (e.g. ingest ran without `catalog-maintenance.sh`) | Normal site (**HTTP 200**). Amber **“Catalog temporarily unavailable”** banner on home/browse; legal pages and nav still work. |
| **`/api/health`** while catalog is wedged | **503** JSON from Next — not the Caddy maintenance HTML (upstream responded). |

The maintenance page is wired in `deploy/Caddyfile` via `handle_errors 502 503 504` and `deploy/maintenance.html` on the droplet at `/var/www/nsfwdroid/deploy/`. After changing either file: `cp deploy/Caddyfile /etc/caddy/Caddyfile && systemctl reload caddy`.

**Scheduled banner (site still up):** `scripts/maintenance-notice.sh` (Tue 02:00 UTC cron) writes `data/maintenance-notice.json`, shown globally and exposed on `/api/health` as `maintenanceNotice`. **Downtime UX** for weekly work still relies on stopping `nsfwdroid` (Caddy `maintenance.html` on 502/503/504).

### Catalog ingest runbook (required)

PGlite allows **one process** per `data/catalog` directory. If ingest or migrate runs while `nsfwdroid` is up, initialization fails (`PGlite failed to initialize`), `/api/health` returns **503**, and the homepage may show an empty catalog even though data on disk is fine.

**Use `scripts/catalog-maintenance.sh`** so the app is never left stopped (trap restarts on exit, including failures):

```bash
chmod +x scripts/catalog-maintenance.sh scripts/catalog-ingest-cron.sh scripts/ensure-nsfwdroid.sh
./scripts/catalog-maintenance.sh -- ./scripts/catalog-ingest-cron.sh
```

One-off scripts (e.g. `unpublish-non-nsfw-listings.ts`, `backfill-listing-covers.ts`):

```bash
./scripts/catalog-maintenance.sh -- npx --yes tsx scripts/unpublish-non-nsfw-listings.ts
```

Verify after maintenance:

```bash
curl -sf http://localhost:3000/api/health | jq .
# expect status 200 and listingCount > 0
curl -sI https://www.nsfwdroid.com/api/health
```

(`npm run ingest` needs `tsx` from devDependencies; production `node_modules` from `npm ci --omit=dev` does not include it — use `npx tsx` as above.)

TOS holds: visit https://www.nsfwdroid.com/admin (set `ADMIN_PASSWORD`).

### Watchdog cron (recommended)

Catches **502** from a forgotten `systemctl stop`, failed ingest cron, or a wedged process. Every 5 minutes, restart if the unit is inactive or local health fails:

```bash
cp deploy/cron.d/nsfwdroid-watchdog /etc/cron.d/nsfwdroid-watchdog
chmod 644 /etc/cron.d/nsfwdroid-watchdog
touch /var/log/nsfwdroid-watchdog.log && chown root:root /var/log/nsfwdroid-watchdog.log
```

Logs: `/var/log/nsfwdroid-watchdog.log`. Script: `scripts/ensure-nsfwdroid.sh`.

### Catalog ingest cron (3× daily)

Use the maintenance wrapper (not raw `systemctl stop` chains). Each run migrates, recycles stale feed-backed listings, then ingests itch + Steam:

```bash
cp deploy/cron.d/nsfwdroid-ingest /etc/cron.d/nsfwdroid-ingest
chmod 644 /etc/cron.d/nsfwdroid-ingest
touch /var/log/nsfwdroid-ingest.log
chmod +x scripts/catalog-ingest-cron.sh
```

Schedule (UTC): **06:00, 14:00, 22:00** — see `deploy/cron.d/nsfwdroid-ingest`.

**Verify logs:**

```bash
tail -n 80 /var/log/nsfwdroid-ingest.log
grep -E 'catalog-maintenance|recycle-stale|ingest-all' /var/log/nsfwdroid-ingest.log | tail -20
journalctl -u nsfwdroid -n 30 --no-pager
```

Expect `[catalog-maintenance]` stop/start lines, JSON from `recycle-stale-listings.ts`, then ingest summary JSON with `itch` / `steam` counts.

### Weekly maintenance window (Tuesday, UTC)

All scheduled times below are **UTC** (droplet default). This is **separate** from the 3× daily ingest — weekly work is deeper integrity (disk check, migrate, recycle, catalog counts). Full `ingest-all` stays on the daily cron unless you opt in (see below).

| When (UTC) | Cron file | What happens |
| --- | --- | --- |
| **Every 5 min** | `nsfwdroid-watchdog` | `ensure-nsfwdroid.sh` — auto-restart if unit down or local `/api/health` fails; **skipped** while the weekly or catalog maintenance lock is present. It re-checks that lock after the health probe so a stop started on the same minute (ingest at 06:00, 14:00, 22:00) is not canceled. |
| **Tue 02:00** | `nsfwdroid-maintenance-notice` | Writes `data/maintenance-notice.json` → **amber site banner** until 04:00; optional **ops email** (1h warning) |
| **Tue 03:00** | `nsfwdroid-weekly-maintenance` | Stops `nsfwdroid` → visitors see Caddy **`maintenance.html`** (502/503/504 path); runs `weekly-maintenance-inner.sh` via `catalog-maintenance.sh`; **hard `/api/health` checks** after start; service back when checks pass, **no later than 04:00 UTC** |
| **Daily 06:00, 14:00, 22:00** | `nsfwdroid-ingest` | Unchanged — migrate → recycle → `ingest-all` |

**Design:** Site is intentionally **down** (service stopped) for the weekly job. Work may finish in under an hour; the script still runs the full checklist and polls health before declaring success. If work runs long, the parent script sends **SIGTERM** at **04:00 UTC** so `catalog-maintenance.sh`’s exit trap can start `nsfwdroid` again.

Install on the droplet:

```bash
chmod +x scripts/alert-email.sh scripts/maintenance-notice.sh \
  scripts/weekly-maintenance.sh scripts/weekly-maintenance-inner.sh
cp deploy/cron.d/nsfwdroid-maintenance-notice /etc/cron.d/nsfwdroid-maintenance-notice
cp deploy/cron.d/nsfwdroid-weekly-maintenance /etc/cron.d/nsfwdroid-weekly-maintenance
chmod 644 /etc/cron.d/nsfwdroid-maintenance-notice /etc/cron.d/nsfwdroid-weekly-maintenance
touch /var/log/nsfwdroid-maintenance-notice.log /var/log/nsfwdroid-weekly-maintenance.log
mkdir -p /var/lib/nsfwdroid/alert-dedupe
```

Optional flags in `/etc/nsfwdroid.env`:

- `NSFWDROID_WEEKLY_INGEST=1` — also run `ingest-all` during the weekly window (usually unnecessary with daily ingest).
- `NSFWDROID_WEEKLY_NPM_CI=1` — run `npm ci --omit=dev` during the window (slow on small droplets).

Banner / API: `GET /api/health` includes `maintenanceNotice` while `data/maintenance-notice.json` is active (or `MAINTENANCE_NOTICE_UNTIL` is set). After a successful weekly run, the notice file is removed.

Manual test (off-window):

```bash
./scripts/maintenance-notice.sh
curl -s http://localhost:3000/api/health | jq .maintenanceNotice
./scripts/weekly-maintenance.sh   # only run when you intend downtime
```

### Watchdog policy: auto-fix first, email when it fails

**Recommendation (implemented):** The 5‑minute watchdog **auto-fixes** common outages (stale PGlite `postmaster.pid`, `systemctl restart`, `reset-failed` + retry) because a short blip should not wait for a human. **Email is rate-limited** (default **30 minutes** per alert key) when restart fails or health is still bad after recovery — that is when you care about sustained **502/503/504** at the edge.

Weekly maintenance sets `data/.weekly-maintenance.lock` so the watchdog does **not** fight an intentional stop.

### Weekly newsletter (member list)

Footer signup + double opt-in are live in the app (`POST /api/newsletter/subscribe`). **Mass send** requires `NEWSLETTER_ENABLED=1` in `/etc/nsfwdroid.env` (production: on) plus a Brevo-authenticated domain and `BREVO_API_KEY`.

| Variable | Purpose |
| --- | --- |
| `NEWSLETTER_ENABLED` | `1` allows `scripts/send-weekly-newsletter.ts` to mail active subscribers |
| `NEWSLETTER_PUBLIC_BASE_URL` | Confirm/unsubscribe links (default `NEXT_PUBLIC_SITE_URL`) |
| `BREVO_API_KEY` | [Brevo](https://app.brevo.com) Transactional Email API key (SMTP & API → API keys) |
| `ALERT_EMAIL_FROM` or `NEWSLETTER_FROM` | From address for Brevo. **Production:** authenticate `nsfwdroid.com` in Brevo — use e.g. `ALERT_EMAIL_FROM="NSFW Droid <alerts@nsfwdroid.com>"` and `NEWSLETTER_FROM="NSFW Droid <newsletter@nsfwdroid.com>"` (quoted in `/etc/nsfwdroid.env`). Optional `NEWSLETTER_FROM_NAME` if the address is bare (app default: **NSFW Droid**) |
| `SESSION_SECRET` or `NEWSLETTER_TOKEN_SECRET` | HMAC key for one-click unsubscribe links in weekly mail (defaults to `SESSION_SECRET`). **Production:** one of these must be set — `/api/health` warns and mass send aborts if the dev fallback would be used |

**Brevo DNS (NameSilo):** In Brevo → **Senders, Domains & Dedicated IPs** → **Domains** → add `nsfwdroid.com`. Brevo shows records to publish:

| Record | Host | Purpose |
| --- | --- | --- |
| TXT | `@` (root) | Domain verification (`brevo-code:…`) — merge with existing TXT if NameSilo only allows one SPF/TXT row (combine SPF strings) |
| TXT | `@` | SPF: `v=spf1 include:spf.brevo.com ~all` (merge with any existing SPF; only one SPF TXT per domain) |
| TXT | `mail._domainkey` | DKIM (value from Brevo dashboard) |

If you previously pointed `send.nsfwdroid.com` at Forge for another ESP, that does not satisfy Brevo; you can leave Forge in place for other mail. Wait until Brevo shows the domain as **Authenticated**, then run:

```bash
tsx scripts/check-newsletter-dns.ts
```

`send-weekly-newsletter.ts` aborts on DNS **issues** unless you pass `--skip-dns-check` (emergency only).

**Manual test (local or droplet):**

```bash
npm run db:migrate
# Footer flow: POST subscribe, click confirm link in inbox, visit /newsletter?status=confirmed
curl -sS -X POST http://localhost:3000/api/newsletter/subscribe \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com"}'

tsx scripts/weekly-newsletter-pick.ts | jq .
NEWSLETTER_ENABLED=0 tsx scripts/send-weekly-newsletter.ts --dry-run   # must abort
NEWSLETTER_ENABLED=1 tsx scripts/send-weekly-newsletter.ts --dry-run   # JSON summary only
```

**Cron install:** Copy `deploy/cron.d/nsfwdroid-weekly-newsletter` (schedule **Sunday 12:00 UTC**). The job no-ops unless `NEWSLETTER_ENABLED=1`.

```bash
cp deploy/cron.d/nsfwdroid-weekly-newsletter /etc/cron.d/nsfwdroid-weekly-newsletter
chmod 644 /etc/cron.d/nsfwdroid-weekly-newsletter
touch /var/log/nsfwdroid-newsletter.log
chown root:root /var/log/nsfwdroid-newsletter.log
```

Runs as **root** via `catalog-maintenance.sh` (brief stop/start of `nsfwdroid` for PGlite). Prefer **Sunday 12:00 UTC** after the Tue weekly maintenance window. The job no-ops unless `NEWSLETTER_ENABLED=1` and `BREVO_API_KEY` are set in `/etc/nsfwdroid.env`.

**Homepage featured rail:** set comma-separated slugs in env (order preserved), or set `chart_bucket = featured` + `chart_rank` on listings in admin/DB:

```bash
# FEATURED_LISTING_SLUGS=slug-one,slug-two
```

### Ops email alerts

Configure in `/etc/nsfwdroid.env` (never commit). If `ALERT_EMAIL_TO` is unset, scripts log and skip mail.

| Variable | Purpose |
| --- | --- |
| `ALERT_EMAIL_TO` | Recipient (required to send) |
| `ALERT_EMAIL_FROM` | From address (default `alerts@nsfwdroid.com`). Resend accepts `Name <email>` — production droplet uses `NSFW Droid <alerts@nsfwdroid.com>` (domain verified in Resend) |
| `RESEND_API_KEY` | Preferred: [Resend](https://resend.com) HTTP API |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Optional SMTP via `curl` |
| `ALERT_DEDUPE_MINUTES` | Same `--key` max once per N minutes (default `30`) |
| `ALERT_DEDUPE_DIR` | Dedupe stamps (default `/var/lib/nsfwdroid/alert-dedupe`) |

Fallback: `sendmail` if installed. Script: `scripts/alert-email.sh` (used by watchdog + weekly cron).

Example:

```bash
ALERT_EMAIL_TO=you@example.com
ALERT_EMAIL_FROM="NSFW Droid <alerts@nsfwdroid.com>"
NEWSLETTER_FROM="NSFW Droid <newsletter@nsfwdroid.com>"
RESEND_API_KEY=re_xxxxxxxx
```

`scripts/alert-email.sh` uses Resend when `RESEND_API_KEY` is set and **exits on API errors** (e.g. HTTP 403) instead of falling back to `sendmail`.

---

## 6. Layout reference

Storefront chrome matches `docs/design-layout.md` (header, 21:9 hero, chip row, horizontal rails, footer). Iterate copy and Vesper artwork from that doc after you review the live site.

---

## Security

- Rotate any API key ever pasted in chat.
- Restrict SSH to your IP in DigitalOcean Cloud Firewall when possible.
- Keep `ADMIN_PASSWORD` only in `/etc/nsfwdroid.env`.
