# Traffic interpretation (ops)

Plain-language guide for **Cloudflare edge stats**, **Google Search Console (GSC)**, **GA4**, and **first-party admin metrics**. Not legal or SEO advice.

## Three different counters

| Source | What it counts | Use it for |
| --- | --- | --- |
| **Cloudflare Analytics** | Every HTTP request at the edge: HTML, JS/CSS chunks, images, fonts, `/api/*`, crawlers | Capacity, abuse, rough bot vs human mix |
| **GA4** (Firebase measurement ID in `docs/firebase-setup.md`) | Browser sessions/events when the SDK loads | Marketing funnels, landing paths (not wired into admin) |
| **`analytics_event`** (`/admin`, `/admin/traffic`) | Server rows: `outbound_click`, `listing_view`, `page_view` | Product signal: store clicks, rails, newsletter picks |

Deploy notes: first-party rails stay in Postgres/PGlite; GA is optional funnel context (`docs/deploy-droplet.md`).

## Cloudflare: total requests vs “web crawl” bots

- **Total web requests** (e.g. ~36k / 7 days) is **not** “36k visitors.” One human page load often becomes many requests (document + Next assets + images).
- **Web crawl / bot** buckets (e.g. ~6.6k / 7 days) are requests Cloudflare classifies as automated crawlers. If both numbers are from the **same** 7-day window and dashboard, the ratio is roughly **crawl requests ÷ all requests** (e.g. ~18% — verify in your CF UI; do not treat chat copy as ground truth).
- Other bot traffic may appear under different CF labels (scrapers, AI crawlers, “verified bots”) and still count in **total** without being in “web crawl.”
- **Healthy for an indexed catalog:** sitemap + many `/game/[slug]` URLs (`docs/seo-game-pages.md`) means Google, Bing, and third-party SEO tools **should** fetch regularly. Crawl share often lands in a **teens-to-thirties percent of total requests** for small catalog sites — spikes matter more than the exact ratio.

## GSC vs Cloudflare crawl

- **GSC → Settings → Crawl stats** (and Page indexing): mostly **Googlebot** on URLs Google cares about. Slow rise with new listings is normal; sudden crawl **errors** or excluded pages are worth fixing (404 slugs, `noindex`, maintenance windows — see `docs/deploy-droplet.md` maintenance).
- Cloudflare “web crawl” includes **many non-Google** bots (Ahrefs, Semrush, GPTBot, etc.). GSC will **not** match CF bot totals.
- **Impressions and clicks** in GSC are the SEO outcome metric; edge crawl volume is only “Google is still reading the shelf.”

## What first-party admin numbers mean

- **`outbound_click`**: real intent — someone hit **`/api/go/[listingId]`** (Play / store CTA). Best single “did browsing turn into a store visit?” metric (`docs/engagement-policy.md`).
- **`listing_view`**: posted from the browser via **`POST /api/analytics/view`** when game cards mount and on game detail load — **requires JavaScript**. Most crawlers that only fetch HTML **do not** create these rows. Cards on the home page fire **one view per visible card**, so listing views are **not** unique people.
- **Accounts / sign-ups (7d)**: Firebase `user_profile` — optional engagement (`docs/engagement-policy.md`). Low signups with meaningful outbound clicks is an expected mode for a browse-first catalog.

There is **no** bot filter on admin SQL today; do not compare raw `listing_view` totals to Cloudflare requests 1:1.

## Cloudflare Bot Fight / bot management

Not documented in-repo. In general:

- **Verified bots** (including Googlebot) should still reach origin for SEO.
- Aggressive bot modes can reduce junk scraper traffic and sometimes **change** the mix you see in analytics; watch GSC crawl errors after toggling settings — do not optimize signup CTAs because of edge bot ratios.

## What to watch (product / ops)

1. **GSC:** impressions and clicks trend; indexing coverage for new games; crawl anomalies after deploy/maintenance.
2. **Admin:** **outbound clicks (7d)** and **top listings by clicks**; `/admin/traffic` daily chart for step-changes (Mastodon drops, newsletter, seasonal).
3. **Newsletter funnel:** opens/clicks from mail logs (`docs/social-engagement-playbook.md`); picks use recent `listing_view` / clicks (`docs/reward_program.md`).

## What not to over-optimize

- **Signup pressure** — anonymous catalog use is by design; hearts and saved filters require sign-in.
- **Cloudflare total request count** — edge volume scales with assets and bots; optimize **store outbound clicks** and **search visibility**, not raw requests.
- **Matching GA4 users to CF requests** — different definitions, cookies, and ad blockers.

## Quick sanity check (same 7-day window)

In Cloudflare, note total requests and bot/crawl breakdown. In **`/admin`**, note **outbound clicks (7d)** and **listing views (7d)**. In GSC, note **clicks** and **impressions**. If CF totals are high but admin outbound clicks are flat, traffic may be bots, asset-heavy bounces, or browse without Play — not necessarily “broken.”
