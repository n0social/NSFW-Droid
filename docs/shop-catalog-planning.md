# Shop catalog storefront — planning spec

**Date:** 30 October 2026  
**Status:** Planning only — **no storefront build** until owner sign-off on this doc **and** explicit [Phase B kickoff](shop-phase-b-stripe-pod.md). C0–C2 catalog UI is **blocked** until sign-off. Checkout/API is **Phase B only** (Stripe + POD). No DB migration in this pass.  
**Audience:** Owner / product / implementers  

**Related:** [shop-storefront-blueprint.md](shop-storefront-blueprint.md) (what exists today), [shop-design-concepts.md](shop-design-concepts.md) (checkout ops + launch SKUs), [shop-phase-b-stripe-pod.md](shop-phase-b-stripe-pod.md) (**locked** Stripe + POD epic), [shop-layout-mockups.md](shop-layout-mockups.md) (dev preview).  
**Checkout / webhooks / POD API:** stay in design concepts — this doc covers **browse, collections, rails, cards, PDP fields** only.

---

## Vision and principles

### What we are building

A **standard merch catalog storefront** on the NSFW Droid brand surface: collections, horizontal rails, responsive product grid, and type-specific PDPs. It is **not** the game catalog (no rank badges, no Nutaku-style hero carousel). Vesper hosts; art stays **PG on public mocks** unless a future age-gated collection is explicitly approved with processors.

### What we are not building in the catalog phase

- Cart persistence, checkout, webhooks, order DB (**Phase B** — Stripe + POD API; Phase A Shopify is optional alternate — see [shop-phase-b-stripe-pod.md](shop-phase-b-stripe-pod.md))
- Inventory counts or warehouse logic (virtual SKUs via POD + digital files)
- Game keys or hosted builds

### Design principles

