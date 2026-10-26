# Autonomous operations (owner handoff)

This page is the **single checklist** for what NSFW Droid does **without a human**, which **environment variables must exist** on the production droplet, how **ops alerts** reach the owner, and what stays **manual** after merge/deploy.

**Production:** https://www.nsfwdroid.com on DigitalOcean (`159.203.136.220`). Deep deploy steps: [deploy-droplet.md](deploy-droplet.md). Small-droplet constraints: [ops-droplet-512mb.md](ops-droplet-512mb.md).

---

## What runs without a human

These jobs are installed from `deploy/cron.d/` via `scripts/install-droplet-cron.sh` (or `deploy/bootstrap-droplet.sh` on first bootstrap). All times below are as defined in the cron files; the droplet OS clock should stay on **UTC** except where `CRON_TZ` is set.

### Cron schedule

| Schedule | Cron file | Script / command | Site impact | Ops email |
| --- | --- | --- | --- | --- |
| **Every 5 min** | `nsfwdroid-watchdog` | `scripts/ensure-nsfwdroid.sh` | Restarts `nsfwdroid` if unit down or local `/api/health` fails; skips when weekly or catalog maintenance locks exist | On **failed** restart or **health still bad** after restart (deduped) |
| **Daily 06:00, 14:00, 22:00 UTC** | `nsfwdroid-ingest` | `catalog-maintenance.sh` → `catalog-ingest-cron.sh` | Brief stop/start around PGlite work (~minutes) | If `INGEST_ALERT_ZERO_NEW_RUNS` set and last N ingests added 0 candidates |
| **Tue 02:00 UTC** | `nsfwdroid-maintenance-notice` | `scripts/maintenance-notice.sh` | Amber **banner** (site still up); `maintenanceNotice` on `/api/health` | Optional 1h warning before weekly window |
| **Tue 03:00–04:00 UTC** | `nsfwdroid-weekly-maintenance` | `scripts/weekly-maintenance.sh` → `weekly-maintenance-inner.sh` | **Maintenance page** while `nsfwdroid` stopped (Caddy 502/503/504 path) | Start, failure, and success emails (daily keys) |
| **Fri 21:00 America/New_York** | `nsfwdroid-weekly-newsletter` | `catalog-maintenance.sh` → `send-weekly-newsletter.ts` | Brief stop/start for PGlite | No ops mail (member newsletter only) |

### Human-scheduled changes (DNS, deploy, maintenance)

**Agents and operators:** Before asking the owner to change nameservers, run `./scripts/cloud-agent-deploy-droplet.sh`, or do anything that may cause **502/503**, **brief catalog downtime**, or **confusing DNS flips**, call out the windows below and suggest scheduling when traffic is lowest.

Times in **America/New_York** (`NEWSLETTER_WEEKLY_TZ` / default site timezone). Droplet cron uses **UTC** unless `CRON_TZ` is set on a job.

| Window | When (Eastern) | What already happens | Good for owner-initiated work |
| --- | --- | --- | --- |
| **Weekly maintenance** | **Mon ~11:00 PM – Tue ~12:00 AM** (Tue 03:00–04:00 **UTC**) | Full maintenance page; `nsfwdroid` stopped | DB/catalog work, risky deploys, long Caddy changes |
| **Maintenance notice** | **Mon ~10:00 PM** (Tue 02:00 **UTC**) | Amber banner only | Communicate upcoming work |
| **Ingest** | **~2:00 AM, ~10:00 AM, ~6:00 PM** Eastern (06:00 / 14:00 / 22:00 **UTC**) | Brief stop/start (~minutes) | Avoid overlapping manual deploys |
| **Friday newsletter** | **Fri 9:00 PM** Eastern | Brief stop/start | Avoid if possible |

**DNS / Cloudflare nameserver changes** can cause mixed resolver behavior for hours; prefer **late evening Eastern** or the **weekly maintenance** window. See [cloudflare.md](cloudflare.md).

**Deploy** (`cloud-agent-deploy-droplet.sh`) restarts the app (~seconds of blip); still best during low traffic or right after weekly maintenance.

### Inside each ingest run (`catalog-ingest-cron.sh`)

When the ingest cron fires, the inner script (always via `catalog-maintenance.sh`) automatically:

1. `db-migrate.ts`
2. `recycle-stale-listings.ts --apply`
3. Sample link check (`check-listing-links.ts --apply`, default **20** listings; `LINK_CHECK_SAMPLE_PER_INGEST=0` disables)
4. `ingest-all.ts` (itch + Steam + optional affiliate)
5. Optional social queue (`social-enqueue.ts` / `social-drain.ts`) when Mastodon/Pillowfort env flags are on
6. `check-ingest-stale.sh` (ops email when configured)

