# Member rewards, verification payments, and weekly newsletter

**Date:** 15 October 2026  
**Status:** Phase 0 — product and engineering spec only (no live payments, no automated newsletter send).  
**Related:** [engagement-policy.md](engagement-policy.md), [firebase-setup.md](firebase-setup.md), [revenue_streams.md](revenue_streams.md), [account-roadmap.md](account-roadmap.md), [data-and-ingest.md](data-and-ingest.md).

---

## A. Reward program

### Goals

| Goal | How rewards support it |
| --- | --- |
| **Retention** | Give signed-in members a reason to return (saved favorites, weekly picks, future points). |
| **Verified members** | Tie perks to Firebase accounts + age verification, not anonymous cookies alone. |
| **Favorites and engagement** | Surface community signal on rails and in email without paywalling the catalog. |
| **Future monetization** | Optional paid perks later; **catalog browsing stays free** in Phase 1–2. |

The catalog is a link-out directory today. Rewards recognize participation; they do not gate access to listings. See [engagement-policy.md](engagement-policy.md) for what already requires sign-in (favorites, profile, saved browse filters).

### Member tiers (brainstorm)

These are product directions, not shipped features.

| Tier | Requirements (target) | Perks |
| --- | --- | --- |
| **Visitor** | Age gate cookie only | Browse, outbound `/api/go`, anonymous `listing_view` / `outbound_click` in `analytics_event`. |
| **Free member** | Firebase sign-in + email verified; newsletter opt-in optional (`user_profile.newsletter_opt_in`) | Favorites, account hub, saved browse prefs; eligible for weekly email when opted in. |
| **Verified member** | Free member + **strong age assurance** (vendor or approved card check — see §B) | Badge on profile; future early-access rails; cosmetics. |
| **Supporter** (Phase 3, optional) | Verified + successful Stripe payment (tip, verification fee, or subscription) | Early access to features, Vesper-themed profile chrome, newsletter “supporter” segment. |

**Points (Phase 2):** accrue for signed-in actions only — favorite a game, write a review (when reviews exist), constructive outbound clicks (deduped). Points unlock **badges** and **cosmetic** profile frames (Vesper-themed assets from `public/mascot/vesper/`), not catalog unlocks.

**Early access rails (Phase 2–3):** time-boxed homepage slots or “members saw it first” for new ingest from itch/Steam/submit — editorial + analytics, not pay-to-win placement.

### Anti-abuse

- **One account per email** — Firebase Auth uniqueness; no multi-account farming for points.
- **Rate limits** on favorites API, analytics ingest, and newsletter subscribe endpoints (when built).
- **No rewards for bot traffic** — exclude events without plausible session hash, burst patterns, or datacenter IP lists (reuse patterns from ops alerts).
- **No points for unsigned traffic** — anonymous analytics still powers public Hottest/Trending; reward ledger ties to `user_profile` / Firebase `uid`.
- **Newsletter:** double opt-in; do not mail users who only toggled opt-in without confirming (if using Resend audiences or a dedicated `newsletter_subscriber` table).

### Phased rollout

| Phase | Scope | Ship criteria |
| --- | --- | --- |
| **0 — Docs** | This document, env placeholders, script stubs | Now |
| **1 — Newsletter** | Weekly top-6 email to opted-in members + standalone subscribe | Exim on droplet (`NEWSLETTER_TRANSPORT=sendmail`), SPF/DKIM/DMARC + `mail` A record, DigitalOcean port 25 + PTR, `NEWSLETTER_FROM` on droplet, legal copy reviewed |
| **2 — Points & badges** | Ledger table, profile UI, anti-abuse rules | Phase 1 stable; counsel OK on gamification copy |
| **3 — Paid perks (optional)** | Stripe Customer, verification micro-charge or AV vendor, tips | PCI path via Stripe hosted; **not live until counsel** for card-as-age-gate |

### Links to existing systems

- **Auth:** Firebase Email/Password + Google → `POST /api/auth/session` → `user_profile`. See [firebase-setup.md](firebase-setup.md).
- **Engagement:** Favorites and rails blend `user_favorite` with `analytics_event`. See [engagement-policy.md](engagement-policy.md) and `src/lib/listings-ranking.ts`.
- **Newsletter flag today:** `user_profile.newsletter_opt_in` on `/account` (stored via `PATCH /api/account/profile`).

