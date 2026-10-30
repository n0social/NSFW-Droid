# Shop design concepts (pre-build)

**Date:** 30 October 2026  
**Status:** design only — no routes, checkout, or inventory in the app yet.  
**Goal:** Visual and UX direction so a future merch / digital shop feels like the same product as the game catalog.

**Live UI tokens:** `src/app/globals.css` — background `#14061C`, surface `#241033`, primary `#22FF88`, accent `#39FF14`, text `#FFF1F7`, muted `#86EFAC`.  
**Mascot:** Vesper hosts the shop (storefront outfit, PG on public previews). Andri / `DroidMark` can appear on tech merch only. See `docs/design-and-mascot.md` and `docs/mascots.md`.

---

## What the shop is (and is not)

| In scope (design) | Out of scope for v1 designs |
| --- | --- |
| Branded **merch** (stickers, pins, tees, hoodie) | Selling **game keys** or hosted builds (Phase 2 / license) |
| **Digital** supporter goods (wallpaper pack, icon pack, PDF zine) | Platform **wallet** or in-game currency |
| **Bundles** labeled clearly (e.g. sticker + wallpaper) | Dropshipping arbitrary third-party catalog |

Checkout is drawn as a **shell** (shipping + payment placeholders). Implementation later: Stripe is not adult-merch friendly for all SKUs — CCBill/Square/Printful+Stripe for print-on-demand are engineering decisions, not design blockers.

---

## Information architecture

```text
/shop                     Shop home (hero + collections + Vesper host)
/shop/collections/[slug]  Grid (merch | digital | bundles)
/shop/products/[slug]     PDP (gallery, variants, add to cart)
/cart                     Slide-over cart (global) + /cart page on mobile
/checkout                 Steps: contact → shipping (physical) → pay → confirm
/order/[id]               Receipt + support link (email uses Vesper bust mark)
```

**Nav:** Add **Shop** to header between Browse and Submit (desktop pill). Mobile: inside hamburger. Badge **New** optional for launch month only.

---

## Page 1 — Shop home

Same chrome as catalog: sticky header, footer legal row. Vesper **cutout** (`vesper-wave-cutout` or future “shop host” pose) in a **narrow hero band**, not full Nutaku-style game carousel.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ HEADER  [Andri] WORDMARK    New  Browse  Shop  Submit     [♥]  Sign in       │
├──────────────────────────────────────────────────────────────────────────────┤
│ SHOP HERO  (max-h ~280px mobile / ~360px desktop)                             │
│  ┌─────────────────────────────┐  "Official NSFW Droid goods"                 │
│  │ Vesper cutout (left/bottom) │  Short line: stickers, wallpapers, wear.    │
│  └─────────────────────────────┘  [ Browse merch ]  [ Digital packs ]        │
├──────────────────────────────────────────────────────────────────────────────┤
│ CHIPS  [ All ] [ Merch ] [ Digital ] [ Bundles ]                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ Featured drop (1 wide card + 2 small) — launch SKU e.g. "Vesper sticker pack" │
├──────────────────────────────────────────────────────────────────────────────┤
│ Rail: Best sellers          horizontal scroll, 3:4 product cards               │
├──────────────────────────────────────────────────────────────────────────────┤
│ Rail: Digital               square-ish cards, "Instant download" pill          │
├──────────────────────────────────────────────────────────────────────────────┤
│ Callout: Ships from US · 18+ brand · All sales final on digital (link terms)  │
├──────────────────────────────────────────────────────────────────────────────┤
│ FOOTER                                                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Copy tone:** Confident host, not hard sell. One line under hero: *“Support the catalog — wear the droid.”*

---

## Page 2 — Product card (grid)

Reuse catalog **card grammar** so Shop feels native:

| Element | Spec |
| --- | --- |
| Container | `rounded-2xl`, `border-2` `var(--theme-border-strong)` or `#22FF8840`, surface `#241033` |
| Image | 1:1 merch mock on `#14061C`; digital uses gradient + icon |
| Title | `font-bold` / 700, `#FFF1F7`, max 2 lines |
| Price | Primary green `#22FF88`, tabular nums |
| Pill | `Digital` · `Ships worldwide` · `Limited` — top-left on image, `rounded-full`, small caps |
| Hover | Scale 1.02 + border brightens (match `GameCard`) |

