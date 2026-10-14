# Creators, artists, and Patreon-only games

**Date:** 14 October 2026  
**Status:** product roadmap (not implemented).  
**Related:** [data-and-ingest.md](data-and-ingest.md), [how_we_get_links.md](how_we_get_links.md), [considerations.md](considerations.md).

---

## Why ~300–400 listings from one ingest is normal

A single `npm run ingest` is a **snapshot**, not a full crawl of itch.io or Steam.

| Layer | What limits you |
| --- | --- |
| **itch (~15 RSS feeds)** | Default = 3 global feeds + 12 NSFW browse feeds (`scripts/lib/itch-feeds.ts`). Browse feeds return **~36 top items each**; global `new.xml` is larger but still “recent uploads,” not the whole catalog. |
| **Dedupe** | `candidate (source, external_id)` unique + `ON CONFLICT DO NOTHING` — the same game across feeds counts once. |
| **Steam** | `data/steam-search-terms.json` (20 terms) × `STEAM_SEARCH_PER_TERM` (default 50) discovers app IDs; **`STEAM_INGEST_MAX_APPS` (default 250)** caps Store **detail** calls per run. Only games with adult content descriptors pass. |
| **Auto-publish** | TOS-clear rows promote to `listing`; holds stay in `/admin`. End-of-run sweep respects **`INGEST_AUTO_PUBLISH_LIMIT` (default 500)** pending rows per run. |
| **Re-runs** | itch has **no historical cursor** — daily cron mainly picks up **new** `new.xml` items and Steam/search deltas, not a deeper backfill of browse tops. |

**Scale levers (realistic):** more `ITCH_EXTRA_FEED_URLS`, higher `STEAM_INGEST_MAX_APPS` + `STEAM_SEARCH_PER_TERM` + terms, `STEAM_USE_APPLIST_DELTA=1` with API key, more frequent cron, developer `/submit`, admin manual rows, `npm run ingest:affiliate` from `data/affiliate-export.json`. Expect **low thousands** of listings over months with daily ingest — not tens of thousands without itch API search or a curated backfill program.

---

## “Top artists” — today vs product

### What exists now

- **Schema:** `listing` has title, URLs, platforms, tags, `chart_rank` / `chart_bucket`, `source` — **no `developer` or `artist` column**.
- **Raw data:** itch RSS items and Steam `appdetails` live in `candidate.raw_payload` (publisher/dev names may appear in Steam JSON but are **not indexed**).
- **Rails:** **Hottest** = outbound clicks (7d); **Trending** = listing views (48h); fallback to editorial `chart_rank` / publish date (`src/lib/listings.ts`, `src/lib/analytics.ts`).
- **Tags:** `tag` / `listing_tag` from feed context and title heuristics — not creator identity.

### Proposed features (phased)

1. **Phase A — derive without new tables**  
   - Parse Steam `developers` / `publishers` from `raw_payload` on publish; optional itch `dc:creator` when present.  
   - Admin field on manual listings.  
   - Home rail: **“Popular studios”** = aggregate `outbound_click` by normalized developer string (top N).

2. **Phase B — `creator` entity**  
   - Table: `creator` (slug, display_name, official_url, optional itch/steam/patreon links, `verified_at`).  
   - `listing.creator_id` FK; many-to-one for now.  
   - Public **`/creator/[slug]`** — bio (curated), all listings, outbound Patreon/itch/Steam buttons.  
   - Rails: **“From this creator”**, **“Featured creators”** (`chart_bucket` or `sponsorship` on creator row).

3. **Phase C — ranking & trust**  
   - **Top artists** = sum of listing clicks/views per creator (7d / 30d), with minimum listing count.  
   - **Verification:** email domain, linked store page, or staff badge after `/submit` review.  
   - Follow creators (extend `user_favorite` or new `user_follow_creator`) — see [account-roadmap.md](account-roadmap.md).

---

## Patreon-only makers (no itch / Steam listing)

### What the repo supports today

| Path | Patreon-friendly? |
| --- | --- |
| **`/submit`** | Yes — `official_url` can be a Patreon campaign URL; creates `developer_form` candidate + same TOS/auto-publish pipeline. |
| **`/admin/listings/new`** | Yes — manual `listing` with any outbound URL (curated partner / creator link). |
| **`ingest:affiliate`** | JSON file ingest (`AFFILIATE_EXPORT_PATH`) — for affiliate program exports, not Patreon API. |
| **itch / Steam jobs** | No — Patreon-only games never appear in those feeds. |

### Policy framing (link-out catalog)

- List **outbound links** to the creator’s Patreon (or site); **do not** host builds, mirror posts, or scrape member-only RSS without permission.  
- Artwork: typographic cards or creator-provided promo stills under [considerations.md](considerations.md).  
- Patreon **API/RSS** is for creators who opt in; bulk scraping campaigns is fragile and may conflict with Patreon ToS — prefer **submitted or staff-curated** URLs.

### Phased approach

**Phase 1 — Curated catalog (now)**  
- Staff manual listings: title, Patreon URL, platforms tag `patreon`, optional `creator` name in admin notes → later `creator_id`.  
- **`chart_bucket = featured_creators`** rail for sponsored/ editorial picks.  
- Submit form copy: explicitly welcome “Patreon-only — link to your campaign.”

**Phase 2 — Creator submissions at scale**  
- Submit: optional **Patreon URL** field + “I confirm I own this campaign” checkbox.  
- `source` stays `developer_form`; `external_id` hash already dedupes email+URL+title.  
- Verification queue: match Patreon public page title to submitted title; staff approve edge cases.

**Phase 3 — Optional automation**  
- Per-creator **public RSS** (when Patreon exposes it) → new ingest source `patreon_rss` with **allowlisted campaign IDs** only (creator opt-in list), writing candidates with `outbound_url` = post or campaign — still link-out, no file hosting.  
- No default global Patreon crawl.

**Phase 4 — Product**  
- Creator profiles, “More from this Patreon,” affiliate/referral if Patreon offers tagged links.  
- Featured creators rail driven by analytics + editorial `sponsorship`.

---

## Suggested implementation order

1. Document + submit-page copy for Patreon URLs (Phase 1).  
2. `creator` table + manual admin assign (Phase B.1).  
3. Developer string extraction from Steam on ingest (Phase A).  
4. Creator profile pages + “top artists” rail from analytics aggregates (Phase B–C).  
5. Opt-in Patreon RSS source only after legal review (Phase 3).
