# Google Search Console (GSC)

Operational guide for **NSFW Droid** search visibility. The app serves crawlable catalog HTML at **`https://www.nsfwdroid.com`**; GSC **Performance** (clicks/impressions) often lags live traffic by **48–72 hours** and can look “flat” after sitemap or robots fixes while Google reprocesses URLs.

No Search Console API is required for normal owner operations (sitemap, URL inspection). To mirror **Performance** metrics inside **`/admin/search`**, configure the API per [search-console-api.md](search-console-api.md).

---

## Property setup (owner)

1. **Use the same host as production HTML**
   - Preferred: **URL prefix** property → `https://www.nsfwdroid.com/`
   - Alternative: **Domain** property → `nsfwdroid.com` (includes apex + www; apex **301**s to www in Caddy + middleware).
   - Do **not** rely on a property that only tracks `https://nsfwdroid.com` without redirects — HTML canonicals and `metadataBase` point at **www**.

2. **HTML verification**
   - Live meta tag (also in `src/app/layout.tsx` `verification.google`):  
     `google-site-verification` content `BXBbvduSwlB899d8SScucuK5H8FtDBNT9zz7wOtj9lM`
   - Confirm on **View page source** for `/` and a sample `/game/...` URL.

3. **Sitemap**
   - Submit: **`https://www.nsfwdroid.com/sitemap.xml`**
   - After deploy or catalog ingest, open **Indexing → Sitemaps** → **Resubmit** (or remove and re-add if status stuck).
   - Expect **800+** discovered URLs (static hubs + tag hubs + published games). Last read should be **Success**.

4. **URL Inspection (batch sanity)**
   - Inspect one hub: `https://www.nsfwdroid.com/browse`
   - Inspect one game from **Indexing → Pages** or sitemap.
   - Expect: **URL is on Google** or **URL is not on Google** with reason (not “Crawl blocked by robots.txt”).
   - Use **Test live URL** after deploy if you changed robots/sitemap.

5. **Performance report lag**
   - Default chart may end **2–3 days** before “today”; partial days at the right edge are normal.
   - Compare **Performance** date range (last 28 days, through today) with **Indexing → Pages** — indexing counts can move while Performance still looks flat for a few days.

6. **When impressions drop after a fix (Oct 2026 pattern)**
   - Bad sitemap URLs and stale ISR were fixed in app deploys (~Oct 26 UTC). Recovery of impressions/clicks is **days to weeks**, not hours — not a signal to block crawlers further.

---

## Cloudflare Managed `robots.txt` (owner, dashboard)

Production **`/robots.txt`** prepends **“BEGIN Cloudflare Managed content”** (not in git):

- **`User-agent: *`** → `Content-Signal: search=yes,...` and **`Allow: /`**
- Separate **`Disallow: /`** blocks target **AI/assistant** agents (`Google-Agent`, `ChatGPT-User`, etc.) — **not** `Googlebot` / `Googlebot-Image`.

**If Performance or Coverage suddenly shows “Blocked by robots.txt”:**

1. Cloudflare → **Security / Bots** (or **Managed robots.txt**) — note when settings last changed.
2. Ensure no WAF/custom rule blocks **Googlebot** user-agent or Google crawl IP ranges.
3. Re-run post-deploy smoke (below).

App-generated rules (after the Cloudflare block) come from **`src/app/robots.ts`**: explicit **`User-agent: Googlebot`** and **`*`** with the same **Allow** list for catalog/legal paths and **Disallow** for admin/API/account/auth.

---

## Engineering checks (no GSC login)

From repo root against production (or staging base URL):

```bash
./scripts/verify-robots-http.sh https://www.nsfwdroid.com
./scripts/verify-sitemap-http.sh https://www.nsfwdroid.com
```

Googlebot HTML smoke:

```bash
UA='Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
curl -fsSI -A "$UA" https://www.nsfwdroid.com/ | head -5
curl -fsSI -A "$UA" https://www.nsfwdroid.com/browse | head -5
curl -fsSI -A "$UA" 'https://www.nsfwdroid.com/game/<known-slug>' | head -5
```

Expect **200** on catalog routes, no **`X-Robots-Tag: noindex`** on `/`, `/browse`, or `/game/...`.

Unit/smoke in CI:

```bash
npm run test:seo-utility
npm run test:seo-canonical-host
npm run test:sitemap-slug-safety
npm run test:site-json-ld
```

---

## Deploy checklist (when SEO files change)

1. Merge to `main` and run **`./scripts/cloud-agent-deploy-droplet.sh`** (see `docs/deploy-droplet.md`).
2. Deploy script removes stale **`.next/server/app/sitemap.xml.*`** ISR artifacts.
3. Verify **`https://www.nsfwdroid.com/api/health`** → ok.
4. Run **`verify-robots-http.sh`** and **`verify-sitemap-http.sh`** against production.
5. Owner: **resubmit sitemap** in GSC (step 3 above).

---

## Related docs

- `docs/seo-game-pages.md` — per-game metadata, JSON-LD, sitemap fields
- `src/app/sitemap.ts` — dynamic sitemap (`force-dynamic`), www `siteUrl`, game `lastModified`
- `src/middleware.ts` — `noindex` only on admin and selected API routes; apex → www redirect

---

## Expected timeline after fixes

| Milestone | Typical timing |
|-----------|----------------|
| Deploy live (robots/sitemap/HTML) | Immediate |
| GSC Sitemap “Last read” success | Hours–1 day |
| URL Inspection reflects crawl allowance | Minutes–hours after live test |
| Performance impressions/clicks catch up | **48–72 h** reporting lag + **days–weeks** after sitemap cleanup |

If **Indexing → Pages** grows or stabilizes but **Performance** is still flat through a full **72 h** window after resubmit, re-check property URL (www vs apex) and Cloudflare bot settings before changing app code again.