**No** rank badges (#1–#10) on shop cards — reserve for game rails only.

---

## Page 3 — Product detail (PDP)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Back to Shop                                                                │
├──────────────────────────────┬───────────────────────────────────────────────┤
│ IMAGE GALLERY (main + thumbs) │ Vesper sticker pack — Vol. 1                   │
│ 1:1 or 4:5                   │ $12.00 USD                                     │
│                               │ ★★★★☆ (optional later)                         │
│                               │ Variant: [ Sheet A ] [ Sheet B ]             │
│                               │ Qty  [ − ] 1 [ + ]                           │
│                               │ [ Add to cart ]  (primary, thick border)       │
│                               │                                                │
│                               │ Description accordion                          │
│                               │ • 5 vinyl stickers, matte                      │
│                               │ • Vesper storefront outfit art only            │
│                               │ Shipping 3–7 business days (US)              │
└──────────────────────────────┴───────────────────────────────────────────────┘
│ YOU MAY ALSO LIKE — horizontal rail (3–4 SKUs)                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Digital PDP:** Replace shipping block with *“Download link emailed after payment”* and show file format (ZIP, PNG).

**Trust row:** Lock icon + *“Secure checkout”* (placeholder), link to `/terms` and `/privacy`.

---

## Page 4 — Cart drawer

Desktop: **right drawer** 400px, surface `#241033`, 2px left border primary. Mobile: full-height sheet.

| Row | Thumb 64px, title, variant, qty stepper, line price |
| --- | --- |
| Footer | Subtotal, shipping *calculated at checkout*, **Checkout** CTA |
| Empty | Vesper small pose + *“Cart’s empty — Vesper kept the good stuff on the shelf.”* + link to shop |

---

## Page 5 — Checkout (wireframe)

Three steps with **progress dots** (not a heavy wizard):

1. **Email** (prefill if signed in later)  
2. **Shipping** (physical only; digital skips)  
3. **Pay** — hosted fields placeholder box  

Order summary **sticky** on desktop right column. Age note: *“By purchasing you confirm you are 18+.”* (align with age gate language.)

---

## Launch SKU lineup (design targets)

Design mockups and future photography should cover **six hero products**:

| SKU | Type | Visual direction |
| --- | --- | --- |
| Vesper sticker pack v1 | Physical | 5 stickers on card backing, `#14061C` backing, green foil logo strip |
| Andri enamel pin | Physical | Heart-eyed bust, green + violet enamel |
| NSFW Droid wordmark tee | Physical | Chest wordmark + small heart; black shirt |
| Vesper 4K wallpaper pack | Digital | 3 poses, storefront outfit, no explicit |
| Icon pack (PWA + avatar) | Digital | Andri + Vesper busts, transparent PNG |
| Supporter bundle | Bundle | Sticker pack + wallpaper ZIP, −15% vs separate |

Each SKU needs: **flat lay mock**, **PDP hero**, **thumbnail** for cards (export @2x).

---

## Vesper / Andri usage in shop art

| Surface | Character | Outfit |
| --- | --- | --- |
| Shop hero, empty cart | Vesper | Storefront / cutout |
| Sticker & wallpaper products | Vesper | Storefront only on public mocks |
| Pin / logo tee | Andri mark or wordmark | No full-body Vesper required |
| Post-gate only SKUs (future) | Vesper | Gated set — separate collection, age-gated collection page |

Do not use game cover art on merch without developer license.

---

## Components to spec before build (Figma or code)

1. `ShopProductCard` — extends card tokens from `GameCard`  
2. `ShopHero` — Vesper + dual CTA  
3. `ProductGallery` — main + thumb strip  
4. `VariantPicker` — pill buttons (size/color/sheet)  
5. `CartDrawer` + `CartLineItem`  
6. `CheckoutSteps` — shell only  
7. `ShopChipRow` — same behavior as home `ChipRow`  

**Responsive:** Single column PDP on mobile; cart drawer → full page.

---

## Accessibility & content

- Product images: meaningful `alt` (*“Vesper sticker sheet on purple backing”*).  
- Focus rings: 2px `#39FF14` offset on interactive elements.  
- Prices always include currency code on first mention.  
- **Affiliate disclosure** not required on own merch; footer still links `/affiliate` for catalog.

---

## Next design steps (no code required yet)

1. **Raster mocks** — 6 SKUs × 3 angles (flat lay, PDP, thumb) under `data/shop/mock/` when art exists.  
2. **Optional Figma** — component library linked to CSS variables above.  
3. **Interactive preview** — `/design/shop` static page in app (dev-only) when ready to pixel-check against production header.  
4. **Print vendor** — template safe zones (Sticker Mule / Printful) overlaid on sticker + tee mocks.

Interactive overview: open the **Shop design canvas** from the agent run (tabbed mockups). Full spec: [shop-design-concepts.md](shop-design-concepts.md).
