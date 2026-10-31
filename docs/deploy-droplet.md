# Deploy to DigitalOcean Droplet (www.nsfwdroid.com)

**Production URL:** https://www.nsfwdroid.com (HTTPS via Caddy + Let’s Encrypt). Admin: `/admin/login`.  
**Droplet public IP:** `159.203.136.220`  
**Your key on droplet:** `icollar-droplet` (for you from your laptop).

**Cloud agent deploy key:** current public key is `deploy/cursor-cloud-agent-nsfwdroid.pub` (`cursor-cloud-agent-nsfwdroid`). Legacy key: `deploy/nsfwdroid-deploy.pub`.

**Current production:** Cloud Agents default to **`NSFWDROID_DEPLOY_SSH_USER=root`** until you run the non-root setup below. While logged in as **root** with your existing key, append the agent public key:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
grep -q 'cursor-cloud-agent-nsfwdroid' ~/.ssh/authorized_keys 2>/dev/null || \
  echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEss7C+90lWa6IjJLq+gBRSSzUZrT5Kx/6ZU9WDAkcIK cursor-cloud-agent-nsfwdroid' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**Preferred (after migration):** dedicated Linux user `nsfwdroid-deploy` (not root). Cloud Agents SSH as that user, extract tarballs under `/var/www/nsfwdroid`, and use **passwordless sudo only** for `systemctl restart nsfwdroid` and cron install — via `/usr/local/sbin/nsfwdroid-deploy-release.sh` and `nsfwdroid-install-droplet-cron.sh`.

On the droplet as **root** (laptop SSH), after the app tree is at `/var/www/nsfwdroid`:

```bash
cd /var/www/nsfwdroid
chmod +x deploy/setup-droplet-deploy-user.sh
./deploy/setup-droplet-deploy-user.sh
```

That creates `nsfwdroid-deploy`, fixes app-dir ownership (`nsfwdroid-deploy:www-data`, `data/` stays `www-data`), installs sudoers + `/usr/local/sbin` helpers, and appends a **restricted** `authorized_keys` line (`restrict,port-forwarding`, no forwarding) for the agent key.

Rotate or create keys on a Cloud Agent: `./scripts/cloud-agent-ssh-keygen.sh` (updates `deploy/cursor-cloud-agent-nsfwdroid.pub` and prints the constrained `authorized_keys` line). Store the matching **private** key as runtime secret `CURSOR_CLOUD_AGENT_NSFWDROID_PRIVATE_KEY`. Verify with `./scripts/cloud-agent-ssh-setup.sh`; releases use `./scripts/cloud-agent-deploy-droplet.sh` (§4b).

The **private** key never leaves the agent VM and is **not** in git.

### Migrating from root-based Cloud Agent SSH

If the agent key is still only in **`/root/.ssh/authorized_keys`** (older setup), root deploy keeps working until you migrate:

1. Pull this repo on the droplet and run `./deploy/setup-droplet-deploy-user.sh` as above.
2. From a Cloud Agent, unset `NSFWDROID_DEPLOY_SSH_USER` (or set `NSFWDROID_DEPLOY_SSH_USER=nsfwdroid-deploy`), run `./scripts/cloud-agent-ssh-setup.sh` and a test deploy.
3. When satisfied, **remove** the `cursor-cloud-agent-nsfwdroid` line from `/root/.ssh/authorized_keys` (human SSH via `icollar-droplet` stays on root).

Until step 2 passes, Cloud Agent scripts default to **`NSFWDROID_DEPLOY_SSH_USER=root`** so root-based deploy keeps working.

Manual `authorized_keys` line (same as `scripts/cloud-agent-authorized-keys-line.sh`):

```bash
./scripts/cloud-agent-authorized-keys-line.sh deploy/cursor-cloud-agent-nsfwdroid.pub
# Append output to /home/nsfwdroid-deploy/.ssh/authorized_keys (mode 600, owner nsfwdroid-deploy).
```

Or: DigitalOcean → **Settings → Security → SSH keys** → Add, then **Droplet → Access → Add SSH key** (human access only; Cloud Agent still uses the deploy user + repo key).

---

## 1. DNS (at your registrar)

| Host | Type | Value |
| --- | --- | --- |
| `@` (apex) | A | `159.203.136.220` |
| `www` | A | `159.203.136.220` |

