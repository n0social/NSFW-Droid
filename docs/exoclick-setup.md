# ExoClick publisher setup (NSFW Droid)

**Status:** Code is wired; **no third-party ad script runs in production** until you set `NEXT_PUBLIC_ADS_ENABLED=1` on the droplet, rebuild, and restart.

## Age gate (required before ads)

Display ads load only when **both** are true:

1. `NEXT_PUBLIC_ADS_ENABLED=1` (build-time flag on the droplet).
2. The visitor has confirmed 18+ and holds the first-party `age_verified=1` cookie (set via the age gate on `/` and `/browse`).

Until the cookie is set, `AdSlot` renders nothing and `ExoClickScript` does not load. Do not bypass this for ad traffic.

See `src/lib/cookies.ts` (`AGE_VERIFIED_COOKIE`) and `src/app/api/age-gate/route.ts`.

## Publisher signup checklist

1. **Create a publisher account** at [ExoClick](https://www.exoclick.com/) (Publisher / webmaster flow).
2. **Add your site** — use `https://www.nsfwdroid.com` (and apex if you serve it). Category: adult / games or entertainment as offered.
3. **Wait for approval** — new adult sites are often reviewed manually; traffic and content policy must match their terms.
4. **Create zones** (at least two):
   - **Banner** (728×90, 300×250, or responsive banner) → home placements `below-hero` and `between-rails`.
   - **Native / recommendation** (in-feed) → browse placement `browse-inline`.
5. **Copy integration values** from each zone’s code snippet (see checklist at end of this doc).
6. **Paste into `/etc/nsfwdroid.env`** on the droplet (never commit):
   ```bash
   NEXT_PUBLIC_ADS_ENABLED=0          # flip to 1 only after legal + age vendor OK
   NEXT_PUBLIC_EXOCLICK_ZONE_ID_BANNER=1234567
   NEXT_PUBLIC_EXOCLICK_ZONE_ID_NATIVE=7654321
   NEXT_PUBLIC_EXOCLICK_AD_SCRIPT_URL=https://a.magsrv.com/ad-provider.js
   NEXT_PUBLIC_EXOCLICK_INS_CLASS=eas6a97888e2   # example — use yours from dashboard
   ```
7. **Rebuild and restart** — Next.js inlines `NEXT_PUBLIC_*` at build time:
   ```bash
   cd /var/www/nsfwdroid
   set -a && source /etc/nsfwdroid.env && set +a
   npm run build
   systemctl restart nsfwdroid
   ```
8. **Verify** in a private window: without age confirmation, no ad script in Network tab; after 18+, script loads only when `ADS_ENABLED=1` and zone IDs + script URL are set.
9. **Privacy** — `/privacy` notes that ad partners may set cookies when ads are enabled. Update counsel before enabling.

## App behavior

| Env | Behavior |
| --- | --- |
| `NEXT_PUBLIC_ADS_ENABLED=0` (default) | No `AdSlot` markup, no ExoClick script |
| `=1` + missing zones | Dashed placeholders on slots (still no script without script URL + zone) |
| `=1` + zones + script URL + age cookie | `next/script` loads provider `afterInteractive`; `<ins data-zoneid="…">` per slot |

Slots: `below-hero`, `between-rails` (banner zone), `browse-inline` (native zone).

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
