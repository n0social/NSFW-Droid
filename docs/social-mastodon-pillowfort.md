# Social posting — Mastodon (Fediverse) & Pillowfort

Product direction: promote **new catalog listings** (and optionally video items) with **one post per item**, chained after ingest, linking to `https://www.nsfwdroid.com/game/{slug}` (or `/videos`). Not a replacement for the weekly newsletter (that stays analytics top-6).

## Fediverse = mostly Mastodon for us

The **fediverse** is the network of **ActivityPub** apps (Mastodon, Pixelfed, etc.). For **automated posting from the droplet**, the practical path is:

1. Register an **OAuth app** on one **home instance** (your server).
2. Post via **Mastodon’s HTTP API** (`POST /api/v1/statuses`, optional `POST /api/v1/media`).
3. Other servers see those posts if they follow you or via hashtags — you do **not** need to implement ActivityPub yourself.

Docs: [authorized apps](https://docs.joinmastodon.org/client/authorized/), [post status](https://docs.joinmastodon.org/methods/statuses/), [update credentials](https://docs.joinmastodon.org/methods/accounts/#update_credentials). Scopes: `write:statuses` + `write:media` for posting; add `write:accounts` to change the profile (avatar, header, note, fields).

### Getting an API token (no password on the server)

Mastodon does **not** use your account password for posting. You create a **Development** app once, then store only **`MASTODON_ACCESS_TOKEN`** on the droplet.

**Production account (lookup):** `@nsfwdroid@mastodon.social` → `MASTODON_INSTANCE_URL=https://mastodon.social`

1. Log in on the web (mastodon.social usually wants the **email** you signed up with, not only the username).
2. **Preferences → Development** → your app (e.g. `cursor`) with redirect **`urn:ietf:wg:oauth:2.0:oob`**.
3. Copy **Client key** → `MASTODON_CLIENT_ID`, **Client secret** → `MASTODON_CLIENT_SECRET` (local shell only; never commit).
4. Print the authorize link and approve the app in the browser:

```bash
MASTODON_INSTANCE_URL=https://mastodon.social \
MASTODON_CLIENT_ID=... MASTODON_CLIENT_SECRET=... \
npx tsx scripts/mastodon-oauth-token.ts authorize
```

5. After you authorize, Mastodon shows a **code** on the page. Exchange it (output includes `access_token`):

```bash
npx tsx scripts/mastodon-oauth-token.ts exchange --code=PASTE_CODE_HERE
```

6. On the droplet (`/etc/nsfwdroid.env`):

```bash
SOCIAL_MASTODON_ENABLED=1
MASTODON_INSTANCE_URL=https://mastodon.social
MASTODON_ACCESS_TOKEN=...
```

7. Verify: `npx tsx scripts/mastodon-verify-token.ts` (with the same env vars).

### Profile (avatar, banner, bio)

Production look for `@nsfwdroid@mastodon.social`:

| Field | Value |
| --- | --- |
| Display name | NSFW Droid |
| Bot | `false` (catalog account, not a bot flag) |
| Website field | `https://www.nsfwdroid.com` |
| Avatar | Close-up of **Vesper** (square ~400×400, readable at small size) |
| Header | Marketing banner ~1500×500 — “NSFW Droid — Top NSFW mobile & web games listing. Sign up for the weekly newsletter.” with Vesper in a cute pink bunny outfit (18+ catalog promo, not explicit) |

Default bio (under Mastodon’s 500-character note limit):

```
Top NSFW mobile & web games listing. Follow for new catalog drops. Sign up for the weekly newsletter on the site. 18+ only. Hosted by Vesper.

https://www.nsfwdroid.com
```

Apply from the droplet (images stay off git; generated copies live in agent artifacts):

```bash
set -a && source /etc/nsfwdroid.env && set +a
npx tsx scripts/mastodon-update-profile.ts \
  --avatar=/path/mastodon-avatar-vesper.png \
  --header=/path/mastodon-banner-vesper-bunny.png
```

The script `POST`s each image to `/api/v2/media`, then `PATCH /api/v1/accounts/update_credentials` with the files plus note, website field, and `bot=false`. Confirm with `npx tsx scripts/mastodon-verify-token.ts`.

If the PATCH returns **403**, the token was minted without `write:accounts`. Mastodon **cannot add scopes to an existing OAuth app** — create a new Development app (or `POST /api/v1/apps`) with `read write:statuses write:media write:accounts` up front, then re-authorize and replace `MASTODON_ACCESS_TOKEN` on the droplet. Production uses **`nsfwdroid-profile-bot`** (full scopes) for both posting and profile.

**2026-10-17 apply:** `POST /api/v2/media` for the Vesper avatar and bunny banner **succeeded**. `PATCH /api/v1/accounts/update_credentials` returned **403** (`This action is outside the authorized scopes`). Profile still has the default missing avatar/header and empty note. To finish live:

1. Mastodon → **Preferences → Development → nsfwdroid-ingest-bot** — include **`write:accounts`** on the app.
2. Re-run `scripts/mastodon-oauth-token.ts` authorize/exchange (helper scopes now include `write:accounts`).
3. Replace `MASTODON_ACCESS_TOKEN` on the droplet (never commit).
4. Re-run `npx tsx scripts/mastodon-update-profile.ts` with the avatar/header PNGs.

**Security:** Do not put account passwords in chat, git, or `/etc/nsfwdroid.env`. If a password was shared elsewhere, change it in Mastodon → Password and use only the token for automation.

### Choosing an instance (18+ game catalog)

Pick a server whose rules allow **marked NSFW** game promos and **linking to your site** (many instances discourage pure outbound ads). Prefer:

- Explicit **18+** and **content warning** rules you can follow.
- Stable moderation (not “NSFW tolerated until it isn’t”).

Register **`@nsfwdroid@your-instance`** (brand account). Use **content warnings** and **sensitive** media on covers when required.

### Post shape (Mastodon)

- **Text:** title, one line, link to game page, `#nsfw` / `#nsfwgames` / `#visualnovel` as appropriate (don’t hashtag-spam).
- **Media:** listing **cover image** (same `cover_image_url` as GameCard / game page), uploaded via `POST /api/v1/media` and attached by default (`MASTODON_ATTACH_COVER=1`; set `0` for text-only). Marked **sensitive** when media is attached.
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
ingest-all (successful ingest_all)
    → enqueue → social_outbox (pending) → drain (limits) → nsfwdroid-social.log
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
MASTODON_ACCESS_TOKEN=           # user token, write:statuses write:media write:accounts
SOCIAL_MASTODON_ENABLED=1
SOCIAL_MAX_PER_INGEST=3
SOCIAL_MAX_PER_DAY=15
MASTODON_ATTACH_COVER=1

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

Each **successful** `ingest-all` enqueues and drains when social env is on. Logs: `/var/log/nsfwdroid-social.log` (`NSFWDROID_SOCIAL_LOG`). Optional `GET /api/health` → `social.outbox` when enabled or `HEALTH_SOCIAL_OUTBOX=1`.

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

**Inbound discovery (no manual social expected):** [social-engagement-playbook.md](social-engagement-playbook.md) — what runs automatically and rare ops checks only.
