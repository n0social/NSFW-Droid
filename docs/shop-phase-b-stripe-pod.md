# Shop Phase B — Stripe checkout + POD fulfillment

**Date:** 30 October 2026  
**Status:** Planning only — **implementation frozen** until catalog plan sign-off **and** explicit Phase B kickoff.  
**Audience:** Owner / implementers  

**Related:** [shop-catalog-planning.md](shop-catalog-planning.md) (browse UX, badges, matrix — **C0–C2 blocked** until sign-off), [shop-design-concepts.md](shop-design-concepts.md) (IA + ops overview), [shop-storefront-blueprint.md](shop-storefront-blueprint.md) (repo preview state), [autonomous-ops.md](autonomous-ops.md) (droplet env + alerts).

---

## Owner decisions (locked 30 Oct 2026)

| Decision | Choice |
| --- | --- |
| **Commerce path for launch** | **Phase B** — embedded shop on `www.nsfwdroid.com` (`/shop`, `/cart`, `/checkout`) with **Stripe** payment capture |
| **Physical fulfillment** | **Required online POD** (print-on-demand API) — not self-shipped inventory |
| **Phase A (Shopify subdomain)** | **Optional / alternate** only — de-emphasized; use only if owner explicitly pivots before Phase B ships |
| **Sale chibi on cards** | **Option C** — static JPG labels (NEW, CLEARANCE, LIMITED, DEAL); **dynamic `-{N}%` flag** on `percent_off` standee only ([catalog planning § Owner decision](shop-catalog-planning.md#owner-decision--sale-chibi-strategy-sign-off-before-c0)) |
| **Storefront build gate** | **No** production catalog routes epic (C0–C2) **and no** checkout/API work until: (1) catalog planning sign-off, (2) Phase B kickoff recorded |

---

## Phase gate (what is frozen)

```text
┌─────────────────────────────────────────────────────────────────┐
│  NOW: docs + mock preview only                                   │
│  • /shop and /design/shop = noindex UI preview (branch mockups)  │
│  • No cart API, no Stripe, no POD webhooks, no order DB          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼  Owner sign-off on shop-catalog-planning.md
┌─────────────────────────────────────────────────────────────────┐
│  C0 → C2: catalog UI (data, badges, collections, PDP)            │
│  Still NO checkout until Phase B kickoff                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼  Owner Phase B kickoff
┌─────────────────────────────────────────────────────────────────┐
│  Phase B epic: Stripe + POD API + digital tokens + order email   │
└─────────────────────────────────────────────────────────────────┘
```

**Do not** treat merging layout mockup branches as “shop is live.” **Hold merges** of preview-only work ahead of catalog sign-off unless the owner wants dev pixel-check on `main`. **Do not delete** existing `/shop` preview code without owner request — it is useful for art/layout regression; priority is planning and Phase B design, not expanding preview scope.

---

## Recommended POD provider (Phase B default)

Phase B **requires** one primary POD partner integrated via **REST API** (payment webhook → create order → receive ship/tracking webhooks). Shopify apps satisfy Phase A only; Phase B uses direct API.

| Provider | API maturity | Stickers / pins / apparel | Branding / US ship | Content policy | Phase B fit |
| --- | --- | --- | --- | --- | --- |
| **Printful** *(recommended default)* | Mature REST + webhooks (`package_shipped`, etc.) | Strong catalog (Bella+Canvas tees, stickers, posters; pins where enabled) | US + EU facilities; white-label packing slips | Strict AUP; PG storefront line aligns with launch SKUs | **Default** — best documented webhook story for custom Next.js stack |
| **Printify** | REST + webhooks | Wide print partner network | Variable by print partner | Similar content rules | Good **alternate** if Printful SKU mapping gaps |
| **Gelato** | REST + webhooks | Global print network | Strong intl | Policy review per design | Good **alternate** for intl-heavy shipping later |

**Planning default:** **`podProvider: "printful"`** in catalog JSON ([shop-catalog-planning.md](shop-catalog-planning.md)); map each variant to Printful `sync_product_id` / `variant_id` before go-live. Switching providers is a **catalog + webhook adapter** change, not a UX change.

---

## Stripe checkout flow (sketch)

Two acceptable Phase B patterns — pick one at kickoff (Checkout Session is faster to ship; Payment Element is more embedded UX).

### Option 1 — Stripe Checkout Session *(recommended for MVP)*

```text
Customer on /cart → [Checkout]
  → POST /api/shop/checkout/create
       • Validates cart lines (physical vs digital)
       • Creates pending Order row (status: pending_payment)
       • stripe.checkout.sessions.create({
           mode: 'payment',
           line_items: [...],          // from catalog prices
           customer_email: ...,
           shipping_address_collection: { ... }  // if any physical line
           metadata: { orderId: '...' }
         })
  → 302 redirect to Stripe Hosted Checkout
  → Customer pays on stripe.com
  → Stripe → POST /api/webhooks/stripe (checkout.session.completed)
       • Verify STRIPE_WEBHOOK_SECRET
       • Mark order PAID
       • Enqueue fulfillment (see below)
  → Redirect customer to /order/[id]?session_id=...
```

### Option 2 — Payment Element on `/checkout`

Same backend order + webhook semantics; step 3 renders Stripe Payment Element instead of redirect. Shipping address via **Stripe Address Element** when physical lines exist.

### Fulfillment enqueue (after `paid`)

```text
order PAID
  ├─ For each physical line → Printful API POST /orders (ship-to from Stripe)
  │     └─ On Printful webhook package_shipped → update order line + send tracking email
  └─ For each digital line → mint signed download token → delivery email (+ button on /order/[id])
```

Mixed cart: **one Stripe charge**; backend **splits** fulfillment paths (POD job + digital token) on the same `orderId`.

---

## Webhooks and email (required behavior)

| Event source | Event | App action |
| --- | --- | --- |
| Stripe | `checkout.session.completed` (or `payment_intent.succeeded` if using PI flow) | Idempotent mark paid; start fulfillment |
| Stripe | `charge.refunded` / disputes | Update order; optional owner alert |
| Printful | Order updated / `package_shipped` | Persist tracking URL + carrier; transactional **tracking email** |
| Printful | Order failed / address issue | Set line status; alert `ALERT_EMAIL_TO` |
| *(internal)* | Digital mint success | Send **delivery email** with link to `/api/shop/download?token=…` |

**Owner does not** manually send tracking — webhook → email template (Vesper bust header, same tone as [design concepts](shop-design-concepts.md)).

Failed webhook processing must surface via existing ops mail path ([autonomous-ops.md](autonomous-ops.md)); no SMS.

---

## Digital SKUs (parallel path, still Phase B)

Physical POD and digital goods share checkout but not carriers:

1. After payment webhook, digital lines **skip** Printful.
2. Files in Object Storage (Spaces); app mints HMAC token (`SHOP_DOWNLOAD_SIGNING_SECRET`).
3. Email + `/order/[id]` one-time or time-limited download button.
4. Bundles (`bundle_mixed`): one payment; digital portion fulfills immediately; physical waits on POD webhooks.

Details: [Automated shop + checkout — Digital goods](shop-design-concepts.md#digital-goods-wallpapers-icon-packs-zine-pdf).

---

## Droplet environment variables (Phase B — no keys in repo)

All secrets in **`/etc/nsfwdroid.env`** only. Examples (names align with [design concepts env table](shop-design-concepts.md#environment-and-secrets-production)):

| Variable | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY` | Server-side Stripe API |
| `STRIPE_WEBHOOK_SECRET` | Verify `/api/webhooks/stripe` |
| `STRIPE_PUBLISHABLE_KEY` | Client Payment Element only if used; never for secrets |
| `PRINTFUL_API_KEY` | Create/query POD orders (**default provider**) |
| `SHOP_DOWNLOAD_SIGNING_SECRET` | HMAC for digital download tokens |
| `ALERT_EMAIL_TO`, `ALERT_EMAIL_FROM` | Webhook/fulfillment failures |

Optional Phase A-only (if alternate path used): `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_ADMIN_TOKEN` — **not required** for locked Phase B.

After env changes on droplet: `systemctl restart nsfwdroid` per deploy docs. **This planning pass adds no API routes and no keys.**

---

## Phase B implementation epic (after kickoff)

Checklist for engineers — **do not start** until gate above is cleared.

### B0 — Foundation

- [ ] Order + order_line_items schema (paid, fulfillment_status per line)
- [ ] Catalog `podSkuMap` populated for Printful (launch SKUs)
- [ ] Stripe webhook route + idempotency keys
- [ ] Feature flag or env `SHOP_CHECKOUT_ENABLED=false` until owner flips

### B1 — Checkout

- [ ] `/cart` persistence (cookie or DB session)
- [ ] Checkout Session create + return URLs
- [ ] `/order/[id]` receipt page (no token leakage in logs)

### B2 — POD

- [ ] Printful order create on paid (physical lines only)
- [ ] Printful webhook handler → tracking on order
- [ ] Transactional shipping email template

### B3 — Digital

- [ ] Spaces objects for wallpaper/icon ZIPs
- [ ] `/api/shop/download?token=…` + signing + rate limits
- [ ] Delivery email on paid

### B4 — Ops

- [ ] Webhook failure alerts to `ALERT_EMAIL_TO`
- [ ] Admin or script: disable PDP / refund path documented
- [ ] Post-deploy verify `https://www.sfwdroid.com/api/health` + smoke checkout in Stripe test mode

### B5 — Go-live

- [ ] Flip `/shop` from `noindex` when owner approves
- [ ] Processor + Printful content approval for PG SKUs
- [ ] Stripe live mode keys in droplet env (owner-only)

---

## Phase A (optional alternate)

If owner chooses **Shopify** on `shop.nsfwdroid.com` before Phase B:

- Header **Shop** links out; Printful/Printify **Shopify app** handles POD without custom API.
- Stripe on `www` is **not** the cart of record for that path.
- Phase B remains the **locked** target for same-origin brand UX.

See [shop-storefront-blueprint.md — URL and hosting](shop-storefront-blueprint.md#url-and-hosting).

---

## Document history

| Date | Change |
| --- | --- |
| 2026-10-30 | Phase B locked: Stripe + required POD API; Printful default; gates C0–C2 and Phase B epic; preview merge guidance |
