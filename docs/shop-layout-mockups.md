# Shop layout mockups

**Date:** 30 October 2026  
**Status:** design preview only — no `/shop` routes, cart API, or payment integration.

## Production host

**Target URL:** `https://shop.nsfwdroid.com` — subdomain of `nsfwdroid.com` (no separate domain). Phase A in [shop-design-concepts.md](shop-design-concepts.md): typically Shopify + POD; catalog stays on `www.nsfwdroid.com`.

## Interactive canvas

Tabbed layout mockups (**Shop home**, **Collection**, **PDP**, **Cart drawer**):

- [NSFW Droid Shop — Layout mockups](https://cursor.com/canvas/store-71d7e49f-a003-4074-be74-ec6a867c57da/a2d41d50-20f5-429f-8f4c-6865e00a9827)

Tabs / sections in the canvas:

| View | Contents |
| --- | --- |
| **Shop home** | 16:9 hero band (logo banner ref), chip row (All / Merch / Digital / Bundles), featured row with **DEAL** chibi placeholder, product grid (sticker, tee, digital pack) |
| **Collection** | Responsive grid + sort control |
| **PDP** | Gallery + thumbs, variant pills, qty, Add to cart, trust row |
| **Cart drawer** | Line items, subtotal, shipping note, Checkout CTA |

Styling uses `useHostTheme()` tokens only (flat shop chrome aligned with catalog `#14061C` / green accent direction in [shop-design-concepts.md](shop-design-concepts.md)).

## Static dev preview (app)

Pixel-check against production header tokens:

- **Route:** [`/design/shop`](/design/shop) — `src/app/design/shop/page.tsx` + `src/components/design/ShopLayoutMockup.tsx`
- **SEO:** `robots: noindex` in page metadata
- **Note on page:** “Design mockup — not wired”

Run locally: `npm run dev` → visit `/design/shop`.

## Ops / checkout (not implemented)

Automated fulfillment, webhooks, and env vars are specified in [shop-design-concepts.md — Automated shop + checkout](shop-design-concepts.md#automated-shop--checkout-ops-architecture). These mockups do not implement that stack.

## Marketing art references

Owner-approved filenames (see [shop-storefront-blueprint.md — Approved merch art map](shop-storefront-blueprint.md#approved-merch-art-map)). Artifact copies: `/opt/cursor/artifacts/assets/` · index: `/opt/cursor/artifacts/shop-design-batch-index.md`.

| Placement in mock / canvas | Chosen primary file |
| --- | --- |
| Hero 16:9 band | `nsfw-droid-logo-banner-16x9.jpg` |
| Hero Vesper companion (panda hoodie) | `nsfw-droid-shop-vesper-panda-hoodie-solo-no-text-v2.jpg` |
| Featured DEAL rail | `nsfw-droid-shop-vesper-chibi-deal-big-bust-banner-v2.jpg` |
| Sale overlays | `nsfw-droid-shop-vesper-chibi-sale-big-bust-v1-banner-v2.jpg`, `…-v2-banner-v2.jpg` (**-30%**) |
| NEW / LIMITED / CLEARANCE rails | `nsfw-droid-shop-vesper-chibi-new-item-big-bust-banner-v2.jpg`, `…-limited-…-banner-v2.jpg`, `…-clearance-…-banner-v2.jpg` |
| Duo sticker / bundle hero | `nsfw-droid-shop-vesper-panda-andri-peace-sticker-v2.jpg` |
| Wordmark tee / logo SKUs | `nsfw-droid-logo-purple-gradient.jpg`, `nsfw-droid-shop-wordmark-green.jpg`, section H set in blueprint |

Full spec: [shop-design-concepts.md](shop-design-concepts.md) (IA, cards, cart drawer, launch SKUs).
