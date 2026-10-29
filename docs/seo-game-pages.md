# Per-game SEO detail pages

**Shipped:** October 2026

## Routes

- **`/game/[slug]`** — public detail page for each published listing (`link_status = ok`, `catalog_stale = false`).
- Unknown or unpublished slugs return **404**.

## Site-wide defaults

Root `src/app/layout.tsx` sets a default **Open Graph** and **Twitter** image (`/og-default.png`, 1200×630) for pages that do not define their own preview image. `metadataBase` resolves it to an absolute URL on shares.

## Metadata

Each game page sets:

- `title` (display title from catalog, brackets stripped per `listing-display.ts`)
- `description` (generated from platforms, store source, and browse-safe tags — no store pricing)
- `alternates.canonical` → `/game/{slug}`
- **Open Graph** and **Twitter** cards; `summary_large_image` when `cover_image_url` is set

## JSON-LD

Each game page embeds a single `<script type="application/ld+json">` built in `src/lib/listing-json-ld.ts` (`buildGamePageJsonLd` — `@graph` with listing + breadcrumbs):

| Field | Source |
| --- | --- |
| `@type` | `VideoGame` (default) or `SoftwareApplication` when platforms are browser-only |
| `name` | Display title (`listing-display.ts`) |
| `description` | Same copy as meta description (`listingMetaDescription`) |
| `image` | `cover_image_url` when set |
| `url` | Canonical `NEXT_PUBLIC_SITE_URL` + `/game/{slug}` |
| `gamePlatform` / `operatingSystem` | `listing.platforms` (latter for browser-only `SoftwareApplication`) |
| `genre`, `keywords` | Browse-safe tag labels for the listing |
| `audience` | `PeopleAudience` with `requiredMinAge: 18` |
| `BreadcrumbList` (2nd graph node) | Home → Browse catalog → game title |

## Cover image alt text

`GameCard` and the game detail hero use `listingCoverImageAlt()` (`listing-display.ts`) — the display title (brackets stripped), with fallback `Game cover`. Open Graph image `alt` uses the same helper.

## Age gate & blur

Same pattern as home/browse: `AgeGate` until `age_verified` cookie; covers blurred when unverified or when `blur_covers=1` (opt-in in Settings).

## Outbound & analytics

- Primary CTA: **`/api/go/[listingId]`** (affiliate-aware redirect).
- **`listing_view`** posted to `/api/analytics/view` on detail load (anonymous, per `docs/engagement-policy.md`).
- `GameCard` / hero link to the detail page; card **Play** chip and detail CTA use `/api/go/`.

## Sitemap & robots

- `app/sitemap.ts` — static site URLs, browse-safe **`/browse?tag={slug}`** tag hubs (at least one published title; `lastModified` from latest tagged listing), plus all published `/game/...` entries (`lastModified` from `listing.updated_at`).
- `app/robots.ts` — explicitly allows catalog and legal paths (`/`, `/browse`, `/new`, `/videos`, `/creators`, `/links`, `/game/`, etc.); disallows `/admin/`, `/api/`, `/account/`, auth/settings/newsletter/underage utility paths. Production `robots.txt` may prepend **Cloudflare Managed** AI-crawler rules; `Googlebot` is not in that disallow list (see `scripts/verify-robots-http.sh`).

## Canonical host (Search Console)

- **`NEXT_PUBLIC_SITE_URL`** must be the primary index host (production: `https://www.nsfwdroid.com`).
- Bare **`https://nsfwdroid.com`** must **301** to `www` (Caddy `deploy/Caddyfile` + `src/middleware.ts` fallback). Serving 200 on apex while HTML canonical points at `www` triggers GSC **“Alternate page with proper canonical tag”**.
- **HTTP → HTTPS** (308) and **trailing-slash normalization** (e.g. `/browse/` → `/browse`) may appear as **“Page with redirect”**; that is expected. Sitemap URLs use `siteUrl` only (https + www, no trailing slash on `/browse`).

## Tag browse hubs

- **`/browse?tag={slug}`** — filter catalog by a browse-safe tag (same filter as the browse dropdown).
- Page 1 renders SSR intro copy from `browseTagHubIntro()` (`src/lib/browse-tag-intro.ts`) and sets `title` / `description` / canonical in `generateMetadata` when the URL is tag-only.

## Caching (ISR)

Public catalog routes (`/`, `/browse`, `/game/[slug]`, `sitemap.xml`) export a shared `revalidate` interval from `src/lib/catalog-revalidate.ts` (default **3600s**). Cookie reads for the age gate and blur preference keep HTML dynamic per visitor; ISR mainly benefits the sitemap and cached catalog fetches without weakening the gate.
