# Social posting — Mastodon (Fediverse) & Pillowfort

Product direction: promote **new catalog listings** (and optionally video items) with **one post per item**, chained after ingest, linking to `https://www.nsfwdroid.com/game/{slug}` (or `/videos`). Not a replacement for the weekly newsletter (that stays analytics top-6).

## Fediverse = mostly Mastodon for us

The **fediverse** is the network of **ActivityPub** apps (Mastodon, Pixelfed, etc.). For **automated posting from the droplet**, the practical path is:

1. Register an **OAuth app** on one **home instance** (your server).
2. Post via **Mastodon’s HTTP API** (`POST /api/v1/statuses`, optional `POST /api/v1/media`).
3. Other servers see those posts if they follow you or via hashtags — you do **not** need to implement ActivityPub yourself.

Docs: [authorized apps](https://docs.joinmastodon.org/client/authorized/), [post status](https://docs.joinmastodon.org/methods/statuses/), scopes `write:statuses` + `write:media`.

### Choosing an instance (18+ game catalog)

Pick a server whose rules allow **marked NSFW** game promos and **linking to your site** (many instances discourage pure outbound ads). Prefer:

- Explicit **18+** and **content warning** rules you can follow.
- Stable moderation (not “NSFW tolerated until it isn’t”).

Register **`@nsfwdroid@your-instance`** (brand account). Use **content warnings** and **sensitive** media on covers when required.

### Post shape (Mastodon)

- **Text:** title, one line, link to game page, `#nsfw` / `#nsfwgames` / `#visualnovel` as appropriate (don’t hashtag-spam).
- **Media:** optional cover image (upload media, attach `media_ids`) — only if instance policy allows explicit thumbs.
- **Visibility:** `public` or `unlisted` if you want less fediverse firehose noise.
- **Rate limits:** instance-dependent; plan **≤3 posts per ingest run**, **≤15/day** across platforms until reputation is established.

## Pillowfort

[Pillowfort](https://www.pillowfort.social/) is a **separate silo** (not ActivityPub). It is **pro-NSFW** and community-oriented, but there is **no documented public write API**. Third-party tools use **undocumented JSON** (`/posts/{id}/json/`) and **session login** (Rails `authenticity_token` + cookies) — fragile and may violate ToS if used for bots without permission.

**Recommended approach:**

| Phase | Pillowfort |
| --- | --- |
| **Now** | Create account + optional **community** for NSFW games; **manual** or semi-manual cross-post of the same copy as Mastodon while volume is low. |
| **Before automation** | Email Pillowfort support: ask if **catalog accounts** may use an API or approved posting integration. |
| **If approved / stable** | Implement a **Pillowfort adapter** behind the same outbox (cookie/session from env, CSRF token refresh, post endpoint they document). |
| **If not approved** | Keep Pillowfort as **manual mirror** (admin copies from outbox preview) or RSS/community mod tools only. |

Do **not** rely on scraping gallery-dl-style login for production until Pillowfort confirms it is acceptable.

## Shared architecture (both platforms)

Same pattern as newsletter + ingest:

```
ingest-all (new published listings)
    → social_enqueue.ts     # rows in social_outbox (pending)
cron / end of catalog-ingest-cron.sh
    → social_drain.ts       # Mastodon (+ Pillowfort when ready)
```

**Table `social_outbox` (migration `drizzle/0013_social_outbox.sql`):**

| Column | Purpose |
| --- | --- |
| `listing_id` | FK, unique per platform once posted |
| `platform` | `mastodon` \| `pillowfort` |
| `status` | `pending` \| `posted` \| `failed` \| `skipped` |
| `payload` | title, url, optional media url |
| `external_id` | Mastodon status id / Pillowfort post id |
| `posted_at` / `error` | audit |

**Dedupe:** one successful post per `(listing_id, platform)`; enqueue only listings whose `published_at` (or `first_seen_at`) is after last drain and pass the same **eligibility** spirit as newsletter (`pick-eligibility.ts`).

**Env (droplet `/etc/nsfwdroid.env`, never commit):**

```bash
# Mastodon
MASTODON_INSTANCE_URL=https://your.instance
MASTODON_ACCESS_TOKEN=           # user token, write:statuses write:media
SOCIAL_MASTODON_ENABLED=1
SOCIAL_MAX_PER_INGEST=3
SOCIAL_MAX_PER_DAY=15

# Pillowfort (later)
PILLOWFORT_ENABLED=0
# PILLOWFORT_SESSION_COOKIE=     # only if Pillowfort approves automation
```

## Content policy (site + social)

- **18+** in profile and posts where required.
- **Affiliate:** if the listing has `affiliate_url`, disclose in post text (same as site).
- **Do not** post every candidate row — only **live published** listings.
- **Videos:** separate enqueue from `video-feeds` with outbound policy respected (link to your `/videos` page, not hotlinking if source forbids).

## Ops (droplet)

After ingest (`scripts/catalog-ingest-cron.sh`), when `SOCIAL_MASTODON_ENABLED=1` (or `SOCIAL_ENQUEUE_ENABLED=1` / `PILLOWFORT_ENABLED=1`):

```bash
npx tsx scripts/social-enqueue.ts   # new listings → pending rows
npx tsx scripts/social-drain.ts     # Mastodon API (respects SOCIAL_MAX_PER_DAY)
```

Logs append to `/var/log/nsfwdroid-social.log` (override with `NSFWDROID_SOCIAL_LOG`).

Local compose check: `npx tsx scripts/test-social-compose.ts`.

## Implementation order

1. **Mastodon only:** outbox migration, enqueue after ingest, drain script, ops log `/var/log/nsfwdroid-social.log`. **Done in repo** — enable on droplet once instance + token are set.
2. **Admin preview (optional):** `/admin` queue of pending social posts before drain.
3. **Pillowfort:** manual mirror → permission → adapter.
4. Tune rates from engagement and instance mod feedback.

## Relation to other channels

| Channel | Role |
| --- | --- |
| **Newsletter** | Friday 9pm ET, top 6 by 7-day views + weighted clicks |
| **Mastodon / Pillowfort** | Discovery drip for **new** games (and optional videos) |
| **Telegram** | Not in scope unless you add a channel later for subscribers |
| **X/Twitter** | Out of scope unless soft weekly promo later |