Optional: CNAME `www` → apex if your DNS provider prefers it. Caddy in `deploy/Caddyfile` requests certificates for both hosts; **apex 301s to `www`** (canonical `NEXT_PUBLIC_SITE_URL`).

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
# ADMIN_SESSION_SECRET=   # optional; openssl rand -base64 32 — signs admin_session (falls back to ADMIN_PASSWORD if unset)
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
NEXT_PUBLIC_EXOCLICK_ZONE_ID_POPUNDER=
NEXT_PUBLIC_EXOCLICK_ZONE_ID_POPUNDER_MOBILE=
# NEXT_PUBLIC_EXOCLICK_AD_SCRIPT_URL=https://a.magsrv.com/ad-provider.js
# NEXT_PUBLIC_EXOCLICK_INS_CLASS=
# Optional: AFFILIATE_EXPORT_PATH=/var/www/nsfwdroid/data/affiliate-export.json
```

- **Google Analytics:** use the Firebase web app **measurementId** (`G-…`) in `NEXT_PUBLIC_GA_MEASUREMENT_ID` (see [firebase-setup.md](firebase-setup.md)). Rebuild (`npm run build`), restart `nsfwdroid`.
- First-party rails still use `analytics_event` in Postgres/PGlite; GA is for marketing and funnel views.
- **Favorites** need full Firebase client env vars **and** `FIREBASE_SERVICE_ACCOUNT_JSON` + `SESSION_SECRET` on the droplet. Without them, hearts are hidden (`isFirebaseConfigured()`). Set all keys in `/etc/nsfwdroid.env`, then `systemctl restart nsfwdroid`.
- **Search (GSC) in admin** (`/admin/search`): optional `GSC_SERVICE_ACCOUNT_JSON` + GSC property user invite; daily `scripts/gsc-sync.ts` via `deploy/cron.d/nsfwdroid-gsc-sync`. See [search-console-api.md](search-console-api.md). No rebuild required for env-only GSC keys.

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
# expect status 200; catalog.listingCount (alias displayedCount) matches browse total
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

### Caddy watchdog cron (recommended)

Restarts the **Caddy** reverse proxy if `systemctl is-active caddy` fails (TLS, apex→www, maintenance.html on upstream 502):

```bash
cp deploy/cron.d/nsfwdroid-caddy-watchdog /etc/cron.d/nsfwdroid-caddy-watchdog
chmod 644 /etc/cron.d/nsfwdroid-caddy-watchdog
touch /var/log/nsfwdroid-caddy-watchdog.log
chmod +x scripts/ensure-caddy.sh
```

Or install all cron jobs: `./scripts/install-droplet-cron.sh`.

Logs: `/var/log/nsfwdroid-caddy-watchdog.log`. Script: `scripts/ensure-caddy.sh`.

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
| **Fri 21:00 US Eastern** | `nsfwdroid-weekly-newsletter` | Weekly member newsletter (`send-weekly-newsletter.ts`) when `NEWSLETTER_ENABLED=1` |

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

The watchdog uses `scripts/ops-health-probe.sh` so **`status: degraded`** responses (HTTP **503** with `catalog.error`) produce **descriptive** alert bodies, not a generic curl failure.

| Variable | Purpose |
| --- | --- |
| `WATCHDOG_RESTART` | `1` (default) restart on failed health; `0` **alert only** (no `systemctl restart`) |
| `CADDY_WATCHDOG_RESTART` | `1` (default) restart Caddy when inactive; `0` **alert only** |
| `INGEST_ALERT_ZERO_NEW_RUNS` | After each ingest cron, `check-ingest-stale.sh` emails if the last N `ingest_all` runs added zero candidates (`0`/unset = off) |

Weekly maintenance sets `data/.weekly-maintenance.lock` so the watchdog does **not** fight an intentional stop.

**Exim relay smoke (weekly):** `weekly-maintenance-inner.sh` runs `scripts/ops-exim-relay-smoke-alert.sh` (wraps `exim-relay-smoke.sh`). Failures email with key `exim-relay-smoke-failed`. Log: `/var/log/nsfwdroid-exim-smoke.log`. Set `EXIM_RELAY_SMOKE_WEEKLY=0` to skip.

### Weekly newsletter (member list)

Footer signup + double opt-in are live in the app (`POST /api/newsletter/subscribe`). **Mass send** requires `NEWSLETTER_ENABLED=1` in `/etc/nsfwdroid.env`.

**Production (droplet):** `NEWSLETTER_TRANSPORT=sendmail` (default) — Exim on the box signs outbound mail. Runbook: [newsletter-exim-runbook.md](newsletter-exim-runbook.md).

| Variable | Purpose |
| --- | --- |
| `NEWSLETTER_ENABLED` | `1` allows `scripts/send-weekly-newsletter.ts` to mail active subscribers |
| `NEWSLETTER_TRANSPORT` | `sendmail` (default, Exim on droplet) |
| `NEWSLETTER_PUBLIC_BASE_URL` | Confirm/unsubscribe links (default `NEXT_PUBLIC_SITE_URL`) |
| `ALERT_EMAIL_FROM` or `NEWSLETTER_FROM` | From address (quoted in `/etc/nsfwdroid.env`). Optional `NEWSLETTER_FROM_NAME` (default **NSFW Droid**) |
| `SESSION_SECRET` or `NEWSLETTER_TOKEN_SECRET` | HMAC key for **signed links in email** (weekly one-click unsubscribe, not SMTP auth). Confirm links use a random DB token; weekly mail signs `subscriberId` so you can unsubscribe without storing plaintext tokens. **Production:** one of these must be set — `/api/health` warns and mass send aborts if the dev fallback would be used |

**Exim DKIM DNS:** On the droplet, `./scripts/print-exim-dkim-dns.sh` prints the TXT for `nsfwdroid._domainkey.nsfwdroid.com` (or your `DKIM_SELECTOR` / domain). SPF on `@` should include the droplet IP. Verify:

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

**Cron install (all jobs):** After syncing `/var/www/nsfwdroid` from git, run as **root**:

```bash
cd /var/www/nsfwdroid && ./scripts/install-droplet-cron.sh
```

That installs every file under `deploy/cron.d/` (ingest 3×/day UTC, watchdog every 5 min, Tue maintenance notice + weekly window, **Fri 21:00 America/New_York** newsletter). See `deploy/cron.d/` for each schedule.

**Newsletter cron** (`nsfwdroid-weekly-newsletter`) runs `scripts/weekly-newsletter-cron.sh` (preflight + ops alert on failure). No-ops unless `NEWSLETTER_ENABLED=1` and sendmail/Brevo is configured. Log: `/var/log/nsfwdroid-newsletter.log`. Runbook: [newsletter-exim-runbook.md](newsletter-exim-runbook.md).

**Homepage hero featured pick** (no featured rail): each calendar week (Mon–Sun in `NEWSLETTER_WEEKLY_TZ` / America/New_York), the **newest** browse-visible title **first seen during the previous week** is featured; the following Monday the hero switches to that new “previous week.” Rolls over **Monday 00:00** in that zone; homepage ISR may cache up to ~1 hour. Override with the first slug in `FEATURED_LISTING_SLUGS`, else hot-traffic / `chart_bucket = featured` when the prior week had no ingest:

```bash
# Permanent override (until removed):
# FEATURED_LISTING_SLUGS=slug-one

