# NSFW Droid Shop — Storefront blueprint

**Audience:** Owner / product  
**Date:** 30 October 2026  
**Status:** Design mock only — no live checkout, cart API, inventory, or `shop.nsfwdroid.com` DNS in production yet.

**Related docs:** `docs/shop-design-concepts.md` (IA, SKUs, automated checkout target), `docs/shop-layout-mockups.md` (dev preview + canvas link).

---

## URL and hosting

| Item | Detail |
| --- | --- |
| **Production target** | `https://shop.nsfwdroid.com` — subdomain of `nsfwdroid.com` (no separate domain). |
| **Catalog stays** | Game listings remain on `https://www.nsfwdroid.com`. Shop is a sibling surface, not a replacement catalog. |
| **Phase A (launch fast)** | **Shopify** (or similar) on `shop.nsfwdroid.com` + Printful/Printify app. Shopify owns cart, tax, payment, webhooks to POD. Header **Shop** can link out until Phase B ships. |
| **Phase B (brand-locked)** | **Headless** shop routes in the Next.js app on the same origin as catalog: `/shop`, `/cart`, `/checkout`, Stripe Checkout + POD REST API from payment webhooks. |
| **Today in repo** | Only **`/design/shop`** (noindex dev mock). No `/shop` app routes, no Caddy vhost for `shop.` documented as live. |
| **SFW subdomain note** | `sfw.nsfwdroid.com` is a **separate** PG catalog concept (`docs/sfw-subdomain-catalog.md`) — not the merch shop host. |

```mermaid
flowchart LR
  subgraph today [Today]
    WWW[www.nsfwdroid.com]
    DEV["/design/shop noindex mock"]
    WWW --> DEV
  end
  subgraph phaseA [Phase A target]
    SHOP[shop.nsfwdroid.com]
    SHOPIFY[Shopify + POD app]
    SHOP --> SHOPIFY
    WWW -->|Shop nav link| SHOP
  end
  subgraph phaseB [Phase B target]
    WWW2[www.nsfwdroid.com/shop]
    STRIPE[Stripe + POD API]
    WWW2 --> STRIPE
  end
```

---

## Page map

### Planned IA (from design concepts)

| Route | Purpose |
| --- | --- |
| `/shop` | Shop home — hero, collection chips, featured deal, product rails/grid |
| `/shop/collections/[slug]` | Merch · Digital · Bundles grid + sort |
| `/shop/products/[slug]` | PDP — gallery, variants, qty, add to cart |
| `/cart` | Slide-over drawer (desktop) + full cart page on mobile |
| `/checkout` | Contact → shipping (physical) → pay → confirm |
| `/order/[id]` | Receipt + support link |

**Nav (planned):** **Shop** between Browse and Submit (desktop pill); optional **New** badge at launch.

### What exists in the codebase today

