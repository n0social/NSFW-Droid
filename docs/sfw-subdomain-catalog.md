# SFW Android catalog — subdomain concept

**Date:** 30 October 2026  
**Status:** owner-facing research / design only — no routes or ingest changes yet.  
**Related:** [architecture.md](architecture.md), [data-and-ingest.md](data-and-ingest.md), [design-and-mascot.md](design-and-mascot.md), [shop-design-concepts.md](shop-design-concepts.md).

---

## What we are proposing

A **separate hostname** under `nsfwdroid.com` that lists **safe-for-work Android game titles** (itch / Play-style outbound links only — same Phase 1 model as the main catalog). It reuses the storefront UX (hero, rails, platform chips) but drops or softens the 18+ gate and NSFW ingest filters.

**Honest brand tension:** the registrable apex still says **NSFW**. A subdomain cannot fully erase that for app-store reviewers, school filters, or parents — but **`sfw.`** makes intent explicit for SEO, Search Console, and PG ad networks. Benefits of one droplet + one Next.js deploy: shared admin, ingest jobs, and ops playbooks.

---

## Subdomain name options

| Host | Pros | Cons |
| --- | --- | --- |
| **`sfw.nsfwdroid.com`** | Says exactly what it is; easy GSC property; pairs with future `www` cross-links | Still under an adult-branded registrable domain |
| **`android.nsfwdroid.com`** | Strong “Android games” SEO | Does **not** imply SFW; sounds like an APK store (Phase 2) |
| **`play.nsfwdroid.com`** | Short, action-oriented | Collides with Google Play mental model; ambiguous maturity |

**Recommendation:** **`sfw.nsfwdroid.com`** — maturity signal matters more than platform keyword in the hostname; Android scope is handled in UI (default platform chip, ingest feeds, copy).

---

## Current stack (what exists today)

| Area | Today |
| --- | --- |
| **Caddy** (`deploy/Caddyfile`) | Apex → `www`; only `www.nsfwdroid.com` and IP vhost proxy `:3000` |
| **Middleware** (`src/middleware.ts`) | 301 apex → `www`; security headers; `noindex` on admin/go/ads — **no host-based catalog modes** |
| **Canonical** (`src/lib/canonical-host.ts`, `layout.tsx` `metadataBase`) | Single origin from `NEXT_PUBLIC_SITE_URL` (`www`) |
| **Age gate** (`AgeGate`, `/api/age-gate`, `age_verified` cookie) | Full-screen 18+ on home, browse, game detail, videos |
| **Catalog data** | PGlite/Postgres `listing` rows — **no `content_rating` column** |
| **NSFW enforcement** | Default `CATALOG_NSFW_ONLY=1`, `ITCH_NSFW_ONLY=1`; `isMatureCatalogCandidate()` in `src/lib/catalog-maturity.ts`; non-mature rows rejected or cleaned by `scripts/unpublish-non-nsfw-listings.ts` |
| **Browse “vanilla”** | **Not SFW** — hides *niche* NSFW tags on `/browse?vanilla=1`, still adult catalog |
| **Android on home** | Client-side chip filter in `ChipRow` / `Storefront` (`platforms` array includes `android`) |
| **Ads** | ExoClick footer + popunder; gated on `age_verified` (`src/lib/ads-config.ts`) |

---

## Technical shapes (compare)

### A — Same Next.js app, host-based “site mode” (recommended if built)

