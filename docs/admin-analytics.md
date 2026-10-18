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

## Limits

- Historical rows before play-click rules still appear under **All events**; visitor filters apply to new traffic and referrer-shaped rows.
- Bot filtering is UA-based at ingest time — events without a stored UA cannot be retroactively classified.
- Home rails still use raw `analytics_event` counts; a follow-up could align rails with play-click SQL if rankings look inflated.