| Route / artifact | Exists? | Notes |
| --- | --- | --- |
| `/design/shop` | **Yes** | `src/app/design/shop/page.tsx` → `ShopLayoutMockup.tsx`; `robots: noindex` |
| `/shop` and children | **No** | No `src/app/shop/**` |
| Cart / checkout API | **No** | No webhooks, order DB, or shop env vars wired |
| Interactive tabbed mock | **Yes (canvas)** | Shop home, Collection, PDP, Cart drawer — see [Layout mockups canvas](https://cursor.com/canvas/store-71d7e49f-a003-4074-be74-ec6a867c57da/a2d41d50-20f5-429f-8f4c-6865e00a9827) |
| Branch `cursor/shop-layout-mockups-da0e` | **Yes** | Adds mock page, docs, component (merge to `main` enables owner/dev pixel-check) |

### What is **not built** (design doc only — summarize)

From `docs/shop-design-concepts.md` **Automated shop + checkout**:

- Payment capture (Stripe / Shopify Pay / adult processors — not chosen in code)
- POD order creation (Printful/Printify/Gelato API or Shopify app)
- Webhook handlers (`payment_intent.succeeded`, `package_shipped`, etc.)
- Digital delivery (signed URLs, `/api/shop/download?token=…`, Spaces objects)
- Production secrets (`STRIPE_*`, `PRINTFUL_*`, `SHOPIFY_*`, `SHOP_DOWNLOAD_SIGNING_SECRET` in `/etc/nsfwdroid.env`)
- Order persistence, email receipts, dispute workflow
- Launch SKU photography in `data/shop/mock/` (six hero products are **design targets** only)
- Spec components as production code: `ShopProductCard`, `ShopHero`, `ProductGallery`, `VariantPicker`, `CartDrawer`, `CheckoutSteps`, `ShopChipRow`

Checkout is drawn as a **shell** only in wireframes and canvas tabs — not implemented in the app.

---

## Wireframes (aligned with mockup component + canvas)

### Shop home

Static app mock (`ShopLayoutMockup`) implements **home slice only**. Full home + other views match the canvas tabs.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ HEADER  [DroidMark] NSFWDroid    Browse   Shop(active)   Submit    Sign in   │
│         sticky · 3px primary border bottom · backdrop blur                    │
├──────────────────────────────────────────────────────────────────────────────┤
│ CALLOUT  "Design mockup — not wired to cart, checkout, or inventory."        │
├──────────────────────────────────────────────────────────────────────────────┤
│ HERO  aspect 16:9 · max-h 360px · surface card                               │
│  [dashed Vesper cutout]  Official NSFW Droid goods                           │
│                          Support the catalog — wear the droid.               │
│                          [Browse merch] [Digital packs]     tag: 16:9 banner │
├──────────────────────────────────────────────────────────────────────────────┤
│ CHIPS  (chip-scroll)  All | Merch | Digital | Bundles  — interactive in mock │
├──────────────────────────────────────────────────────────────────────────────┤
│ FEATURED DEAL  purple-bordered DEAL chibi placeholder + Supporter bundle $17   │
├──────────────────────────────────────────────────────────────────────────────┤
│ GRID PREVIEW  2×3 cards: sticker $12 · tee $28 · wallpaper $8 (STK/TEE/ZIP)  │
├──────────────────────────────────────────────────────────────────────────────┤
│ FOOTER NOTE  → collection, PDP, cart, checkout in canvas + docs              │
└──────────────────────────────────────────────────────────────────────────────┘
```

Canvas home tab adds: **Featured drop** card copy, **product grid** (4 SKUs including bundle), **callout strip** (“Ships from US · 18+ brand · Digital sales final”).

### Collection

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ HEADER (same chrome)                                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│ Merch collection                          Sort: [ Featured ▼ ]               │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐                                                  │
│ │STK │ │TEE │ │ZIP │ │BND │  … responsive 4-col grid (canvas)               │
│ └────┘ └────┘ └────┘ └────┘                                                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Product detail (PDP)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Back to Shop                                                                │
├──────────────────────────────┬───────────────────────────────────────────────┤
│ [ Main 1:1 image ]           │ Vesper sticker pack — Vol. 1                  │
│ [ thumb ][ thumb ][ thumb ]  │ $12.00 USD                                    │
│                               │ Variant: [ Sheet A ] [ Sheet B ]              │
│                               │ Qty  [ − ] 1 [ + ]                            │
│                               │ [ Add to cart ]                               │
│                               │ Secure checkout · Terms · Privacy             │
└──────────────────────────────┴───────────────────────────────────────────────┘
```

### Cart drawer

```text
┌───────────────────────────────┬────────────────────────── 280–400px ────────┐
│ Shop page (dimmed 35%)        │ Cart                              [ Close ] │
│                               │ ┌──┐ Vesper sticker pack v1    Sheet A  $12 │
│                               │ └──┘  [−] 1 [+]                             │
│                               │ ┌──┐ Wallpaper pack           Digital  $8   │
│                               │ Subtotal                          $20.00   │
│                               │ Shipping calculated at checkout            │
│                               │ [ Checkout ]                               │
└───────────────────────────────┴─────────────────────────────────────────────┘
```

Design spec (concepts doc): desktop drawer **~400px**, surface `#241033`, **2px** left border primary; mobile → full-height sheet. Empty state: Vesper pose + friendly copy (not in static mock yet).

---

## Component inventory

| Component / region | Mock implementation | Production spec (future) |
| --- | --- | --- |
| **Header chrome** | Sticky header: `DroidMark`, wordmark, Browse / **Shop** / Submit pills, Sign in chip | Match catalog header; add Shop link + optional New badge |
| **Hero 16:9** | `aspect-[16/9]`, max-h 360px, dual CTAs (non-links in mock) | `ShopHero` + `nsfw-droid-logo-banner-16x9.jpg` + Vesper cutout |
| **Filter chips** | `SHOP_CHIPS`: All, Merch, Digital, Bundles; `chip-scroll`, 44px min height | `ShopChipRow` — mirror home `ChipRow` behavior |
| **Featured DEAL rail** | Grid card: purple `#C026D3` border, DEAL/chibi placeholder, Supporter bundle $17 | Wire to `vesper-chibi-deal-big-bust-banner-v2.jpg` |
| **Product grid** | Inline `ProductCard`: 1:1 thumb, pill, title, green price, hover scale 1.02 | `ShopProductCard` — catalog card grammar, no rank badges |
| **Collection sort** | Canvas only: “Sort: Featured” button | Server/collection query when Phase B |
| **PDP gallery** | Canvas: main + 3 thumbs, variant pills, qty, trust row | `ProductGallery`, `VariantPicker` |
| **Cart drawer** | Canvas: 2 line items, subtotal, shipping note, Checkout | `CartDrawer` + `CartLineItem`; mixed physical/digital lines per concepts doc |

**Placeholder products in mock (copy + prices):**

| Title | Price | Pill |
| --- | --- | --- |
| Vesper sticker pack v1 | $12.00 USD | Ships worldwide |
| NSFW Droid wordmark tee | $28.00 USD | Merch |
| Vesper 4K wallpaper pack | $8.00 USD | Instant download |
| Supporter bundle | $17.00 USD | Bundle −15% (featured deal) |

---

## Content: placeholders vs real assets

### Still placeholder in UI mocks

- Hero **Vesper cutout** — dashed box in `/design/shop`; production should use mascot cutouts under `public/mascot/vesper/` (e.g. wave / storefront pose).
- Product thumbs — **STK / TEE / ZIP** text blocks, not product photography.
- DEAL chip — text “DEAL / chibi” with inline filename hint in mock copy.

### Real assets (Cloud Agent artifacts — not committed to repo)

Canonical index: **`/opt/cursor/artifacts/shop-design-batch-index.md`**.

| Use in storefront | Primary file (under `artifacts/assets/`) |
| --- | --- |
| Shop hero / OG wide | `nsfw-droid-logo-banner-16x9.jpg` |
| Featured deal rail / hero chip | `nsfw-droid-shop-vesper-chibi-deal-big-bust-banner-v2.jpg` |
| Sale row overlay | `nsfw-droid-shop-vesper-chibi-sale-big-bust-v1-banner-v2.jpg` |
| PDP / strikethrough promo | `nsfw-droid-shop-vesper-chibi-sale-big-bust-v2-banner-v2.jpg` |
| NEW / LIMITED / CLEARANCE rails | `*-new-item-*-banner-v2.jpg`, `*-limited-*-banner-v2.jpg`, `*-clearance-*-banner-v2.jpg` |
| Pin-up / tee / sticker PDP art | e.g. `vesper-pink-hoodie-chin-hands-v3.jpg`, pin-up v2 series, Andri sticker sheet |
| Manga occult limited SKU (print) | `nsfwdroid-shop-vesper-manga-pale-hands-gold-pyramid-v5.jpg` (**primary**); v4/v6 paths superseded for print per index |

**Promo art rules:** MapleStory chibi **banner-v2** set uses **black panel + purple `#C026D3` border**, white type — **no green/red sale banners** on storefront chips (see index “Standard marketing chibi set”).

**Future repo path (planned):** raster mocks at `data/shop/mock/` when art is ingested for build — not populated today.

---

## Theme tokens and `/design/shop`

Production CSS variables (`src/app/globals.css`):

| Token | Value | Role |
| --- | --- | --- |
| `--background` | `#14061C` | Page background |
| `--foreground` | `#FFF1F7` | Primary text |
| `--theme-surface` | `#241033` | Cards, header chips, drawer surface |
| `--theme-primary` | `#22FF88` | Prices, active chips, primary CTAs |
| `--theme-accent` | `#39FF14` | Wordmark accent, Sign in, focus direction |
| `--theme-text-muted` | `#86EFAC` | Secondary copy, nav idle |
| `--theme-border` | `#22FF8840` | Card borders |
| `--theme-border-strong` | `#39FF14` | Strong borders (PDP spec) |

**`/design/shop` shows:**

- Full-page mock with catalog-aligned chrome (not embedded in main site layout wrapper — standalone min-h-screen).
- Banner: **“Design mockup — not wired”** (matches docs).
- **Shop home only** on the page; footer pointer to canvas for Collection, PDP, cart, checkout shells.
- SEO: title `Shop layout mockup (dev)`, **noindex/nofollow**.

**Verify locally:** `npm run dev` → `http://localhost:3000/design/shop`.

Interactive canvas uses **`useHostTheme()`** (same green accent direction, flat chrome — no Nutaku-style game carousel).

---

## Gap list: merge vs full storefront

### Merging `cursor/shop-layout-mockups-da0e` → `main` **enables**

- Owner/dev **pixel-check** route `/design/shop` (noindex).
- Documented links in `docs/shop-layout-mockups.md` (host, canvas, dev preview).
- Reusable **`ShopLayoutMockup`** for home layout regression (chips, hero, deal rail, grid).
- No production customer-facing shop URL or checkout.

### Full storefront build **still requires** (separate epics)

1. **Hosting choice** — Phase A DNS + Shopify theme **or** Phase B Next routes + Caddy/host rules for `/shop` or `shop.` subdomain.
2. **Commerce backend** — cart state, checkout session, webhooks, order DB, transactional email.
3. **Fulfillment** — POD app (Phase A) or API integration (Phase B); digital token delivery.
4. **Production components** — split mock into real routes and the seven spec’d components; wire header **Shop** link.
5. **Assets in app** — copy or CDN-link approved JPGs from artifacts into `public/` or `data/shop/mock/`; replace STK/TEE/ZIP placeholders.
6. **Ops** — secrets on droplet, monitoring for failed webhooks (`ALERT_EMAIL_TO`), processor/POD content approval for PG launch SKUs.
7. **Legal / policy** — checkout age note, terms/privacy links on PDP trust row (routes exist on catalog today).

---

## Quick links

| Resource | URL / path |
| --- | --- |
| Dev mock | `/design/shop` |
| Layout mockups canvas | https://cursor.com/canvas/store-71d7e49f-a003-4074-be74-ec6a867c57da/a2d41d50-20f5-429f-8f4c-6865e00a9827 |
| Design concepts + checkout ops | `docs/shop-design-concepts.md` |
| Layout mockups doc | `docs/shop-layout-mockups.md` |
| Art batch index | `/opt/cursor/artifacts/shop-design-batch-index.md` |

---

*Blueprint generated from branch `cursor/shop-layout-mockups-da0e` and docs as of 30 Oct 2026.*
