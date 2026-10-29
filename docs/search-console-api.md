# Google Search Console API (admin analytics)

Admin page **`/admin/search`** shows Google Search **Performance** metrics aligned with the GSC UI: **queries**, **clicks**, **impressions**, **CTR**, and **average position** (default last **28** days, through yesterday UTC).

First-party `analytics_event` rows **cannot** replace GSC: they do not include search queries, SERP impressions, or Google→site click counts. The admin page labels both sources clearly.

Operational GSC property setup (sitemap, verification) stays in [search-console.md](search-console.md).

---

## Can we capture the same data as GSC?

| Metric | GSC API (this feature) | First-party analytics |
|--------|------------------------|------------------------|
| Search queries | Yes | No |
| Clicks from Google Search | Yes | No (only on-site play clicks via `/api/go`) |
| Impressions on Google | Yes | No |
| CTR / avg position | Yes | No |
| Referer contains `google.` | Rare on stored events | Partial / misleading for play clicks |

**Honest answer:** Same as GSC only with **Search Console API** credentials and property access. Without them, use the GSC web UI or configure env below.

---

## Owner setup

1. **Google Cloud project**
   - APIs & Services → Enable **Google Search Console API** (`webmasters.googleapis.com`).

2. **Service account**
   - IAM → Service Accounts → Create → Keys → JSON (download once).
   - Minify to **one line** for the droplet (same pattern as `FIREBASE_SERVICE_ACCOUNT_JSON`).

3. **Search Console property**
   - Use the same URL as production HTML: **`https://www.nsfwdroid.com/`** (URL-prefix property).
   - Settings → **Users and permissions** → Add user → paste **`client_email`** from the JSON → **Full** (or Restricted with Performance read).

4. **Droplet env** (`/etc/nsfwdroid.env`, never commit):

   ```bash
   GSC_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   # Optional — defaults from NEXT_PUBLIC_SITE_URL + trailing slash
   GSC_PROPERTY_URL=https://www.nsfwdroid.com/
   # Optional
   GSC_WINDOW_DAYS=28
   GSC_CACHE_PATH=data/.gsc-search-cache.json
   GSC_SYNC_ENABLED=1
   ```

5. **Sync**
   - Cron (recommended): `deploy/cron.d/nsfwdroid-gsc-sync` — daily **07:15 UTC** (after typical GSC lag).
   - Manual: `npx tsx scripts/gsc-sync.ts` (from app root with env loaded).
   - Admin UI: **Sync GSC now** (also auto-refreshes stale cache on page load when credentials exist).

6. **Restart** not required for env-only changes if sync runs via cron/script; admin reads cache from disk. After first deploy of this feature, run sync once or open `/admin/search`.

---

## Cache file

- Default path: **`data/.gsc-search-cache.json`** (alongside PGlite under `data/`).
- Back up with catalog backups if you treat search history as important.
- On API errors, last good cache is kept; failed sync may write `syncError` into the file.

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| `403` / permission denied | Service account email added in GSC property; property URL matches `GSC_PROPERTY_URL` exactly |
| `404` site | Property must exist; URL-prefix includes trailing slash |
| Empty queries | New property or low impressions; widen date range via `GSC_WINDOW_DAYS` |
| Admin shows setup box | `GSC_SERVICE_ACCOUNT_JSON` unset on droplet |

Verify config locally (no network):

```bash
npx tsx scripts/test-gsc-config.ts
```

---

## Related

- [admin-analytics.md](admin-analytics.md) — visitor play clicks vs noise
- [search-console.md](search-console.md) — sitemap, robots, owner checks