| Principle | Detail |
| --- | --- |
| **Catalog-native chrome** | Same header/footer tokens as `www` (`#14061C`, `#241033`, `#22FF88`). Shop nav pill; optional launch **New** on nav only (not on every card). |
| **Chibi = marketing standee, not rank** | MapleStory-style **banner-v2** chibis are **optional card overlays** — not game `#1–#10` badges and **not on every SKU**. |
| **Clean image by default** | Most cards show **product art only**. A standee appears **only** when the badge resolver returns a key (sale, new, clearance, etc.). |
| **Right-side standee** | When shown, anchor **bottom-right** of the image box (~**30–40%** width); product photo stays primary **left/center**. |
| **One primary standee per card** | Priority stack when multiple tags overlap (see [Chibi badge system](#chibi-badge-system)). |
| **Fulfillment truth on PDP** | Physical → shipping block; digital → instant download copy; bundles → split fulfillment note. |
| **Preview honesty** | Current `/shop` is **noindex preview** with mock data in `src/lib/shop/home-products.ts` — not production commerce until sign-off + backend epic. |

---

## Chibi badge system

### When a standee appears (card grid / rails)

| Rule | Detail |
| --- | --- |
| **Default** | **No chibi** — product thumbnail fills the image area (fulfillment pills may still show top-left). |
| **Tagged SKUs only** | Standee renders when [badge resolution](#badge-resolution-pseudo) yields a non-null key: on sale, new, clearance, limited, or owner-forced badge — **not** because the SKU lives in a “New arrivals” rail (rail membership ≠ badge; only SKUs that pass the `new` rule get the standee). |
| **Placement** | **One** standee, **right-aligned** on the image (see [Visual spec](#visual-spec--chibi-standee-on-product-card)). |
| **Excluded** | **Best seller** never gets a chibi (text pill only). Plain catalog SKUs with no promo tags stay clean. |

### Asset inventory (banner-v2 set)

All live under `public/shop/` (see [Approved merch art map](shop-storefront-blueprint.md#approved-merch-art-map)). Keys in code: `src/lib/shop/assets.ts`.

| Badge key | Banner text on art | File basename |
| --- | --- | --- |
| `sale` | **SALE** (static on JPG) | `nsfw-droid-shop-vesper-chibi-sale-big-bust-v1-banner-v2.jpg` |
| `percent_off` | **-30%** sample on JPG *(reference pose)* | `nsfw-droid-shop-vesper-chibi-sale-big-bust-v2-banner-v2.jpg` |
| `deal` | **DEAL** (static on JPG) | `nsfw-droid-shop-vesper-chibi-deal-big-bust-banner-v2.jpg` |
| `clearance` | **CLEARANCE** (static on JPG) | `nsfw-droid-shop-vesper-chibi-clearance-big-bust-banner-v2.jpg` |
| `new` | **NEW** (static on JPG) | `nsfw-droid-shop-vesper-chibi-new-item-big-bust-banner-v2.jpg` |
| `limited` | **LIMITED** (static on JPG) | `nsfw-droid-shop-vesper-chibi-limited-big-bust-banner-v2.jpg` |

**Art rules:** Black panel + purple `#C026D3` border, white type — **no green/red** sale banners on chips (storefront-wide).

The **v2 percent chibi** is a **pose + flag prop** reference. On **product cards**, the numeric discount must **not** assume every sale is 30% — see [On-sale standee + dynamic discount flag](#on-sale-standee--dynamic-discount-flag).

### Static label vs dynamic discount (implementer map)

| Badge key | Label on card | Source |
| --- | --- | --- |
| `new` | **NEW** | Static text baked in chibi JPG |
| `clearance` | **CLEARANCE** | Static JPG |
| `limited` | **LIMITED** | Static JPG |
| `deal` | **DEAL** | Static JPG *(grid card only when `featured: true`; home **featured deal module** uses full DEAL art separately)* |
| `sale` | **SALE** | Static JPG *(generic sale, discount &lt; 15% or no % promo)* |
| `percent_off` | **`-{N}%`** | **Dynamic** — computed from `compareAtPrice` and `price` (see below); chibi body from v2 asset, **flag text overlaid or composited** |

### On-sale standee + dynamic discount flag

**Trigger:** `compareAtPrice` &gt; `price` and badge resolver selects `percent_off` (discount ≥ **15%**) or, for smaller discounts, `sale` with optional small **%-only** pill on PDP — standee uses **SALE** v1 JPG without a dynamic flag.

**Layout (on-sale / `percent_off`):**

1. **Chibi asset:** Prefer **`percent_off`** banner-v2 (chibi holds flag prop). Fallback: **`sale`** v1 if owner chooses single sale chibi for all discounts (see owner decision).
2. **Dynamic flag text:**  
   `N = round((compareAtPrice - price) / compareAtPrice * 100)` → display **`-{N}%`** (e.g. 12.4 → **-12%**; document rounding in resolver tests).
3. **Rendering (Phase C0 — pick one for MVP):**
   - **CSS overlay (recommended MVP):** Standee `Image` + absolutely positioned flag layer over the banner/flag region of the JPG (`font` matches white condensed type on black panel; purple border inherited from art). Hide or mask the baked **-30%** pixels in art via overlay rectangle if needed.
   - **Future art template:** Export chibi with **blank flag zone**; server or edge compositor draws `-{N}%` into the flag (same typography rules). Defer until post-launch if CSS overlay ships first.

**PDP:** Strikethrough `compareAtPrice` + current `price` remain on the price row; chibi on PDP optional — card behavior is canonical for standee rules.

### Owner decision — sale chibi strategy *(sign-off before C0)*

| Option | Cards | Pros / cons |
| --- | --- | --- |
| **A — Dynamic flag (recommended)** | One **percent_off** chibi pose for all ≥15% sales; **`-{N}%`** always computed. **SALE** v1 for &lt;15% or non-% promos. | Accurate promos; one pose to maintain. Requires overlay/compositing spec above. |
| **B — Static JPG only** | Map each SKU to nearest pre-rendered **-30%** (or other) art. | Simple `<img>` only; **wrong %** when discount ≠ 30%. |
| **C — Hybrid** | Static labels (NEW, CLEARANCE, LIMITED, DEAL) from JPG; **only** percent sales use Option A dynamic flag. | Matches current asset set; owner must confirm Option A for percent path. |

**Owner decision (30 Oct 2026 — locked):** **Option C** (static marketing labels on art; dynamic flag for **`percent_off`** only). Override only by explicit owner note in sign-off.

### Semantic mapping (data → chibi)

| Storefront meaning | Badge key | When it applies |
| --- | --- | --- |
| **Featured item** (curated hero / featured deal module) | `deal` | Owner flag `featured: true` **or** SKU in `featuredDealSlug`; max one hero module on home. Grid card standee **only** if that SKU is featured — not every discounted item. |
| **New arrivals** | `new` | `publishedAt` within **45 days** **or** manual `badge: "new"` until date. |
| **Clearance / outlet** | `clearance` | `collection: clearance` **or** `compareAtPrice` with `clearance: true` (sunset SKUs). |
| **Percent-off promo** | `percent_off` | `compareAtPrice` set and discount ≥ **15%**; card shows chibi + **dynamic `-{N}%`** flag (not fixed -30% art text). |
| **Generic on sale** | `sale` | Any `compareAtPrice` with discount **&lt; 15%** **or** sitewide sale flag without a computed % on the card. |
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

Evaluate in order; **first match wins** for the **single standee** slot. If no row matches, **no standee** (clean image).

1. `clearance`  
2. `limited`  
3. `percent_off` *(chibi + dynamic `-{N}%` flag)*  
4. `sale` *(SALE static banner on art)*  
5. `new`  
6. `deal` *(grid card only when `featured: true` — not a substitute for `sale` / `percent_off`)*  

**Secondary pills** (non-chibi, **top-left** stack — do not compete with right standee):

- Fulfillment: `Instant download` · `Ships worldwide` · `Bundle`  
- `Best seller` (text only)  
- Compare-at strikethrough lives on **PDP price row**, not on chibi art  

**Featured deal module (home):** Always uses full-width **DEAL** chibi art (`ShopFeaturedDeal`) — separate from grid card standees.

---

## Visual spec — chibi standee on product card

### Placement

**Principle:** Product photography stays the hero **left/center**; the standee is a **right-edge marketing prop** (feet/base anchored bottom-right), not a centered overlay on the whole card.

```text
┌─────────────────────────────┐
│ [pill: Ships worldwide]     │  ← fulfillment pill, z-index 2, top-left
│                             │
│   [ product mock 1:1        │  primary art — left / center
│     primary left/center ]   │
│                      ┌──────┤
│                      │CHIBI │  ← standee: right-aligned, bottom-right
│                      │-22% │  ← dynamic flag text when percent_off
│                      └──────┘
└─────────────────────────────┘
     (no chibi on untagged SKUs — image area is full-bleed product only)
```

| Property | Desktop | Mobile (≤640px) |
| --- | --- | --- |
| **Anchor** | `absolute`; `right: 0`; `bottom: 0` | Same |
| **Width** | **32–38%** of card image box width (~**30–40%** target) | **34–40%** (slightly wider for legibility) |
| **Height** | `auto`; `aspect-ratio` from chibi JPG (~portrait bust + banner/flag) | Same |
| **Object fit** | `contain`; align standee to **right** edge; transparent padding OK | Same |
| **Dynamic flag** | When `percent_off`, flag layer sits on chibi flag/banner zone; `pointer-events: none` | Same |
| **Z-index** | Standee stack **3**; product image **0**; fulfillment pill **2**; card border hover **unchanged** |
| **Overflow** | Card image `overflow: hidden`; standee may **bleed 4px** below crop for “shelf” effect — optional polish |
| **Pointer** | `pointer-events: none` on standee + flag overlay (click goes to PDP) | Same |

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
| `badge` | Resolved key: `sale` \| `percent_off` \| `deal` \| `clearance` \| `new` \| `limited` \| **null** (no standee). UI maps key → chibi asset; `percent_off` also drives **dynamic `-{N}%`** flag from prices. |
| `badgeOverride` | Owner force badge (ignores auto rules except clearance priority) |
| `bestSellerRank` | Integer for rails; null = not in best sellers |
| `podSkuMap` | Provider variant IDs per option combo |
| `digitalAssetKey` | Spaces object key for ZIP/PDF |
| `bundleLines` | Array of `{ productSlug, variantId, qty }` for `bundle_mixed` |

### Badge resolution (pseudo)

```text
if clearance → clearance
else if limitedDrop → limited
else if compareAtPrice && discount >= 15% → percent_off  // card: right standee + dynamic "-{N}%"
else if compareAtPrice → sale
else if within 45d publishedAt → new
else if featured → deal
else → null  // no chibi; clean product image
bestSellerRank → text pill only (never a standee)
N = round((compareAtPrice - price) / compareAtPrice * 100) when percent_off
```

---

## Phased build checklist (after plan sign-off)

**Gate:** Owner sign-off on this document unlocks **C0–C2** only. **Phase B** (Stripe + POD) starts only after separate [Phase B kickoff](shop-phase-b-stripe-pod.md).

**Preview on branch:** `/shop` is **noindex preview** with mock data — useful for art/layout regression. **Hold merges** of mock-only work ahead of sign-off unless owner wants pixel-check on `main`. Do **not** delete preview code without owner request; it is not production commerce.

### Phase C0 — Catalog data + badges (**blocked** until sign-off)

- [ ] Add `data/shop/catalog.json` (or TS) with full launch + expanded matrix rows  
- [ ] Extend `ShopProductCard` with **conditional** right-aligned standee + badge resolver + dynamic `%` flag for `percent_off`  
- [ ] Wire home rails (new, best sellers, digital, conditional clearance) from catalog  
- [ ] Map all six chibis in `assets.ts` → badge keys  
- [ ] Unit tests for badge priority + best seller pill vs NEW chibi  

### Phase C1 — Routes (**blocked** until C0)

- [ ] `/shop/collections/[slug]` grid + sort + filters  
- [ ] `/shop/products/[slug]` PDP templates per `productType`  
- [ ] Replace `home-products.ts` mock with catalog slice + keep `design` variant for `/design/shop`  

### Phase C2 — Polish (**blocked** until C1)

- [ ] Collection headers with chibi (clearance / new-arrivals)  
- [ ] Occult manga collection stub (hidden until art QA)  
- [ ] SEO: flip `/shop` index when owner ready; structured data `Product`  

### Phase A — Shopify subdomain *(optional alternate — not locked path)*

- [ ] Only if owner pivots before Phase B: `shop.nsfwdroid.com` + POD Shopify app; header **Shop** link-out  
- [ ] De-emphasized vs [Phase B epic](shop-phase-b-stripe-pod.md)

### Phase B — Commerce epic (**blocked** until kickoff; Stripe + POD locked)

Full checklist: **[shop-phase-b-stripe-pod.md](shop-phase-b-stripe-pod.md)** (B0–B5: order DB, Stripe Checkout, Printful webhooks, digital signed URLs, ops alerts).

Summary:

- [ ] Stripe Checkout Session (or Payment Element) + webhooks  
- [ ] **Required** POD REST API (default **Printful**): order create on paid, tracking email on ship webhook  
- [ ] Digital delivery tokens + bundle split fulfillment  
- [ ] Droplet env: `STRIPE_*`, `PRINTFUL_API_KEY`, `SHOP_DOWNLOAD_SIGNING_SECRET` — no keys in repo  

### Owner actions before C0 code

- [ ] Sign off catalog planning (incl. **Option C** chibi)  
- [ ] Confirm best seller launch list (manual slugs)  
- [ ] Confirm poster sizes and frame add-on for v1  
- [ ] Confirm Stripe + Printful (or alternate POD) approval for PG SKUs before Phase B go-live  

---

## Document history

| Date | Change |
| --- | --- |
| 2026-10-30 | Initial catalog planning spec (chibi system, matrix, IA, PDP, data sketch, phases) |
| 2026-10-30 | Chibi placement: tagged SKUs only, **right-aligned** standee; **dynamic `-{N}%`** flag for percent sales; owner decision on static vs composited sale art |
| 2026-10-30 | Phase B locked (Stripe + POD); C0–C2 blocked until sign-off; Phase A Shopify optional; link **shop-phase-b-stripe-pod.md** |