### Other automatic recovery (not cron)

| Mechanism | Behavior |
| --- | --- |
| **systemd** `nsfwdroid.service` | `Restart=always` on crash/OOM; `ExecStartPre` removes stale `postmaster.pid` |
| **Watchdog** | Stale PGlite lock cleanup + `systemctl restart` before emailing; clears **orphaned** `data/.catalog-maintenance.lock` when the PID is dead or the lock is older than `CATALOG_MAINT_LOCK_MAX_AGE_SEC` (default 2h) so ingest crashes do not leave the site down until manual restart |

There is **no GitHub Actions deploy** and **no auto-merge** to production. Merging to `main` updates the repo only until something runs `scripts/cloud-agent-deploy-droplet.sh` (or a human deploy on the droplet).

---

## Environment variables that must exist

Secrets live in **`/etc/nsfwdroid.env`** on the droplet (never commit). Local dev uses `.env` from [`.env.example`](../.env.example).

### Tier A — production storefront (required)

| Variable | Why |
| --- | --- |
| `NODE_ENV=production` | Production behavior, default auto-publish policy |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, newsletter links, metadata |
| `ADMIN_PASSWORD` | `/admin` access |
| Firebase **client** `NEXT_PUBLIC_FIREBASE_*` | As needed for features you ship (GA uses `NEXT_PUBLIC_GA_MEASUREMENT_ID`) |

Rebuild + restart after any `NEXT_PUBLIC_*` change (`npm run build` on deploy).

### Tier B — owner alerts (strongly recommended)

Without these, scripts **log and skip email**; outages may go unnoticed until you check the site.

