# What's still open

**Date:** 10 October 2026 (updated 14 October 2026)  
**Status:** partial. Link catalog, ingest, auto-publish (TOS holds), admin, legal pages, themes, accounts **1b**, and **per-game SEO pages** (`/game/[slug]`, sitemap) are on `main`. Items below remain open (age vendor, search, Managed Postgres, affiliate wiring, creator profiles). See [seo-game-pages.md](seo-game-pages.md).  
**Already decided:** link catalog first, DigitalOcean for the site, host a build only with a written license (`docs/considerations.md`), earn from affiliates, adult ads, and labeled sponsorships (`docs/revenue_streams.md`), purple-and-pink brand with Vesper (`docs/design-and-mascot.md`).

The hole that blocks a public site is not the mascot and not the Android app. It is a catalog people trust, a way to add rows without stealing them, and an age check that actually sits in front of the explicit art.

## Before the first public page

1. **A public name.** The repository name is still the working title. Vesper can stay either way.
2. **Version 1 is a website.** The sideloaded Android store app matters once the store is delivering files. A link directory does not need an APK.
3. **Which shelves version 1 covers.** Start with two sources that already publish a machine-readable list, plus games a developer submits. Add a third source only when it offers the same kind of list. Five scrapers on day one means five broken parsers.
4. **Age check in front of the art.** A catalog of adult games is the kind of service the UK Online Safety Act treats as pornography. Since 25 July 2025, services that allow pornography have had to use highly effective age assurance so children are not normally able to see it. Ofcom’s position is that a dedicated service should put that check at the front door, with no sexual content visible before it passes. A checkbox that says “I am 18” is not that check. Several US states have their own verification rules. This needs a real vendor and a written record of how the check works before explicit thumbnails go up. The brand note already keeps Vesper’s storefront outfit and the heart system usable on the gate itself.
5. **The legal pages.** Terms of use, a privacy notice, an affiliate disclosure on paid links, and a contact for copyright complaints. These are short. They have to exist on the domain.
6. **Review for edge cases.** Ingest and submit land as candidates; **TOS-clear rows auto-publish** in production (`AUTO_PUBLISH=1`, see `docs/tos-review-policy.md`). Holds and strict mode still use `/admin`.
7. **Accounts with the programs that pay.** Affiliate approvals and one adult ad network. The revenue note is a plan until those accounts exist.
8. **Domain, TLS, and a small Droplet.** The link catalog fits on one box. Spaces stays off until a licensed file exists.

## Finding new games

A daily job that notices new uploads is the right idea. Copying those sites with a handful of HTML scrapers is the wrong shape.

Scrapers break when the page changes, they copy text and screenshots the store does not have a license to republish, and they get the host IP blocked. DigitalOcean’s acceptable use policy forbids crawling that impairs another system, and it forbids uploading material you do not have the rights to. A piracy forum is not a source. Linking to a rehost teaches players that this store is a mirror, which is the opposite of the license model in `docs/considerations.md`.

Use a feed or an API the site publishes, and store a pointer.

| Source | How to hear about a new game | What we keep |
| --- | --- | --- |
| itch.io | Official RSS. Any browse URL accepts `.xml` on the end. Latest uploads are `https://itch.io/feed/new.xml`. Their API docs describe this. | Title, page URL, publish time, itch id |
| Steam | Steam Web API. `IStoreService/GetAppList` can take `if_modified_since` and a Web API key. App details then show the adult-only sexual content descriptor. | App id, name, store URL, whether the descriptor is present |
| Affiliate programs | The product feed or creative list inside the affiliate dashboard, after the account is approved | Their tracking URL, the name they want used, the creative they supply |
| Developers | A form on the site: official URL, contact, platforms | Whatever they submit, still reviewed |

The daily job writes a candidate. It does not publish.

```text
source, external_id, title, outbound_url, first_seen_at, raw_flags
```

That is the whole record until review. No binary, no mirrored screenshot gallery, no copied store description. Hotlinking their images into our pages fails when they change a URL and often violates their terms. The listing image is either theirs from an affiliate kit, or a plain typographic card until we have permission.

Review then fills the public row: platforms, tags, official URL, affiliate URL if we have one, artwork source, and the content check from `docs/considerations.md` (adults only, no minor-coded characters, no non-consensual content, no incest, no bestiality, no real-person sexual images). If the feed cannot support that check, the row waits.

Dedupe on source plus external id. A weekly pass marks links that start returning errors and pulls them off the public page. The job sends a normal user agent, goes slowly, and stops when a site’s robots.txt or terms disallow automated access. There is no login bypass and no age-gate bypass. If a shelf has no feed, it is added by hand.

Steam and itch.io will include games outside the content line, and itch.io’s new feed includes everything, not only adult games. The queue exists so those rows never go live by accident.

## After the catalog is up

These are real, and they wait.

- Tag vocabulary, so “new this week” and a sexual-content facet are browseable. Genre alone is how a general store works, and this store is not that.
- Search.
- A developer page that shows the status of a submission.
- Dead-link and “still adult?” rechecks when a source updates a game.
- Analytics on outbound clicks, separated by affiliate and plain link.
- Member rewards and verification payments — spec in [reward_program.md](reward_program.md) (Phase 0+). **Weekly newsletter** (footer double opt-in + Sunday cron) is live when `NEWSLETTER_ENABLED=1` on the droplet; points/badges remain future work.
- The Android client, Object Storage, and the upload terms, in that order, when a developer asks us to host a build.
- Vesper art, from the brief, storefront outfit first.

## Not missing

A payment wallet, a native iOS app, and a stack of site scrapers. The wallet and the iOS app belong to a later store. The scrapers are replaced by the feeds above plus the review queue.