# One-week manual pick, then weekly rotation resumes automatically:
# FEATURED_LISTING_SLUGS=fazbooba-simulator-zbooba-simulator
# FEATURED_LISTING_SLUGS_UNTIL=auto
```

`FEATURED_LISTING_SLUGS_UNTIL=auto` expires at the **next Monday 00:00** in the catalog week timezone. Or set `YYYY-MM-DD` for that midnight. **Restart** `nsfwdroid` after changing these (no rebuild required). Clear both vars after a dated override if you want to force rotation early.

### Ops email alerts

Configure in `/etc/nsfwdroid.env` (never commit). If `ALERT_EMAIL_TO` is unset, scripts log and skip mail.

| Variable | Purpose |
| --- | --- |
| `ALERT_EMAIL_TO` | Recipient (required to send). `ALERT_EMAIL` is accepted as an alias |
| `ALERT_EMAIL_FROM` | From address (default `alerts@nsfwdroid.com`). Production uses `NSFW Droid <alerts@nsfwdroid.com>` |
| `ALERT_EMAIL_TRANSPORT` | `sendmail` (default, Exim on droplet) or `smtp` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Optional SMTP via `curl` when `ALERT_EMAIL_TRANSPORT=smtp` or as fallback after sendmail failure |
| `ALERT_DEDUPE_MINUTES` | Same `--key` max once per N minutes (default `30`) |
| `ALERT_DEDUPE_DIR` | Dedupe stamps (default `/var/lib/nsfwdroid/alert-dedupe`) |

Primary transport: local `sendmail` (Exim on the droplet). Script: `scripts/alert-email.sh` (watchdog, ingest checks, weekly cron failures).

Example:

```bash
ALERT_EMAIL_TO=you@example.com
ALERT_EMAIL_FROM="NSFW Droid <alerts@nsfwdroid.com>"
ALERT_EMAIL_TRANSPORT=sendmail
NEWSLETTER_FROM="NSFW Droid <newsletter@nsfwdroid.com>"
NEWSLETTER_TRANSPORT=sendmail
```

`scripts/alert-email.sh` injects mail through local **Exim** (`sendmail`) by default — same loopback path as the member newsletter when `NEWSLETTER_TRANSPORT=sendmail`. Remove legacy `RESEND_API_KEY` from `/etc/nsfwdroid.env` if present; it is no longer read by ops alerts.

**Test routing (droplet):**

```bash
cd /var/www/nsfwdroid && ./scripts/ops-alert-email-test.sh
```

Or manually: `./scripts/alert-email.sh --key "manual-test-$(date -u +%s)" --subject "[NSFW Droid TEST] …" --body "…"`. Check the inbox (and Gmail **Spam** once) for `ALERT_EMAIL_TO`.

**Gmail deliverability (ops alerts):**

| Topic | Guidance |
| --- | --- |
| Transport | Ops alerts and newsletter both use **Exim sendmail** on the droplet by default. Align DNS (SPF/DKIM/DMARC) for **nsfwdroid.com** so Gmail accepts mail from the droplet IP or relay. |
| From alignment | Keep `ALERT_EMAIL_FROM` on **nsfwdroid.com** (e.g. `NSFW Droid <alerts@nsfwdroid.com>`). |
| Exim → Gmail | Publish Exim DKIM (`print-exim-dkim-dns.sh`) and confirm SPF includes the droplet IP. Without DKIM in DNS, Gmail often files mail as **Spam**. After the first delivery, open Gmail **Spam** once and “Report not spam” for `ALERT_EMAIL_FROM`. Optional: `ALERT_EMAIL_TRANSPORT=smtp` with `SMTP_*` (e.g. Gmail App Password). |
| Reply-To / List-Unsubscribe | Transactional ops alerts do not need `List-Unsubscribe`. Optional `Reply-To` to the same `alerts@…` address if bounces confuse filters. |
| Recipient | Set `ALERT_EMAIL_TO` to the mailbox you read on your phone. `ALERT_EMAIL` is an alias for the same variable. |

All callers (`ensure-nsfwdroid.sh`, ingest checks, `weekly-maintenance.sh`, `weekly-newsletter-cron.sh` failure paths, etc.) invoke `scripts/alert-email.sh`, which reads **only** `ALERT_EMAIL_TO` / `ALERT_EMAIL` for the recipient.

---

## 6. Layout reference

Storefront chrome matches `docs/design-layout.md` (header, 21:9 hero, chip row, horizontal rails, footer). Iterate copy and Vesper artwork from that doc after you review the live site.

---

## Security

- Rotate any API key ever pasted in chat.
- Restrict SSH to your IP in DigitalOcean Cloud Firewall when possible.
- Keep `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` only in `/etc/nsfwdroid.env` (never commit). Use a dedicated `ADMIN_SESSION_SECRET` so password rotation does not invalidate moderator sessions.
- **Cloudflare** (optional edge): [cloudflare.md](cloudflare.md). App sets baseline security headers in middleware; POST APIs use IP rate limits (see `src/lib/rate-limit.ts`).

### Exim (local `sendmail`, not an open relay)

Newsletter and ops mail on the droplet use **Exim** on **loopback only** (`127.0.0.1:25` / `::1:25`), installed via `deploy/setup-local-mail.sh` (see branch `cursor/droplet-mail-25f1`). The app runs as **`www-data`** and injects mail with `/usr/sbin/sendmail` when `NEWSLETTER_TRANSPORT=sendmail`.

**Relay smoke test (read-only):**

```bash
# On the droplet (root):
chmod +x scripts/exim-relay-smoke.sh
./scripts/exim-relay-smoke.sh