- **Caddy:** add `sfw.nsfwdroid.com { reverse_proxy 127.0.0.1:3000 }` (same process as `www`).
- **App:** resolve mode from `Host` (middleware or server layout): `sfw` vs `main`.
- **Catalog queries:** filter `platforms @> '{android}'` **and** SFW eligibility (new field or tag — see [Data](#data-sfw-eligibility)).
- **Theme:** alternate CSS tokens (cooler teal/cyan palette — shop doc already uses `#22FF88` greens as a PG-ish direction).
- **Age gate:** skip or replace with lightweight “13+ / general audience” copy + cookie (no blur on covers for SFW mode).
- **SEO:** `metadataBase` / canonical URLs must be **host-aware** (`https://sfw.nsfwdroid.com/game/...`) — today `NEXT_PUBLIC_SITE_URL` is build-time single-origin; host detection in server components fixes this without a second build.

**Pros:** one deploy, one admin queue (with labels), shared link checker.  
**Cons:** must audit every route (creators hubs, videos, newsletter) for **hide or noindex** on SFW host; risk of leaking NSFW rows if filter is wrong.

### B — Path prefix only (`www.nsfwdroid.com/sfw/...`)

- **Pros:** no DNS; reuse single canonical site URL.
- **Cons:** “NSFW Droid” wordmark and `/sfw` under adult site hurts positioning; age gate and ExoClick context remain on same property; worse for PG ads and school filters; GSC still one mixed-intent property.

**Use when:** prototyping only — not a long-term product surface.

### C — Separate lightweight deploy on subdomain

- Second systemd unit or container, env `CATALOG_MODE=sfw`, optional **separate PGlite directory** or DB schema slice.
- **Pros:** blast-radius isolation; SFW build can omit popunder scripts entirely.
- **Cons:** two releases, two health checks, 512MB droplet pressure; shared DB without strict row-level labels is dangerous.

**Use when:** compliance or ad network requires hard separation — otherwise prefer **A** with strong row labels and tests.

---

## Product UX

| Element | Main site (`www`) | SFW subdomain |
| --- | --- | --- |
| **Wordmark** | NSFW**Droid** (magenta accent) | **SFW** Droid or “SFW Droid” with **Andri** mark — avoid “NSFW” in header |
| **Mascot** | Vesper ecchi host + Andri icon | **Andri-first** (PG bust already in header); Vesper only in **storefront-outfit** poses if any |
| **Palette** | Violet `#14061C`, magenta `#C026D3` | Cooler: deep blue-violet bg, teal/cyan primary (align with shop token experiment) |
| **Age** | Hard 18+ gate + cover blur pre-gate | Optional minimal age (13+) or none — **legal review** before dropping gate entirely |
| **Nav** | Full: New, Browse, Creators, Videos, … | Slim: Home, Browse, Submit; hide adult hubs / creator NSFW sections |
| **Footer** | Standard legal + affiliate | Same legal entity; **cross-link:** “18+ catalog → www.nsfwdroid.com” / “Family-friendly Android → sfw.nsfwdroid.com” |
| **SEO canonical** | Per-host canonical URLs; **no** cross-canonical between hosts; sitemap per property |

---

## Data — SFW eligibility

Today’s pipeline **only admits mature titles** (`catalog-maturity.ts`, itch NSFW browse feeds in `scripts/lib/itch-feeds.ts`). There is **no** inverse “SFW flag” on `listing`.

**Likely implementation path:**

1. **Schema:** `listing.catalog_audience` enum (`nsfw` | `sfw`) or boolean `sfw_ok` set at approve time.
2. **Ingest:** additional feeds, e.g. `https://itch.io/games/platform-android.xml` (non-NSFW browse), genre feeds without adult tags; **per-item** reject if mature keywords/tags match existing regexes.
3. **Steam:** filter **out** adult descriptors (inverse of `isMatureSteamPayload`); expect **few** Android-native Steam rows.
4. **Manual:** admin approvals for Play Store pages (no automated Play ingest in v1).
5. **Do not** reuse browse `?vanilla=1` — that only deprioritizes niche **adult** tags (`listings-ranking.ts`).

**Launch content:** expect **manual curation + itch SFW Android feeds** until volume justifies automation; main catalog rows are overwhelmingly NSFW-tagged and unsuitable to “filter invert.”

---

## Ops

**DNS:** `A`/`AAAA` for `sfw` → same droplet as `www`.

**Caddy snippet (illustrative):**

```caddy
sfw.nsfwdroid.com {
	encode gzip
	reverse_proxy 127.0.0.1:3000
	handle_errors 502 503 504 {
		root * /var/www/nsfwdroid/deploy
		rewrite * /maintenance.html
		file_server
	}
}
```

**Env (droplet `/etc/nsfwdroid.env` — illustrative):**

- Host mode can be runtime; optional `SFW_HOST=sfw.nsfwdroid.com` for sitemap/cookie domain scoping.
- Separate itch feed list env for SFW ingest job (or second cron calling ingest with `CATALOG_AUDIENCE=sfw`).
- **Ads:** disable ExoClick on SFW (`NEXT_PUBLIC_ADS_ENABLED=0`) until a PG network is approved; no popunder on family surface.
- **Analytics:** separate GA4 property or dimension `site_mode=sfw` if enabled.

**Search Console:** register **URL-prefix** or domain property including `sfw.nsfwdroid.com`; submit dedicated sitemap.

**Deploy:** same tarball flow as [deploy-droplet.md](deploy-droplet.md); Caddy reload after DNS cutover — prefer [autonomous-ops maintenance window](autonomous-ops.md#human-scheduled-changes-dns-deploy-maintenance).

---

## Wireframe — `sfw.nsfwdroid.com` home (PG storefront)

Mirror `Storefront.tsx` rails; default **Android** chip; no blur; Andri header.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ HEADER  [Andri] SFW Droid     Home  Browse  Submit          [♥] Sign in      │
│         "128 Android games" badge (example)                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ HERO (single featured title — PG capsule art, no ecchi host)                  │
│  ┌──────────────────────────────┐  Featured: "Pixel Quest RPG"               │
│  │  cover 16:9                   │  Short store synopsis (2 lines max)       │
│  └──────────────────────────────┘  [ View game ]                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ CHIPS  [ Android* ] [ All ] [ New ] [ Browser ] …   (*default active)       │
├──────────────────────────────────────────────────────────────────────────────┤
│ Rail: New on Android          horizontal GameCards, PG covers                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ Rail: Free & notable          optional editorial picks                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ BANNER  Looking for 18+ titles? → www.nsfwdroid.com (outbound, new tab)     │
├──────────────────────────────────────────────────────────────────────────────┤
│ FOOTER  Terms · Privacy · DMCA · Affiliate · © SFW Droid / NSFW Droid       │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Decision summary

| Question | Guidance |
| --- | --- |
| Build now? | **No** — needs schema + ingest + host-aware SEO; doc-only planning is sufficient |
| Best hostname? | **`sfw.nsfwdroid.com`** |
| Best architecture? | **Same app, host-based mode (A)** unless an ad/compliance partner mandates split deploy |
| Biggest gap? | **Data** — current DB is NSFW-only; SFW is a new catalog slice, not a filter on existing rows |
