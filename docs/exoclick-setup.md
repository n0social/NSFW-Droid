# ExoClick publisher setup (NSFW Droid)

**Status:** Code is wired. **Production:** footer banner zone and ad script URL are set in `/etc/nsfwdroid.env` with `NEXT_PUBLIC_ADS_ENABLED=1` (zone IDs stay server-only — not in git). After any env change, rebuild with those vars sourced and restart `nsfwdroid` (see [deploy-droplet.md §4b](deploy-droplet.md#4b-cloud-agent-release-code--build)).

## Age gate (required before ads)

Display ads load only when **both** are true:

1. `NEXT_PUBLIC_ADS_ENABLED=1` (build-time flag on the droplet).
2. The visitor has confirmed 18+ and holds the first-party `age_verified=1` cookie (set via the age gate on `/` and `/browse`).

Until the cookie is set, `AdSlot` renders nothing and `ExoClickScript` does not load. Do not bypass this for ad traffic.

See `src/lib/cookies.ts` (`AGE_VERIFIED_COOKIE`) and `src/app/api/age-gate/route.ts`.

## Site verification (meta tag)

ExoClick may ask you to prove domain control before zones go live. The verification token is **public** (it appears in HTML like any search-console tag); it is **not** a server secret.

NSFW Droid emits the tag on every page via Next.js root metadata in `src/app/layout.tsx`:

```html
<meta name="6a97888e-site-verification" content="8bb54aacf7c0714b30d3348ce1f1092c">
```

Implemented as `metadata.verification.other` so it lands in `<head>` without a client component. After deploy, confirm with:

```bash
curl -sL https://www.nsfwdroid.com/ | grep -o '6a97888e-site-verification'
```

Then click **Verify** in the ExoClick site settings. If you rotate the token in the dashboard, update `layout.tsx`, rebuild, and redeploy (see [deploy-droplet.md §4b](deploy-droplet.md#4b-cloud-agent-release-code--build)).

## Publisher signup checklist

1. **Create a publisher account** at [ExoClick](https://www.exoclick.com/) (Publisher / webmaster flow).
2. **Add your site** — use `https://www.nsfwdroid.com` (and apex if you serve it). Category: adult / games or entertainment as offered.
3. **Complete site verification** — ensure the meta tag above is live, then verify in ExoClick (step may appear before or with zone approval).
4. **Wait for approval** — new adult sites are often reviewed manually; traffic and content policy must match their terms.
5. **Create zones** (banner + optional play-click popunder; optional native for browse):
   - **Banner** (728×90, 300×250, or responsive banner) → site-wide placement `footer-banner` (centered above legal links in `SiteFooter`).
   - **Popunder** (play-click) → see [Play-click popunder](#play-click-popunder) below.
   - **Native / recommendation** (in-feed, optional) → browse placement `browse-inline`.
6. **Copy integration values** from each zone’s code snippet (see checklist at end of this doc).
7. **Paste into `/etc/nsfwdroid.env`** on the droplet (never commit):
   ```bash
   NEXT_PUBLIC_ADS_ENABLED=0          # flip to 1 only after legal + age vendor OK
   NEXT_PUBLIC_EXOCLICK_ZONE_ID_BANNER=1234567
   NEXT_PUBLIC_EXOCLICK_ZONE_ID_NATIVE=7654321
   NEXT_PUBLIC_EXOCLICK_ZONE_ID_POPUNDER=5554444
   NEXT_PUBLIC_EXOCLICK_AD_SCRIPT_URL=https://a.magsrv.com/ad-provider.js
   NEXT_PUBLIC_EXOCLICK_INS_CLASS=eas6a97888e2   # example — use yours from dashboard
   # Optional override; default is /exoclick-popunder.js (paste dashboard snippet into that file)
   # NEXT_PUBLIC_EXOCLICK_POPUNDER_SCRIPT_SRC=/exoclick-popunder.js
   ```
8. **Rebuild and restart** — Next.js inlines `NEXT_PUBLIC_*` at build time:
   ```bash
   cd /var/www/nsfwdroid
   set -a && source /etc/nsfwdroid.env && set +a
   npm run build
   systemctl restart nsfwdroid
   ```
9. **Verify** in a private window: without age confirmation, no ad script in Network tab; after 18+, script loads only when `ADS_ENABLED=1` and zone IDs + script URL are set.
10. **Privacy** — `/privacy` notes that ad partners may set cookies when ads are enabled. Update counsel before enabling.

## App behavior

| Env | Behavior |
| --- | --- |
| `NEXT_PUBLIC_ADS_ENABLED=0` (default) | No `AdSlot` markup, no ExoClick script |
| `=1` + missing zones | Dashed placeholders on slots (still no script without script URL + zone) |
| `=1` + zones + script URL + age cookie | `next/script` loads provider `afterInteractive`; `<ins data-zoneid="…">` per slot; `AdProvider.push({"serve":{}})` after slots (idempotent) |

Slots: `footer-banner` (banner zone, most pages with `SiteFooter`). **Hidden** on `/sign-in`, `/sign-up`, `/account`, and `/settings` (`showFooterAds={false}`). Future ad-free subscriptions can hook `hasAdFreeSubscription()` in `src/lib/ads-config.ts`. Optional `browse-inline` on `/browse`.

Admin dashboard shows read-only **Ads enabled** from the same build flag.

## Turning ads on

Only after:

- ExoClick publisher approval,
- Age gate and affiliate/disclosure copy reviewed,
- Counsel OK on cookie / partner privacy language,

set `NEXT_PUBLIC_ADS_ENABLED=1`, rebuild, restart.

## What to copy from the ExoClick dashboard

When a zone is approved, open **Zones → your zone → Integration / code**. Copy:

| Copy this | Into droplet env var |
| --- | --- |
| **Zone ID** (numeric, often in `data-zoneid="…"`) | Banner → `NEXT_PUBLIC_EXOCLICK_ZONE_ID_BANNER`; native → `NEXT_PUBLIC_EXOCLICK_ZONE_ID_NATIVE` |
| **Script `src`** (e.g. `https://a.magsrv.com/ad-provider.js`) | `NEXT_PUBLIC_EXOCLICK_AD_SCRIPT_URL` |
| **`<ins class="…">`** class name if present | `NEXT_PUBLIC_EXOCLICK_INS_CLASS` (optional but recommended) |

You do **not** need a server-side ExoClick API key for basic web zones.

Keep a screenshot or note of zone names ↔ placements for your own runbook.

## Play-click popunder

On an age-verified **non-Steam** Play or outbound click (itch.io, Nutaku, other partners), the **current tab** navigates to `/api/go` or the outbound URL (one store navigation) and a **hidden iframe** sends the **browser** to ExoClick `link.php`. **Steam** Play never fires a popunder. The catalog does not `window.open` the store. ExoClick’s `link.php` may still open one ad tab of its own. Fetching `s.pemsrv.com` from Node does not bill (that path stopped impressions on 2026-10-23).

Implementation: client click handler (`exoclick-play-popunder-client.ts`) appends a hidden iframe to `/api/ads/popunder-launch?hop=syndication`, which 302s the **iframe** to ExoClick `v1/link.php`, then assigns the current tab to the store URL (works after SPA navigation). A Node `fetch` of `s.pemsrv.com` does not bill and is not used on `/api/go` or `/api/outbound`. Steam clicks never run this hop. Footer banner (`a.magsrv.com`) is separate and stays after the age gate.

### What to create in ExoClick

1. **Publishers → Sites →** your site → **Add zone**.
2. Format: **Popunder** (not banner).
3. Suggested name: `NSFW Droid — play outbound`.
4. **Trigger method:** *Clicking on links with a specific class (Google Compliant)*.
5. **Trigger class:** `nsfwdroid-play-outbound` only if you install ExoClick’s own snippet. The live site does not load `popunder1000.js` and does not need this class on the button.
6. **New Tab:** ON (Chrome already uses tabs; this helps other browsers).
7. **Chrome enabled:** ON (or OFF if you only want non-Chrome — not recommended).
8. **Capping / frequency:** start conservative (e.g. **1** popunder per **24 hours** per user) so repeat Play clicks are not spammy.
9. **Fallback to popup:** optional; OFF keeps the experience closer to “extra tab you close.”
10. Code format: **Inline + Remote Script (Recommended)**.
11. Create **two** popunder zones in ExoClick (web **6062592** + mobile **6062594**). The site fires the popunder iframe on **each** eligible outbound click by default. Optional client throttle: `NEXT_PUBLIC_EXOCLICK_POPUNDER_FREQUENCY_MINUTES` (e.g. `30`; omit or `0` = per click).

**Important:** Do not ship ExoClick’s default snippet (`trigger_method: 3` pops every `<a>`). This site does not load `a.pemsrv.com/popunder1000.js`. Countable traffic is the browser iframe hop to `s.pemsrv.com/v1/link.php` for non-Steam clicks only. A server `fetch` of that URL does not bill.

### Droplet env

| Copy this | Into env |
| --- | --- |
| Desktop popunder **Zone ID** | `NEXT_PUBLIC_EXOCLICK_ZONE_ID_POPUNDER` (production: **6062592**) |
| Mobile popunder **Zone ID** | `NEXT_PUBLIC_EXOCLICK_ZONE_ID_POPUNDER_MOBILE` (production: **6062594**) |
| (Optional) custom script URL | `NEXT_PUBLIC_EXOCLICK_POPUNDER_SCRIPT_SRC` — default `/exoclick-popunder.js` |
| Popunder iframe throttle (minutes) | `NEXT_PUBLIC_EXOCLICK_POPUNDER_FREQUENCY_MINUTES` — unset/**0** = every click; e.g. **30** to cap |

Rebuild after setting `NEXT_PUBLIC_EXOCLICK_ZONE_ID_POPUNDER` (same as other `NEXT_PUBLIC_*` vars).

### Verify

1. Age gate → 18+ confirmed. Footer banner (`a.magsrv.com`, zone from `NEXT_PUBLIC_EXOCLICK_ZONE_ID_BANNER`) still loads only after that cookie.
2. `NEXT_PUBLIC_ADS_ENABLED=1` and popunder zone IDs set. `public/exoclick-popunder.js` is a stub (old bookmarks must not 404). It is not the billing tag.
3. Age-verified **itch / non-Steam Play**: the current tab navigates to `/api/go/…` (302 to the store). Network also shows a hidden iframe to `/api/ads/popunder-launch?hop=syndication` that redirects to `s.pemsrv.com/v1/link.php`. The page does not `window.open` the store. ExoClick’s page may still open one ad tab. **Steam Play** is a normal link: no `pemsrv` request.
4. ExoClick stats → popunder zones **6062592** / **6062594** impressions within a few minutes. Optional throttle: `NEXT_PUBLIC_EXOCLICK_POPUNDER_FREQUENCY_MINUTES` (unset or `0` = every eligible click).

The click handler runs in the browser on eligible Play and outbound links. It does not depend on ExoClick binding every `<a>` at `window.load`.