# From a Cloud Agent VM (after ./scripts/cloud-agent-ssh-setup.sh when that script is on your branch):
./scripts/cloud-agent-exim-relay-smoke.sh
```

The script checks `exim4` is active, `dc_relay_nets` is empty, SMTP listens on loopback only, a **simulated remote client** (`exim -bh 203.0.113.50`) gets **`550 relay not permitted`**, and **`www-data`** can still **route** outbound mail (`exim -bt` → `dnslookup`). It does **not** send real messages.

**Production verification (2026-10-21, read-only):** Cloud Agent SSH to `159.203.136.220` succeeded. Exim **4.98.2**; `dc_local_interfaces='127.0.0.1 ; ::1'`; `dc_relay_nets=''`; `MAIN_TRUSTED_USERS = www-data` in `/etc/exim4/exim4.conf.localmacros`. Public **TCP/25** on the droplet IP was **not** reachable (listener bound to loopback only). Remote relay probe rejected; `www-data` routing to external domains via `dnslookup` works as intended for newsletter sendmail.

**Note:** Connections from **127.0.0.1** may still relay outbound mail (default Debian `relay_from_hosts` for local submission). That is expected for `sendmail` on the box; it is not exposed to the internet because port 25 is not on the public interface. Re-run the smoke script after any Exim or firewall change.