---

## B. Verification and payment (not selling the catalog yet)

We are **not** selling games or a browse paywall in Phase 1. Payment infrastructure is for:

1. **Age verification** (18+) when moving beyond checkbox gate.
2. **Optional tips / donations** to support hosting.
3. **Future premium** (supporter tier, hosted downloads in Phase 2 per [considerations.md](considerations.md)).

**Separate from itch affiliate:** affiliate URLs flow through `/api/go/[listingId]` and ingest; Stripe is for **our** checkout only. Adult-game **catalog sales** may still require specialist processors later ([revenue_streams.md](revenue_streams.md)); Stripe fits verification and light supporter flows first.

### Recommended architecture: Stripe

| Piece | Use |
| --- | --- |
| **Stripe Customer** | One per Firebase `uid` (metadata: `firebase_uid`) |
| **Payment Intents** | One-off verification charge, tips, future SKUs |
| **Checkout Session** (optional) | Hosted UI for tips without building card fields |
| **No Product catalog required initially** | Create amounts in code (`amount`, `currency`) until premium SKUs are defined |

**Security**

- **PCI:** Card data only on Stripe-hosted fields or Checkout — **never store PAN** on the droplet or in Postgres.
- **Secrets:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` in `/etc/nsfwdroid.env` (same pattern as `RESEND_API_KEY` in [deploy-droplet.md](deploy-droplet.md)).
- **Webhooks:** Verify signature; idempotent handling for `payment_intent.succeeded` → mark `user_profile.age_verified_vendor` (column TBD).

### Age vendor integration paths

> **Legal:** Using a credit card as proof of 18+ is regulated in several jurisdictions. **Do not enable card-as-age-gate in production until counsel reviews** copy, retention, and refund policy.

| Approach | How it works | Pros | Cons |
| --- | --- | --- | --- |
| **Card verification micro-charge** | Stripe Payment Intent for a small hold/charge ($0.50–$1.00) with 18+ card network signals where available; refund or void after check | Single vendor (Stripe); familiar ops | Not a dedicated AV proof in UK OSA sense; counsel required |
| **Stripe Identity** | Document + selfie verification | Strong identity signal | Heavy UX; privacy sensitive |
| **VerifyMyAge** | Dedicated adult AV API; redirect or embedded flow | Built for adult sites; audit trail | Extra contract + integration |
| **AgeVerif / similar AV vendors** | ID scan or database check | Compliance-oriented | Cost per check; UX friction |
| **Checkbox + geo (current)** | Cookie via `/api/age-gate` | Zero friction | Fails “highly effective” AV for UK/US rules in [gaps.md](gaps.md) |

**Target flow (post-counsel):** verified Firebase member → Stripe Checkout or AV redirect → webhook updates profile → unlock “verified member” badge and unblurred defaults where policy allows.

---

## C. Weekly newsletter / subscription list

### Product spec

| Field | Spec |
| --- | --- |
| **List** | Emails from (a) `user_profile` where `newsletter_opt_in = true` and email from Firebase, plus (b) optional public footer signup → **Resend Audience** (`RESEND_NEWSLETTER_AUDIENCE_ID`) **or** Postgres `newsletter_subscriber` with **double opt-in** |
| **Cadence** | Once per week — **Friday 9:00 PM US Eastern** (`deploy/cron.d/nsfwdroid-weekly-newsletter`, `CRON_TZ=America/New_York`). Picks use a rolling 7-day analytics window at send time. |
| **Audience** | 18+ site; members and subscribers who confirmed opt-in |
| **Subject (exact)** | `Thanks for being a member: Here's our favorite NSFW games of the week` |

### Content selection (top 6)

