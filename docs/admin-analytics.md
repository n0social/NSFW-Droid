# Admin analytics — visitor vs noise

First-party metrics live in Postgres (`analytics_event`). They power the admin dashboard, traffic marker, and home rails (`getHotListings` / `getRecentPopular`). Google Analytics (if enabled separately) is independent.

## What counts as a **play click** (visitor)

Recorded on `GET /api/go/[listingId]` only when **all** of the following hold:

1. Age gate cookie `age_verified=1`
2. `Referer` is the same host as the public site (not `/admin/*`)
3. Not a known bot `User-Agent` (curl, HeadlessChrome, `NSFW-Droid-Catalog`, etc.)
4. No `X-NSFWDroid-Internal: 1` header
5. No active `admin_session` cookie (admin QA while signed in)

Each browser gets `analytics_sid` (httpOnly) so unique-browser counts are not the shared age-gate value.

## Card impressions

`POST /api/analytics/view` with `listing_id` when a card is half visible. Same bot / internal / admin skips as above. One impression per browser per listing per path per 24h.

## Admin UI

- **Visitors only** (default): play-click SQL + tagged-row exclusion.
- **All events**: raw `outbound_click` rows (includes crawler GETs and old noise). Use for debugging only.
- **Search (GSC)** (`/admin/search`): Google Search Performance via API when configured — see [search-console-api.md](search-console-api.md). Not the same as play-click totals on the dashboard.

## Testing without polluting stats

| Scenario | What to do |
|----------|------------|
| Local dev browsing | Normal — low volume |
| Cloud agent / script hitting production | Send `X-NSFWDroid-Internal: 1` on every request (see `scripts/lib/analytics-probe-headers.ts`) |
| Admin checking storefront links | Stay logged out of `/admin`, or accept that admin-session clicks are skipped |
| Link ingest / catalog scripts | They do not call `/api/go`; itch HEAD checks are unrelated |

Verify helpers:

```bash
npx tsx scripts/test-outbound-click-record.ts
npx tsx scripts/test-visitor-click-sql.ts
npx tsx scripts/test-analytics-session.ts
```

## Purging inflated historical rows

Older traffic used the age-gate cookie as `session_hash`, so one hash represented every browser. Crawler
`GET /api/go` rows without a referrer may also remain in the table. Home **Hot** / **Trending** and visitor
dashboard metrics ignore those rows after cleanup.

Dry-run (default):

```bash
npx tsx scripts/purge-inflated-analytics.ts
```

Apply deletes (backup `data/catalog` first):

```bash
npx tsx scripts/purge-inflated-analytics.ts --apply
```

On the production droplet, stop the app via `scripts/catalog-maintenance.sh` so PGlite is not locked:

```bash
sudo /var/www/nsfwdroid/scripts/catalog-maintenance.sh -- \
  npx --yes tsx scripts/purge-inflated-analytics.ts
sudo /var/www/nsfwdroid/scripts/catalog-maintenance.sh -- \
  npx --yes tsx scripts/purge-inflated-analytics.ts --apply
```

Rows removed match the same rules as visitor play clicks / impressions: bad or missing referrer, admin
referrer, shared legacy `session_hash`, tagged `internal` / `adminSession` metadata, and stored bot
`metadata.userAgent` when present.

Predicate helpers: `src/lib/analytics-purge.ts`, `scripts/test-analytics-purge.ts`.

## Limits

- Bot filtering at ingest is UA-based — events without a stored `metadata.userAgent` cannot be
  retroactively classified unless they fail referrer/session rules above.
- **All events** in admin still shows any rows left in the table; run the purge script to shrink noise.
