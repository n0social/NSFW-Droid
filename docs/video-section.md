# Video section (link-out)

**Date:** 15 October 2026  
**Status:** MVP shipped — home **Recent videos** rail (RSS `pubDate`); `/videos` **Top videos** (popular HTML listing)  
**Related:** `docs/how_we_get_links.md`, `docs/considerations.md`

NSFW Droid is a **link-out catalog**. The video section lists **outbound links** to clips on third-party sites. We do **not** host, proxy, or embed video binaries. Cards may show a **thumbnail URL from the RSS item** (same blur / age-gate behavior as game covers). Playback always happens on the publisher’s site.

## RSS research (Phase 1)

### SFM Compile (`sfmcompile.com` / `sfmcompile.club`)

| Question | Finding |
| --- | --- |
| Public RSS? | **Yes** — WordPress default feed |
| Canonical feed URL | `https://sfmcompile.club/feed/` (also reachable via `https://sfmcompile.com/feed/`, which serves the same channel) |
| Format | RSS 2.0 with `media:` (MRSS) thumbnails and `enclosure` MP4 URLs |
| Update cadence | Channel advertises hourly (`sy:updatePeriod`) |
| `robots.txt` | Allows general crawling; only `/wp-admin/` disallowed |

**Implementation choice:** Use the feed for **title, link, pubDate, categories, and `media:thumbnail` only**. Ignore `enclosure` video URLs so we never deep-link to raw MP4 files on our UI (users open the **post URL** on SFM Compile).

**Popular / top ranking:** The site exposes `?filter-by=popular` in HTML (Snax/Bimber view counts). RSS variants such as `feed/?filter-by=popular` return the **same item order as the default channel**, so they are **not** used for “top” ranking.

**ToS / product:** WordPress feeds are intended for syndication. We identify with `User-Agent: NSFW-Droid-Catalog/0.1`, cache RSS (~1 hour) for the home rail, and cache the popular listing HTML on a **separate** TTL (~30 min) for `/videos` only. No affiliate program is wired for this source unless added later.

### Rule34Video (`rule34video.com`)

| Question | Finding |
| --- | --- |
| Native RSS/Atom at common paths | **No** — `/feed`, `/rss`, `/atom` return **404** (or **403** behind DDoS-Guard from some IPs) |
| `robots.txt` | Disallows many dynamic/player paths; **no** `Disallow: /feed` (because no feed exists) |
| Third-party “RSS” | Community tools (e.g. RSSHub routes, Python scrapers) **scrape** the site — **not** used here |

**Implementation choice:** **Not enabled** in `data/video-feeds.json`. Enabling Rule34Video would require either an official feed from the operator or manual curation — not HTML scraping per `docs/how_we_get_links.md`.

## Configuration

- `data/video-feeds.json` — RSS feeds (`feeds`), `topListing` (popular HTML URL + caps), cache TTLs (`revalidateSeconds`, `topRevalidateSeconds`)
- `src/lib/video-feeds.ts` — `getRecentVideos` (RSS, sort by `pubDate`); `getTopVideos` (popular HTML + optional RSS enrich for dates/thumbs)

Environment overrides are not required for MVP; adjust the JSON file to add feeds or disable SFM Compile.

## UI / policy

- **Route:** `/videos` — **Top videos** grid (popular listing, up to 48 items)
- **Home:** horizontal **Recent videos** rail (RSS, newest first, up to 8 items)
- **Nav:** “Videos” in site header
- **Age gate:** same cookie flow as games; thumbnails blurred until verified (and when user blur toggle is on)
- **No embeds:** no `<video>` tags, no iframes of publisher players on our origin
- **Affiliate:** N/A for video feeds unless a program is added later

## Legal / ops notes

- Respect publisher `robots.txt` and terms; **do not** scrape listing HTML when RSS is absent.
- Do not bypass paywalls or hotlink MP4 `enclosure` URLs as primary CTAs.
- Thumbnails are hotlinked from the publisher CDN with `referrerPolicy="no-referrer"`; if a publisher objects, disable thumbnails in code or remove the feed.
- Monitor feed failures in server logs; the videos page shows a friendly empty state when all sources fail.

## Future options

1. **Rule34Video:** Ask the site operator for an official RSS/API, or maintain a **manual curator list** (JSON) of outbound URLs — same pattern as `data/itch-manual-game-urls.json`.
2. **More WordPress mirrors:** Only add feeds that are **documented public RSS**, not scrapers.
3. **Self-hosted RSSHub:** Possible technically for Rule34Video, but conflicts with our no-scrape policy unless the operator approves.
