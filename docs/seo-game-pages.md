# Per-game SEO detail pages

**Shipped:** October 2026

## Routes

- **`/game/[slug]`** — public detail page for each published listing (`link_status = ok`, `catalog_stale = false`).
- Unknown or unpublished slugs return **404**.

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

## Age gate & blur

Same pattern as home/browse: `AgeGate` until `age_verified` cookie; covers blurred when unverified or when `blur_covers=1` (opt-in in Settings).

## Outbound & analytics

- Primary CTA: **`/api/go/[listingId]`** (affiliate-aware redirect).
- **`listing_view`** posted to `/api/analytics/view` on detail load (anonymous, per `docs/engagement-policy.md`).
- `GameCard` / hero link to the detail page; card **Play** chip and detail CTA use `/api/go/`.

## Sitemap & robots

- `app/sitemap.ts` — static site URLs plus all published `/game/...` entries (`lastModified` from `listing.updated_at`).
- `app/robots.ts` — allows `/` and `/game/`; disallows `/admin/`, `/api/`, `/account/`, auth/settings/newsletter/underage utility paths.

