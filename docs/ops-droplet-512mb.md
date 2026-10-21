# Ops on a 512MB droplet ($4/mo)

NSFW Droid’s production catalog uses **embedded PGlite** (`data/catalog/`) on a small DigitalOcean droplet. This doc covers day-to-day ops at that scale—not a migration to Managed PostgreSQL (deferred until you have headroom and a clear need).

## PGlite: single writer

PGlite allows **one live process** per catalog directory.

- The `nsfwdroid` systemd unit holds the catalog open while the site is up.
- **Ingest, migrate, link checks, and weekly maintenance** must run through [`scripts/catalog-maintenance.sh`](../scripts/catalog-maintenance.sh), which stops the service, runs your command, fixes ownership, and starts the service again.
- If ingest runs while the app is up, you get `PGlite failed to initialize`, `/api/health` returns **503**, and the storefront can look empty even though data on disk is fine.

**Rule:** Any script that calls `getDb()` for writes (or long reads during maintenance) → wrap with `catalog-maintenance.sh`.

Examples:

```bash
./scripts/catalog-maintenance.sh -- ./scripts/catalog-ingest-cron.sh
./scripts/catalog-maintenance.sh -- npx --yes tsx scripts/ingest-all.ts
```

Cron on the droplet already uses this pattern (`deploy/cron.d/nsfwdroid-ingest`).

## When to use `catalog-maintenance.sh`

| Task | Use maintenance wrapper? |
|------|---------------------------|
| Scheduled ingest (cron) | Yes — `catalog-ingest-cron.sh` |
| Manual full ingest | Yes |
| `db-migrate.ts` | Yes |
| `check-listing-links.ts --apply` | Yes (or inside ingest cron) |
| `weekly-maintenance-inner.sh` | Yes (weekly unit stops service first) |
| Browsing the site / API reads while app runs | No — app is the single writer |

## Catalog freshness (public)

`GET /api/health` includes:

- `catalogLastIngestAt` — ISO timestamp of the last **successful** `ingest_all` (`ingest_run.finished_at`), or `null` if none yet.
- `catalog.listingCount` / `catalog.displayedCount` — titles shown on home, browse, and sitemap (`link_status = ok` and `catalog_stale = false`). Same filter as `getPublishedListingCount()` and browse pagination `total`.
- `catalog.listingsTotal` — all `listing` rows (matches ingest summary JSON `catalog.listings` and admin dashboard total when no stale rows).
- `catalog.candidatesTotal` — ingest pipeline rows, not storefront titles.
- `catalog.browsePageCount` — `ceil(displayedCount / browsePageSize)`; do not multiply by page size to estimate inventory (last page is partial).
- `social` (optional) — when Mastodon/social enqueue is enabled (or `HEALTH_SOCIAL_OUTBOX=1`): `enabled` plus `outbox` counts (`pending`, `posted`, `failed`, `skipped`).

Use this for uptime monitors or a “last updated” display without hitting admin APIs.

## Ingest ops alerts

Optional env in `/etc/nsfwdroid.env`:

```bash
# Alert if the last 3 ingest_all runs all inserted 0 new candidates (itch+steam+affiliate)
INGEST_ALERT_ZERO_NEW_RUNS=3
```

After each cron ingest, `scripts/check-ingest-stale.sh` runs (from `catalog-ingest-cron.sh`). It emails via [`scripts/alert-email.sh`](../scripts/alert-email.sh) with dedupe key `ingest-zero-new-<N>`. Requires `ALERT_EMAIL_TO` or `ALERT_EMAIL` (and `RESEND_API_KEY` or SMTP). Unset or `0` disables the check.

The 5‑minute [`ensure-nsfwdroid.sh`](../scripts/ensure-nsfwdroid.sh) watchdog parses degraded `/api/health` JSON for alert text. Set `WATCHDOG_RESTART=0` for alert-only mode. Tuesday weekly maintenance runs Exim relay smoke with email on failure (`ops-exim-relay-smoke-alert.sh`).

Admin **Ingest runs** table shows per-run summaries (feed errors, tags backfilled, link-health samples) and a dedicated **Error** column for `error_message`.

## Link health sampling (memory & politeness)

Full link checks walk many URLs and spike RAM/CPU on a 512MB VM.

| Context | Default | Env |
|---------|---------|-----|
| Each ingest cron (`catalog-ingest-cron.sh`) | **20** listings sampled | `LINK_CHECK_SAMPLE_PER_INGEST` (set `0` to skip) |
| Weekly maintenance | **Full** catalog pass | `LINK_CHECK_LIMIT=0` in `weekly-maintenance-inner.sh` |

Raise the per-ingest sample only when the catalog grows and weekly full passes are not enough. Results are logged to `ingest_run` with job `link_health` (checked / broken counts in admin).

## Memory tips

- Keep **one** Node process for the app (`nsfwdroid.service`); avoid running ingest concurrently with the app.
- Prefer **3×/day ingest** (06:00, 14:00, 22:00 UTC) over hammering the box hourly.
- Watch `free -m` and `journalctl -u nsfwdroid` after deploys; if OOM kills appear, lower link-check sample size or reduce ingest frequency before upgrading hardware.
- Backups and watchdog are documented in [`deploy-droplet.md`](deploy-droplet.md).

## Managed PostgreSQL (future only)

A separate Postgres instance adds cost and ops surface. On 512MB, the embedded catalog plus maintenance windows has been the intentional tradeoff. Revisit when:

- You need **concurrent** writers (app + heavy analytics/ingest overlap),
- Catalog size or query load makes maintenance windows too painful, or
- You move to a **larger droplet** with stable spare RAM for app + remote DB client.

Until then, stay on PGlite + `catalog-maintenance.sh` and use `INGEST_ALERT_ZERO_NEW_RUNS` plus `/api/health` for visibility.
