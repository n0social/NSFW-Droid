# Shop design concepts (pre-build)

**Date:** 30 October 2026  
**Status:** design only — no routes, checkout, or inventory in the app yet. UX wireframes below; **automated fulfillment + checkout ops** are specified in [Automated shop + checkout](#automated-shop--checkout-ops-architecture) (still no implementation).  
**Goal:** Visual and UX direction so a future merch / digital shop feels like the same product as the game catalog, with **near-zero owner upkeep** once live.

**Live UI tokens:** `src/app/globals.css` — background `#14061C`, surface `#241033`, primary `#22FF88`, accent `#39FF14`, text `#FFF1F7`, muted `#86EFAC`.  
**Mascot:** Vesper hosts the shop (storefront outfit, PG on public previews). Andri / `DroidMark` can appear on tech merch only. See `docs/design-and-mascot.md` and `docs/mascots.md`.

---

## What the shop is (and is not)

| In scope (design) | Out of scope for v1 designs |
| --- | --- |
| Branded **merch** (stickers, pins, tees, hoodie) | Selling **game keys** or hosted builds (Phase 2 / license) |
| **Digital** supporter goods (wallpaper pack, icon pack, PDF zine) | Platform **wallet** or in-game currency |
| **Bundles** labeled clearly (e.g. sticker + wallpaper) | Dropshipping arbitrary third-party catalog |

Checkout is drawn as a **shell** (shipping + payment placeholders). Payment and fulfillment choices (POD, processors, adult-content policies) are spelled out under [Automated shop + checkout](#automated-shop--checkout-ops-architecture); see also [revenue_streams.md](revenue_streams.md) for how shop revenue fits Phase 1 vs hosted-game revenue.

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

When built, the same steps map to **hosted payment** (Stripe Checkout, Shopify Pay, or adult processor) and **webhook-driven fulfillment** — physical lines ship via print-on-demand; digital lines deliver by email or tokenized download. Details below.

---

## Automated shop + checkout (ops architecture)

This section is the **target operating model**: customers browse on `/shop`, pay at checkout, and **orders fulfill without the owner packing boxes or emailing tracking numbers**. The catalog site stays the brand surface; fulfillment runs through partners and webhooks.

Design goal for the owner: **minimal manual upkeep**. Past shop experience (listing drift, stock counts, manual label printing) is explicitly out of scope. Inventory is **virtual** (POD + digital files), not a warehouse.

### Recommended stack pattern

| Pattern | What it is | Fit for NSFW Droid merch |
| --- | --- | --- |
| **Headless POD + own checkout** | Next.js shop UI on `www.nsfwdroid.com`; **Stripe Checkout** (or specialist processor) collects payment; **Printful / Printify / Gelato** API creates production jobs from webhooks | Best **Phase B**: same-domain IA (`/shop`, `/cart`, `/checkout`), full control of Vesper UX, one order record in your DB |
| **Embedded Shopify + POD app** | Shopify storefront (custom domain or subdomain) with **Printful/Printify** app; Shopify owns cart, tax, and payment | Best **Phase A**: almost **zero custom code**; theme matches brand loosely; subdomain `shop.nsfwdroid.com` is acceptable for launch |
| **Marketplace-only** (Etsy, etc.) | Link out from footer | Lowest build cost, **highest** ongoing listing work — avoid as primary |

**Why print-on-demand (POD) fits this SKU list:** stickers, enamel pins (where supported), and tees do not require buying stock upfront. The provider prints or presses **after** the customer pays. You hold **zero inventory**; SKUs are design files + variant mappings. Bundles (sticker + wallpaper) are a **checkout composition**: one payment, two fulfillment paths (physical POD + digital delivery).

Compare to a self-shipped shop: no cartons in the garage, no reorder points, no “sold out” unless the provider discontinues a blank or you sunset a design.

Payment rail note (factual, not a blocker list): **vanilla** merch (storefront-outfit Vesper, wordmark tee, PG sticker art) often clears **Stripe + Printful** or **Shopify Payments** after normal business verification. **Adult-themed art on apparel** or explicit copy can trigger **processor or POD content review** (Printful acceptable-use policies, Stripe restricted businesses, etc.). Hosted **game** sales remain in the specialist-processor lane described in [revenue_streams.md](revenue_streams.md); **merch** is a separate merchant category — plan SKU art and copy for policies you can defend in an application.

### Checkout flow (tied to IA)

Same routes as [Information architecture](#information-architecture); automation hooks at confirm.

| Step | Route / UI | Physical merch | Digital (wallpaper, icons) | Mixed cart |
| --- | --- | --- | --- | --- |
| Browse | `/shop`, collections, PDP | Variant + qty → cart | “Instant download” pill; no shipping block on PDP | Both line types in one cart |
| Cart | Drawer + `/cart` | Shows “Ships from …” from POD quote or flat rate | Shows “Delivered by email” | Subtotal; shipping **only** if any physical line |
| Checkout | `/checkout` | Step 2: address validated (provider or Stripe Address Element) | Step 2 **skipped** | Email always step 1; pay step 3 |
| Pay | Hosted session | Card/wallet on processor; order → `paid` | Same session | Single charge; split fulfillment in backend |
| Confirm | `/order/[id]` | “Order confirmed” + email receipt | Receipt + **download link** or “check email” | Two fulfillment statuses on one order |
| After pay | Email (Vesper bust) | Tracking when carrier scans | Secure link or time-limited token | Two emails or one email with two sections |

**Signed-in users (later):** prefill email on step 1; order history at `/order/[id]` without exposing download tokens in URLs longer than necessary.

### Order automation (paid → ship → track)

```mermaid
sequenceDiagram
  participant C as Customer
  participant S as NSFW Droid / Shopify
  participant P as Payment (Stripe / Shopify Pay)
  participant F as POD (Printful / Printify / Gelato)
  participant E as Email (transactional)

  C->>S: Checkout complete
  S->>P: Create payment session
  C->>P: Pay
  P->>S: Webhook payment_intent.succeeded / orders/paid
  S->>S: Persist order paid; split line items
  alt Physical lines
    S->>F: API create order + ship-to address
    F->>F: Print / pack / ship
    F->>S: Webhook package_shipped + tracking
    S->>E: Tracking email to customer
  end
  alt Digital lines
    S->>S: Mint download token or signed URL
    S->>E: Delivery email with link
  end
  E->>C: Receipt + tracking and/or download
```

ASCII equivalent (for plain-text readers):

```text
Customer pays → payment webhook → order marked PAID
  ├─ physical SKU → POD API order → POD ships → POD webhook → tracking email
  └─ digital SKU  → generate token / signed URL → delivery email (no carrier)
```

**Owner does not** poll dashboards for “unshipped orders” daily; **optional** weekly glance at dispute/chargeback queue only.

### What the owner does NOT do vs rare manual tasks

| Automated (default) | Owner does **not** |
| --- | --- |
| Payment capture | Copy-paste tracking numbers into emails |
| POD production + label | Pack shipments or buy postage |
| Carrier tracking emails | Update “inventory” counts per SKU |
| Digital delivery email | Manually attach ZIPs to Gmail |
| Refund **initiation** via processor UI when policy allows | Re-list products on a marketplace every season |

| Rare manual tasks | When |
| --- | --- |
| **Chargeback / dispute** | Respond in processor portal with receipt + tracking proof |
| **Bad address / undeliverable** | POD flags failure; owner emails customer once for correction or refund |
| **SKU sunset** | Disable PDP in admin or archive in Shopify; leave old orders honored |
| **Content policy strike** | Swap art or delist SKU if POD/processor requests change |
| **Tax nexus / settings** | Occasional Shopify or Stripe tax setting review (not per-order) |

### Digital goods (wallpapers, icon packs, zine PDF)

No shipping step. After `paid`:

1. **Email link** — transactional message with HTTPS link to `/api/shop/download?token=…` or provider-hosted file (S3/Spaces object with short TTL signed URL).
2. **Post-payment page** — `/order/[id]` shows one-time download button; token invalidated after N days or N downloads (configurable).

Files live in **Object Storage** (same pattern as future hosted builds in [revenue_streams.md](revenue_streams.md)); egress cost is tiny for ZIPs. Bundles: charge once at checkout; digital portion fulfills immediately even if physical POD is still in production.

### Environment and secrets (production)

Align with [autonomous-ops.md](autonomous-ops.md): **payment and POD credentials live only in `/etc/nsfwdroid.env` on the droplet** — never commit, never `NEXT_PUBLIC_*` for secrets.

| Variable (examples) | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Phase B embedded checkout |
| `PRINTFUL_API_KEY` (or Printify/Gelato equivalent) | Create fulfillment orders |
| `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_ADMIN_TOKEN` | Phase A webhook ingest if storefront is Shopify |
| `SHOP_DOWNLOAD_SIGNING_SECRET` | HMAC for digital download tokens |
| `ALERT_EMAIL_TO` / `ALERT_EMAIL_FROM` | Optional alert if webhook processing fails (reuse ops mail path) |

Local dev: `.env` from [`.env.example`](../.env.example). After changing env on the droplet: `systemctl restart nsfwdroid` (and rebuild if any `NEXT_PUBLIC_*` shop flags are added later).

### NSFW / adult merch constraints (planning)

- **Art on products:** Public shop mocks use **storefront / PG** Vesper (see [Vesper / Andri usage](#vesper--andri-usage-in-shop-art)). Explicit or “after age gate only” collections need **explicit approval** from payment and POD partners before you rely on automation — do not assume Stripe + Printful accepts the same imagery as the catalog’s age-gated pages.
- **Processors:** Stripe is widely used for **non-adult** merch POD; **adult-themed** physical goods may require **CCBill, Square (case-by-case), or Shopify with appropriate merchant category** — verify against current restricted-business lists, not blog posts.
- **POD providers:** Printful, Printify, and Gelato each publish **content policies** (hate, illegal content, explicit sexual imagery on print). Design SKUs so production files pass review; keep a **PG storefront line** as the default automated catalog.
- **Site vs shop:** The game catalog’s affiliate and ad monetization rules in [revenue_streams.md](revenue_streams.md) are separate from **merchant-of-record** shop revenue; shop income is direct sales, not affiliate CPS.

### Integration options for NSFW Droid

| | **Phase A — external storefront** | **Phase B — embedded on same domain** |
| --- | --- | --- |
| **Storefront** | Shopify (or similar) on `shop.nsfwdroid.com` | `/shop`, `/cart`, `/checkout` in Next.js app |
| **Payment** | Shopify Payments / connected processor | Stripe Checkout Session or Payment Element |
| **Fulfillment** | Printful/Printify **Shopify app** (no custom API at first) | Printful (etc.) **REST API** triggered from payment webhook |
| **Digital goods** | Shopify digital delivery app or manual fulfillment automation | Custom token + Spaces + email |
| **Owner effort** | Theme tweak, connect POD app, link from header **Shop** | Webhook handlers, order DB, monitoring — still low **ongoing** ops if webhooks are solid |
| **When to choose** | Launch fast; validate SKUs | Brand-locked UX; single sign-on later |

Header **Shop** can point to Phase A subdomain until Phase B routes ship; use consistent Vesper art on both.

### Operations burden: near zero

Checklist — **manual self-fulfillment shop** vs **automated POD + webhooks** (target):

| Task | Manual shop | Automated POD (this doc) |
| --- | --- | --- |
| Stock counts | Weekly or per sale | N/A (virtual SKUs) |
| Reorder blanks / sticker stock | Owner buys and stores | Provider |
| Print / pack / ship | Owner | Provider |
| Tracking emails | Owner | Webhook → email |
| Digital delivery | Owner sends links | Token + email on pay |
| New SKU go-live | Photos + listing + inventory | Upload art to POD + toggle PDP |
| Day-to-day time | Hours per week | **Near zero**; exceptions = disputes, policy, sunset |

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
5. **Ops path** — pick Phase A (Shopify subdomain) vs Phase B (embedded checkout) from [Integration options](#integration-options-for-nsfw-droid); confirm processor + POD approval for PG launch SKUs before writing webhook code.

Interactive overview: open the **Shop design canvas** from the agent run (tabbed mockups). Full spec: [shop-design-concepts.md](shop-design-concepts.md).