| Variable | Why |
| --- | --- |
| `ALERT_EMAIL_TO` | **Owner inbox** for all ops alerts |
| `ALERT_EMAIL_FROM` | From line (e.g. `NSFW Droid <alerts@nsfwdroid.com>`) |
| Local Exim `sendmail` (default) **or** `SMTP_*` with `ALERT_EMAIL_TRANSPORT=smtp` | Delivery — see [deploy-droplet.md § Ops email alerts](deploy-droplet.md#ops-email-alerts) |

Optional tuning: `ALERT_DEDUPE_MINUTES` (default 30), `INGEST_ALERT_ZERO_NEW_RUNS=3` for stale-ingest warnings.

### Tier C — feature flags (only if you use the feature)

| Feature | Variables |
| --- | --- |
| **Member newsletter** | `NEWSLETTER_ENABLED=1`, `NEWSLETTER_TRANSPORT=sendmail` or `BREVO_API_KEY`, `NEWSLETTER_FROM` / `ALERT_EMAIL_FROM`, `SESSION_SECRET` or `NEWSLETTER_TOKEN_SECRET` |
| **Firebase favorites / sessions** | `FIREBASE_SERVICE_ACCOUNT_JSON`, `SESSION_SECRET` |
| **Steam ingest** | `STEAM_WEB_API_KEY` (recommended) |
| **Social posting** | `SOCIAL_MASTODON_ENABLED` / `SOCIAL_ENQUEUE_ENABLED`, `MASTODON_*`, etc. |
| **Display ads** | `NEXT_PUBLIC_ADS_ENABLED=1` + ExoClick `NEXT_PUBLIC_EXOCLICK_*` (build-time) |

### Cloud Agent deploy (agent VM secrets, not on droplet)

| Secret / var | Purpose |
| --- | --- |
| `CURSOR_CLOUD_AGENT_NSFWDROID_PRIVATE_KEY` | SSH private key matching `deploy/cursor-cloud-agent-nsfwdroid.pub` |
| `NSFWDROID_DEPLOY_SSH_USER` | `root` (legacy) or `nsfwdroid-deploy` after [non-root setup](deploy-droplet.md) |

Production `NEXT_PUBLIC_*` for builds must be available to the agent at **build** time (typically sourced from droplet env or documented copies — never committed).

---

## How alerts reach the owner (phone and email)

NSFW Droid does **not** send SMS or push notifications directly. All **automated ops alerts** go through **`scripts/alert-email.sh`** to **`ALERT_EMAIL_TO`**.

### Getting alerts on your phone

1. Set `ALERT_EMAIL_TO` to an address you read on your phone (personal Gmail, iCloud, etc.).
2. Enable **push notifications** for that mailbox (iOS Mail, Gmail app, etc.).
3. Optionally filter or star messages from `ALERT_EMAIL_FROM` so watchdog failures stand out.

### What sends ops email

| Source | Typical subject / key |
| --- | --- |
| `ensure-nsfwdroid.sh` | Watchdog could not restart; recovery incomplete (`watchdog-*`) |
| `weekly-maintenance.sh` | Weekly maintenance started / failed / complete (`weekly-maintenance-*`) |
| `maintenance-notice.sh` | Optional Tuesday pre-window warning |
| `check-ingest-stale.sh` | Ingest added zero new candidates N times (`ingest-zero-new-*`) |

**Deduping:** same `--key` at most once per `ALERT_DEDUPE_MINUTES` (default 30) under `ALERT_DEDUPE_DIR` (`/var/lib/nsfwdroid/alert-dedupe`).

**Member newsletter** is separate mail (Brevo or Exim `sendmail`), not ops alerts — see [reward_program.md](reward_program.md) and [newsletter-manual-test.md](newsletter-manual-test.md).

### If you are not getting mail

1. Confirm `ALERT_EMAIL_TO` is set in `/etc/nsfwdroid.env` (this is the **only** recipient for ops and newsletter-failure alerts).
2. Test from the droplet: `cd /var/www/nsfwdroid && ./scripts/ops-alert-email-test.sh` — see [deploy-droplet.md § Ops email alerts](deploy-droplet.md#ops-email-alerts) for Gmail deliverability notes.
3. Check Exim (`/var/log/exim4/mainlog`) or SMTP logs; `alert-email.sh` **exits non-zero** when sendmail/SMTP cannot deliver.
4. On Gmail, check **Spam** once and “Report not spam” for `ALERT_EMAIL_FROM` so watchdog mail stays in Primary.
5. Inspect `/var/log/nsfwdroid-*.log` and `journalctl -u nsfwdroid`.

---

## Merge and deploy checklist

### Automated (no owner action per release)

| Step | Where |
| --- | --- |
| Ingest, migrate, recycle, link sample | Ingest cron |
| Watchdog restart + alert on sustained failure | Watchdog cron |
| Tuesday banner + weekly integrity window | Maintenance crons |
| Friday newsletter send (when enabled) | Newsletter cron |
| systemd crash restart | `nsfwdroid.service` |

### Manual — code path (every production release)

| Step | Who | Command / action |
| --- | --- | --- |
| Review + **merge PR** to `main` | Owner (or delegate) | GitHub UI |
| **Deploy** built app to droplet | Cloud Agent or owner | `./scripts/cloud-agent-deploy-droplet.sh` ([§4b](deploy-droplet.md#4b-cloud-agent-release-code--build)) |
| Verify health | Agent or owner | `curl -sI https://www.nsfwdroid.com/api/health` |

Deploy script stops `nsfwdroid`, extracts tarball + `node_modules`, runs finish (`systemctl start` or `nsfwdroid-deploy-release.sh`), and checks local health.

### Manual — when specific files change

| Change in repo | Extra step on droplet |
| --- | --- |
| `deploy/cron.d/*` | `./scripts/install-droplet-cron.sh` or `./scripts/cloud-agent-droplet-install-cron.sh` from agent |
| `deploy/nsfwdroid.service` | `cp` to `/etc/systemd/system`, `daemon-reload`, `restart` |
| `deploy/Caddyfile` or `maintenance.html` | Copy to `/etc/caddy`, `systemctl reload caddy` |
| `/etc/nsfwdroid.env` only (no `NEXT_PUBLIC_*`) | `systemctl restart nsfwdroid` |
| `NEXT_PUBLIC_*` or app code | Full deploy (rebuild on agent) |

### Manual — rare / one-time

| Task | Reference |
| --- | --- |
| DNS, first bootstrap, SSH keys | [deploy-droplet.md](deploy-droplet.md) §1–4 |
| Non-root deploy user migration | `deploy/setup-droplet-deploy-user.sh` |
| Exim / newsletter DNS | [deploy-droplet.md](deploy-droplet.md) Security / Exim |
| Backups | [backups.md](backups.md) |

### Cloud Agent workflow (typical)

1. Branch → implement → push → open PR (include chat summary + PR body per [AGENTS.md](../AGENTS.md)).
2. Owner merges when satisfied.
3. Agent (or owner) runs deploy script from `main` checkout with SSH + build env configured.
4. If cron definitions changed in that release, install cron before considering the release done.

---

## Quick health signals

| Check | Good signal |
| --- | --- |
| Public | `curl -sI https://www.nsfwdroid.com/api/health` → HTTP 200 |
| JSON body | `"status":"ok"`, `"healthy":true`, sensible `catalog.listingCount` |
| Logs | `/var/log/nsfwdroid-ingest.log`, `nsfwdroid-watchdog.log`, `journalctl -u nsfwdroid` |

When in doubt, start with [deploy-droplet.md](deploy-droplet.md) runbooks (ingest, watchdog, weekly window).