1. **Window:** rolling **7 days** UTC of `analytics_event` (configurable `NEWSLETTER_RANK_DAYS=7`).
2. **Eligible listings:** `published`, `catalog_stale = false`, `link_status = 'ok'` — any ingest source (itch, Steam, manual, submit).
3. **Pick filter** (`src/lib/newsletter/pick-eligibility.ts`, applied in `fetchWeeklyNewsletterPicks` and demo send): exclude rows with linked `candidate` **review_status ≠ approved**, **TOS hold** (`raw_payload.tosScreen.hold`), **tos-screen** match on title, **blocked browse tag slugs** (`src/lib/tag-filter.ts` blocklist — ripper, jeff killer, etc.), or **offensive title patterns** (violent / creepypasta junk). Rank pool considers up to 80 scored listings, then takes the first 6 that pass.
4. **Signal:** blended **analytics only** (not member favorites):
   - `listing_view` counts in the window (1×).
   - `outbound_click` counts (default **2×** via `NEWSLETTER_CLICK_WEIGHT`).
   - Score = views + clicks × weight; tie-break: more clicks, then stable `listingId`.
5. **Output:** **6** games, ordered by score. **#1** is the hero headline (highest blended signal).

Stub implementation: `scripts/weekly-newsletter-pick.ts` (JSON to stdout for cron/logging).

### Email design

| Element | Spec |
| --- | --- |
| **Background** | Site violet/magenta — base `#14061C` with gradient accents (`#C026D3`, `#FF4D8D`) matching `src/app/globals.css` and hero components |
| **Hero headline** | **#1 Gold** title as main headline; link to `https://www.nsfwdroid.com/game/{slug}` |
| **Layout** | **Single vertical list of 6** games (no “First / Second / Third” copy). Ranks 1–3 use **gold / silver / bronze** star PNG frames; ranks 4–6 are simpler rows with a small accent star |
| **Stars** | Hosted PNGs at `https://www.nsfwdroid.com/newsletter/stars/` (`gold-star.png`, `silver-star.png`, `bronze-star.png`, `accent-star.png`; regenerate via `npx tsx scripts/generate-newsletter-star-assets.ts`) |
| **Footer** | Unsubscribe (Resend tag or signed link), 18+ statement, [affiliate disclosure](/affiliate), link to site, physical/contact line from privacy policy |

### Implementation roadmap

| Step | Artifact | Notes |
| --- | --- | --- |
| 1. Rankings query | `scripts/weekly-newsletter-pick.ts` | Run manually: `tsx scripts/weekly-newsletter-pick.ts` |
| 2. HTML template | `emails/weekly-top-six.tsx` (React Email) **or** `emails/weekly-top-six.html` | React Email needs `react-email` + `@react-email/components` dependency when implemented |
| 3. Send batch | `scripts/send-weekly-newsletter.ts` | Local Exim (`sendmail`); gated on `NEWSLETTER_ENABLED=1` |
| 4. Cron | Droplet `cron` or post–`weekly-maintenance-inner.sh` | After ingest; log to `/var/log/nsfwdroid-newsletter.log` |
| 5. Subscribe API | `POST /api/newsletter/subscribe` | Double opt-in email via Exim |
| 6. Unsubscribe | Signed HMAC link + `List-Unsubscribe` | One-click per CAN-SPAM |

**Transport / from-address:** `NEWSLETTER_TRANSPORT=sendmail`, `NEWSLETTER_FROM` or `ALERT_EMAIL_FROM`, plus DNS in [deploy-droplet.md](deploy-droplet.md) and [.env.example](../.env.example). Ops alerts stay on Resend.

**Env flags (Phase 1):**

```bash
NEWSLETTER_ENABLED=0
RESEND_NEWSLETTER_AUDIENCE_ID=
# Optional tuning
NEWSLETTER_RANK_DAYS=7
NEWSLETTER_CLICK_WEIGHT=2
```

### Next-sprint file checklist (no UI required yet)

- `docs/reward_program.md` (this file)
- `scripts/weekly-newsletter-pick.ts`
- `scripts/send-weekly-newsletter.ts` (stub)
- `emails/weekly-top-six.html` or React Email component
- `src/app/api/newsletter/subscribe/route.ts` (double opt-in)
- Drizzle migration: `newsletter_subscriber` (if not using Resend-only list)
- Cron snippet in `docs/deploy-droplet.md`

---

## Appendix: `newsletter_subscriber` schema (proposed)

```sql
CREATE TABLE newsletter_subscriber (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending', -- pending | active | unsubscribed
  confirm_token_hash text,
  subscribed_at timestamptz,
  unsubscribed_at timestamptz,
  source text, -- account_toggle | footer | import
  created_at timestamptz NOT NULL DEFAULT now()
);
```

Link `user_profile.firebase_uid` when the email matches an account.
