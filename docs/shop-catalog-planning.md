# Shop catalog storefront — planning spec

**Date:** 30 October 2026  
**Status:** Planning only — sign-off before Phase B catalog build. No DB migration, no new routes in this pass.  
**Audience:** Owner / product / implementers  

**Related:** [shop-storefront-blueprint.md](shop-storefront-blueprint.md) (what exists today), [shop-design-concepts.md](shop-design-concepts.md) (checkout ops + launch SKUs), [shop-layout-mockups.md](shop-layout-mockups.md) (dev preview).  
**Checkout / webhooks / POD API:** stay in design concepts — this doc covers **browse, collections, rails, cards, PDP fields** only.

---

## Vision and principles

### What we are building

A **standard merch catalog storefront** on the NSFW Droid brand surface: collections, horizontal rails, responsive product grid, and type-specific PDPs. It is **not** the game catalog (no rank badges, no Nutaku-style hero carousel). Vesper hosts; art stays **PG on public mocks** unless a future age-gated collection is explicitly approved with processors.

### What we are not building in the catalog phase

- Cart persistence, checkout, webhooks, order DB (Phase A Shopify or Phase B Stripe — see [Automated shop + checkout](shop-design-concepts.md#automated-shop--checkout-ops-architecture))
- Inventory counts or warehouse logic (virtual SKUs via POD + digital files)
- Game keys or hosted builds

### Design principles

| Principle | Detail |
| --- | --- |
| **Catalog-native chrome** | Same header/footer tokens as `www` (`#14061C`, `#241033`, `#22FF88`). Shop nav pill; optional launch **New** on nav only (not on every card). |
| **Chibi = marketing standee, not rank** | MapleStory-style **banner-v2** chibis sit **in front of** the product image on cards/rails — not game `#1–#10` badges. |
| **One primary standee per card** | Priority stack when tags overlap (see [Chibi badge system](#chibi-badge-system)). |
| **Fulfillment truth on PDP** | Physical → shipping block; digital → instant download copy; bundles → split fulfillment note. |
| **Preview honesty** | Current `/shop` is **noindex preview** with mock data in `src/lib/shop/home-products.ts` — not production commerce until sign-off + backend epic. |

---

## Chibi badge system

### Asset inventory (banner-v2 set)

All live under `public/shop/` (see [Approved merch art map](shop-storefront-blueprint.md#approved-merch-art-map)). Keys in code: `src/lib/shop/assets.ts`.

| Badge key | Banner text on art | File basename |
| --- | --- | --- |
| `sale` | **SALE** | `nsfw-droid-shop-vesper-chibi-sale-big-bust-v1-banner-v2.jpg` |
| `percent_off` | **-30%** (or strikethrough promos) | `nsfw-droid-shop-vesper-chibi-sale-big-bust-v2-banner-v2.jpg` |
| `deal` | **DEAL** | `nsfw-droid-shop-vesper-chibi-deal-big-bust-banner-v2.jpg` |
| `clearance` | **CLEARANCE** | `nsfw-droid-shop-vesper-chibi-clearance-big-bust-banner-v2.jpg` |
| `new` | **NEW** | `nsfw-droid-shop-vesper-chibi-new-item-big-bust-banner-v2.jpg` |
| `limited` | **LIMITED** | `nsfw-droid-shop-vesper-chibi-limited-big-bust-banner-v2.jpg` |

**Art rules:** Black panel + purple `#C026D3` border, white type — **no green/red** sale banners on chips (storefront-wide).

### Semantic mapping (data → chibi)

| Storefront meaning | Badge key | When it applies |
| --- | --- | --- |
| **Featured item** (curated hero / featured deal module) | `deal` | Owner flag `featured: true` **or** SKU in `featuredDealSlug`; max one hero module on home. |
| **New arrivals** | `new` | `publishedAt` within **45 days** **or** manual `badge: "new"` until date. |
| **Clearance / outlet** | `clearance` | `collection: clearance` **or** `compareAtPrice` with `clearance: true` (sunset SKUs). |
| **Percent-off promo** | `percent_off` | `compareAtPrice` set and discount ≥ **15%** (show strikethrough on PDP). |
| **Generic on sale** | `sale` | Any `compareAtPrice` &lt; **15%** discount **or** sitewide sale flag without specific %. |
| **Limited drop** | `limited` | Manual `limitedDrop: true` **or** occult/future scarcity line; optional max qty in copy only (no live inventory). |
| **Best seller** | *(no 7th chibi)* | See [Best seller rules](#best-seller-rules) — **text pill only** on card; rail uses typography header. |

**Optional collection header gag (not per-card):** `assets/nsfw-droid-shop-duo-sale-paddle.jpg` beside DEAL chibi on sale collection hero only — not a badge key.

### Best seller rules

**Goal:** Surface proven SKUs without inventing a seventh chibi asset.

| Phase | Rule |
| --- | --- |
| **Launch (no order history)** | Owner-maintained ordered list `bestSellerSlugs[]` (3–8 SKUs), refreshed manually ≤ monthly. |
| **Post-checkout (Phase B+)** | Auto-rank by **units sold rolling 30 days**; tie-break by revenue; cap rail at **8** products; exclude clearance-only SKUs unless also in top revenue. |

**Card treatment for best sellers:**

- **Primary:** uppercase pill **`Best seller`** — top-left of image, `rounded-full`, `border-[var(--theme-primary)]/40`, **no chibi** (avoids clashing with NEW/SALE).
- **If SKU is also `new`:** show **NEW chibi standee** only; keep **Best seller** as secondary text pill **below** title or as muted sub-pill (never two standees).
- **Do not** reuse **LIMITED** or **DEAL** for best sellers — those mean scarcity and curated promo, not velocity.

**Rail header:** `Best sellers` + optional subcopy; **no** chibi standee on the section title (chibis reserved for card overlays and the single featured-deal module).

### Priority stack (multiple badges)

Evaluate in order; **first match wins** for the **standee** slot:

1. `clearance`  
2. `limited`  
3. `percent_off`  
4. `sale`  
5. `new`  
6. `deal` *(only if `featured: true` on card — not every DEAL-tagged sale)*  

**Secondary pills** (non-chibi, top-left stack below standee or right side on desktop):

- Fulfillment: `Instant download` · `Ships worldwide` · `Bundle`  
- `Best seller` (text only)  
- Compare-at strikethrough lives on **PDP price row**, not on chibi art  

**Featured deal module (home):** Always uses full-width **DEAL** chibi art (`ShopFeaturedDeal`) — separate from grid card standees.

---

## Visual spec — chibi standee on product card

### Placement

```text
┌─────────────────────────────┐
│ [pill: Ships worldwide]     │  ← existing pill, z-index 2, top-left
│                             │
│     ┌──────┐                │
│     │CHIBI │  ← standee     │  bottom-left, in front of product art
│     │stand │                │
│     └──────┘                │
│         [ product mock 1:1 ]│
└─────────────────────────────┘
```

| Property | Desktop | Mobile (≤640px) |
| --- | --- | --- |
| **Anchor** | `absolute`; `left: 0`; `bottom: 0` | Same |
| **Width** | **38%** of card image box width | **42%** (slightly larger for legibility) |
| **Height** | `auto`; `aspect-ratio` from chibi JPG (~portrait bust + banner) | Same |
| **Object fit** | `contain`; transparent padding OK | Same |
| **Z-index** | Standee **3**; product image **0**; fulfillment pill **2**; card border hover **unchanged** |
| **Overflow** | Card image `overflow: hidden`; standee may **bleed 4px** below crop for “shelf” effect — optional polish |
| **Pointer** | `pointer-events: none` on standee (click goes to PDP) | Same |

### Rail / featured module

| Surface | Chibi usage |
| --- | --- |
| **Featured deal (1-up)** | Full DEAL banner image as card hero (current `ShopFeaturedDeal` pattern), purple border `#C026D3`. |
| **Horizontal rail** | Optional **section** background strip with CLEARANCE/NEW chibi **once** at rail start (16% width), not on every card in rail. |
| **Collection page header** | Matching badge chibi at **max 120px** height beside H1 for clearance / new-arrivals slugs only. |

### Accessibility

- Standee is decorative; `alt=""` on standee `Image`. Meaning duplicated in visible pill or `aria-label` on card link: e.g. *“Vesper sticker pack, new arrival, twelve dollars.”*

---

## Product type matrix

Rows = **SKU families** (sellable product types). Columns = variant / fulfillment dimensions. Aligns with [Launch SKU lineup](shop-design-concepts.md#launch-sku-lineup-design-targets) plus standard POD catalog expansion.

### Matrix

| SKU family | `productType` | Wear / format variants | Poster sizes | Frame add-on | Sticker / sheet | Digital delivery | Bundle composition | Fulfillment |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Sticker pack** | `sticker_pack` | — | — | — | Sheet A / Sheet B (variant) | — | Optional + wallpaper | **POD** |
| **Die-cut sticker** | `sticker_single` | — | — | — | Size S/M/L die-cut | — | Multi-sticker bundles | **POD** |
| **Enamel pin** | `pin` | — | — | — | — | — | Pin + sticker bundle | **POD** |
| **Wordmark / graphic tee** | `apparel_tee` | Fit: unisex; sizes XS–3XL; colors: black, heather charcoal | — | — | — | — | Tee + sticker | **POD** |
| **Hoodie** | `apparel_hoodie` | Unisex S–3XL; black, heather | — | — | — | — | Hoodie + digital | **POD** |
| **Long sleeve** *(phase 2)* | `apparel_longsleeve` | Same as tee | — | — | — | — | — | **POD** |
| **Poster** | `poster` | — | 12×16 in, 18×24 in, 24×36 in | — | — | — | — | **POD** |
| **Poster + frame** | `poster_framed` | — | Same poster sizes | Black / white frame (variant) | — | — | — | **POD** (poster + frame SKU or add-on line) |
| **Wallpaper pack** | `digital_wallpaper` | — | — | — | — | ZIP (PNG/WebP); 3+ poses | In supporter bundle | **Digital** |
| **Icon pack** | `digital_icons` | — | — | — | — | ZIP transparent PNG | Bundle | **Digital** |
| **PDF zine** *(future)* | `digital_pdf` | — | — | — | — | PDF | — | **Digital** |
| **Supporter bundle** | `bundle_mixed` | — | — | — | Includes sticker variant | Includes wallpaper SKU | Fixed SKU list, −15% vs à la carte | **POD + digital** split |
| **Occult manga line** *(planned)* | `apparel_tee` / `poster` / `sticker_single` | Same as base type | Same | Optional on poster | — | — | Limited collection | **POD** + `limited` badge |

### Apparel detail (tee types)

| Blank style | POD mapping | Launch? |
| --- | --- | --- |
| **Unisex jersey tee** (short sleeve) | Printful Bella+Canvas 3001 or equivalent | **Yes** — wordmark tee |
| **Unisex hoodie** | Gildan 18500 class | **Yes** — panda hoodie art family |
| **Unisex long sleeve** | Bella 3501 | Phase 2 |
| **Tank top** | Bella 3480 | Phase 2 |

### Poster sizes (US)

| Size key | Inches | Typical use |
| --- | --- | --- |
| `s` | 12 × 16 | Desk / small wall |
| `m` | 18 × 24 | Standard room |
| `l` | 24 × 36 | Statement / occult line |

Frame add-on: single variant dimension `frameColor: none | black | white` — when `none`, `productType` stays `poster`; when frame selected, line item maps to provider framed poster SKU.

### Launch SKU ↔ matrix (approved art)

| Launch name (concepts doc) | `productType` | Primary art (`public/shop/`) |
| --- | --- | --- |
| Vesper sticker pack v1 | `sticker_pack` | `nsfw-droid-shop-andri-sticker-sheet.jpg` |
| Andri enamel pin | `pin` | Andri bust / heart-eye ref from sheet |
| NSFW Droid wordmark tee | `apparel_tee` | Wordmark lockups + `panda-hoodie` for lifestyle mock |
| Vesper 4K wallpaper pack | `digital_wallpaper` | Placeholder ZIP until assets in Spaces |
| Icon pack | `digital_icons` | TBD export |
| Supporter bundle | `bundle_mixed` | Peace duo `…-peace-sticker-v2.jpg` + digital |
| Peace sticker (preview grid) | `sticker_single` | `…-peace-sticker-v2.jpg` |

---

## Page and rail information architecture

### Routes (unchanged from concepts)

```text
/shop                          Home
/shop/collections/[slug]       Grid + filters
/shop/products/[slug]          PDP
/cart                          Drawer + mobile page (later epic)
/checkout                      Later epic
```

### Home section order (top → bottom)

| # | Section | Content |
| --- | --- | --- |
| 1 | **Hero** | 16:9 logo banner + Vesper cutout (panda hoodie v2); dual CTA → merch collection / digital collection |
| 2 | **Chip row** | All · Merch · Digital · Bundles (client filter or link to collection slugs) |
| 3 | **Featured deal** | Single module: DEAL chibi + supporter bundle (or owner-picked SKU) |
| 4 | **Rail: New arrivals** | 4–8 cards, `new` badge rule; horizontal scroll |
| 5 | **Rail: Best sellers** | 4–8 cards, text pill only; horizontal scroll |
| 6 | **Rail: Featured merch** | Curated grid row (optional; owner picks — may use `deal` on one card only) |
| 7 | **Rail: Digital** | Square-leaning cards, `Instant download` pill |
| 8 | **Rail: Clearance** | Only if ≥1 clearance SKU; CLEARANCE chibi on rail header |
| 9 | **Trust callout** | Ships from US · 18+ brand · digital final sale → terms |
| 10 | **Footer** | Legal row (catalog footer) |

### Collection slugs

| Slug | Title | Default sort | Filter chips on page |
| --- | --- | --- | --- |
| `all` | All goods | Featured | Type: All, Wear, Stickers, Posters, Digital, Bundles |
| `merch` | Merch | Best sellers | Wear, Stickers, Pins, Posters |
| `digital` | Digital packs | Newest | Wallpapers, Icons, PDF |
| `bundles` | Bundles | Featured | Mixed only |
| `new-arrivals` | New arrivals | Newest | All types |
| `best-sellers` | Best sellers | Best seller rank | All types |
| `clearance` | Clearance | Price asc | All types |
| `limited` | Limited drops | Newest | Limited badge only |
| `occult-manga` *(future)* | Occult manga | Newest | Apparel, poster, sticker |

### Grid behavior

| Breakpoint | Columns |
| --- | --- |
| Mobile | 2 |
| Tablet | 3 |
| Desktop | 4 |

**Sort options (collection pages):** Featured · Newest · Price low–high · Price high–low · Best selling (hidden until order data exists).

### Filters (collection pages)

- **Product type** (from matrix)  
- **Price range** (buckets: under $15, $15–30, $30+)  
- **Fulfillment:** Ships · Instant download  
- **Badge** (optional facet): New · Sale · Clearance · Limited — not “Best seller” facet at launch  

---

## PDP template variants

Shared blocks: gallery, title, price (+ compare-at), qty, add to cart, trust row, description accordion, “You may also like” rail.

| `productType` | Gallery | Variant picker | Extra fields | Shipping / delivery block |
| --- | --- | --- | --- | --- |
| `sticker_pack` | 1:1 sheet + backing | Sheet A / Sheet B | Sticker count, matte vinyl | Ships 3–7 business days (US) |
| `sticker_single` | Die-cut mock | Size S/M/L if offered | — | Same |
| `pin` | Pin mock on card | — | Soft enamel, rubber clutch | Same |
| `apparel_tee` | Flat lay + model optional | **Size** XS–3XL; **Color** swatches | Garment brand/fit line | Size chart link; ships international |
| `apparel_hoodie` | Same | Size S–3XL; Color | — | Same |
| `poster` | 4:5 or size mock | **Size** s/m/l | Paper weight, border | Tube shipping note |
| `poster_framed` | Framed room mock | Size + **frame color** | Frame width | Heavier ship quote |
| `digital_wallpaper` | Gradient + pose thumbs | Resolution pack (4K default) | File list in accordion | Download after payment |
| `digital_icons` | Icon grid preview | — | PNG sizes | Instant download |
| `bundle_mixed` | Composite hero | Bundle fixed (no pick-a-size unless all components share) | “Includes:” list with links | Physical + email digital |

**Frame add-on pattern (poster PDP):** Toggle **Add frame** → switches variant set to `poster_framed` provider SKUs; price delta shown before add to cart.

---

## Data model sketch (JSON / TS — no DB migration)

Static catalog can live in `data/shop/catalog.json` or typed TS modules until Phase B orders need a DB. Extend preview shape in `src/lib/shop/home-products.ts`.

### Product record

```json
{
  "slug": "vesper-sticker-pack-v1",
  "title": "Vesper sticker pack — Vol. 1",
  "productType": "sticker_pack",
  "chip": "Merch",
  "collections": ["merch", "new-arrivals"],
  "featured": false,
  "featuredDeal": false,
  "limitedDrop": false,
  "clearance": false,
  "publishedAt": "2026-10-01T00:00:00Z",
  "badge": "new",
  "badgeOverride": null,
  "bestSellerRank": 2,
  "price": { "amount": 1200, "currency": "USD" },
  "compareAtPrice": null,
  "fulfillment": "pod",
  "podProvider": "printful",
  "podSkuMap": {
    "sheet-a": { "variantId": 0, "syncProductId": 0 },
    "sheet-b": { "variantId": 0, "syncProductId": 0 }
  },
  "images": [
    { "src": "/shop/nsfw-droid-shop-andri-sticker-sheet.jpg", "alt": "…" }
  ],
  "variants": [
    {
      "id": "sheet-a",
      "label": "Sheet A",
      "options": { "sheet": "A" },
      "podSku": "sheet-a"
    }
  ],
  "digitalAssetKey": null,
  "bundleLines": null
}
```

### Field notes

| Field | Purpose |
| --- | --- |
| `badge` | Resolved key: `sale` \| `percent_off` \| `deal` \| `clearance` \| `new` \| `limited` \| null — UI maps to chibi asset |
| `badgeOverride` | Owner force badge (ignores auto rules except clearance priority) |
| `bestSellerRank` | Integer for rails; null = not in best sellers |
| `podSkuMap` | Provider variant IDs per option combo |
| `digitalAssetKey` | Spaces object key for ZIP/PDF |
| `bundleLines` | Array of `{ productSlug, variantId, qty }` for `bundle_mixed` |

### Badge resolution (pseudo)

```text
if clearance → clearance
else if limitedDrop → limited
else if compareAtPrice && discount >= 15% → percent_off
else if compareAtPrice → sale
else if within 45d publishedAt → new
else if featured → deal
else → null
bestSellerRank → text pill only
```

---

## Phased build checklist (after plan sign-off)

**Reminder:** `/shop` today is **preview only** (`robots: noindex`); revert emphasis — do not treat as live storefront.

### Phase C0 — Catalog data + badges (no checkout)

- [ ] Add `data/shop/catalog.json` (or TS) with full launch + expanded matrix rows  
- [ ] Extend `ShopProductCard` with standee overlay + badge resolver  
- [ ] Wire home rails (new, best sellers, digital, conditional clearance) from catalog  
- [ ] Map all six chibis in `assets.ts` → badge keys  
- [ ] Unit tests for badge priority + best seller pill vs NEW chibi  

### Phase C1 — Routes

- [ ] `/shop/collections/[slug]` grid + sort + filters  
- [ ] `/shop/products/[slug]` PDP templates per `productType`  
- [ ] Replace `home-products.ts` mock with catalog slice + keep `design` variant for `/design/shop`  

### Phase C2 — Polish

- [ ] Collection headers with chibi (clearance / new-arrivals)  
- [ ] Occult manga collection stub (hidden until art QA)  
- [ ] SEO: flip `/shop` index when owner ready; structured data `Product`  

### Phase A or B — Commerce (separate epic)

- [ ] Phase A: Shopify collections mirror slugs; header link to `shop.nsfwdroid.com`  
- [ ] Phase B: cart, checkout, webhooks — [shop-design-concepts.md](shop-design-concepts.md)  
- [ ] Digital delivery tokens + bundle split fulfillment  

### Owner actions before C0 code

- [ ] Confirm best seller launch list (manual slugs)  
- [ ] Confirm poster sizes and frame add-on for v1  
- [ ] Confirm processor/POD approval for PG SKUs  

---

## Document history

| Date | Change |
| --- | --- |
| 2026-10-30 | Initial catalog planning spec (chibi system, matrix, IA, PDP, data sketch, phases) |
