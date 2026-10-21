# SEO improvement plan

Tracking prioritized SEO work for NSFW Droid. P0 items target crawl hygiene, share previews, and structured data before broader content hubs.

## P0

| # | Item | Status | Branch / notes |
| --- | --- | --- | --- |
| 1 | `robots.ts` disallow + noindex utility routes | Done | `cursor/seo-robots-pagination-4fae` |
| 2 | Browse catalog pagination metadata (`rel` prev/next, canonical) | Done | `cursor/seo-robots-pagination-4fae` |
| 3 | Default Open Graph / Twitter image in root `layout.tsx` | Done | `cursor/seo-default-og-4fae` — `public/og-default.png`, `defaultOgImagePath` in `src/lib/site.ts` |
| 4 | Hub / tag browse metadata + OG | Planned | `cursor/seo-hubs-og-4fae` |
| 5 | Sitemap + cache headers for tags | Planned | `cursor/seo-cache-sitemap-tags-4fae` |
| 6 | JSON-LD richness + cover `alt` on game pages | Planned | `cursor/seo-jsonld-alt-4fae`, `cursor/seo-cover-alt-4fae` |

## P1

- Per-game pages: already ship title, description, canonical, OG/Twitter when `cover_image_url` is set (`docs/seo-game-pages.md`).
- Validate share previews in Facebook Sharing Debugger and Twitter Card Validator after deploy.

## Verification

- Root metadata: `openGraph.images` and `twitter.images` resolve to absolute `https://www.nsfwdroid.com/og-default.png` via `metadataBase`.
- Asset: `public/og-default.png` (1200×630).
