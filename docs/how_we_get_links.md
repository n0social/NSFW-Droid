# How we get links

**Date:** 12 October 2026  
**Status:** analysis only. No crawler is built.  
**Related:** `docs/gaps.md` for what else blocks a public site, `docs/considerations.md` for the difference between a link and a license to host the file, `docs/revenue_streams.md` for which of these links pay.

The catalog starts as outbound links. A row is a title plus the page where the player actually gets the game. We do not download the build, and we do not copy the store’s screenshots or description into our own bucket.

## What we looked at

A daily HTML scraper per site was the first idea. It is a poor fit for this catalog.

- The pages change, and the parser breaks.
- The text and images on those pages are someone else’s. Republishing them is a different, bigger rights problem than linking to the page. `docs/considerations.md` already separates those two permissions.
- DigitalOcean’s acceptable use policy (20 March 2026) forbids crawling that impairs another system, and it forbids uploading material you do not have the rights to.
- Sites that rehost games without a license are not sources. Linking to them would make this catalog a mirror.

The sites that matter already publish a list, a feed, or an affiliate export. Those are the inputs. Anything with no list is typed in by hand.

Every hit from a feed lands in a review queue. Nothing is public until a person checks it. Steam’s new-app list and itch.io’s new-upload feed both contain plenty of games that are outside this store’s content line. Autopublish would put those on the homepage.

## itch.io

itch.io documents this themselves. Any browse URL accepts `.xml` on the end and returns an RSS feed of that browse. They also publish three fixed feeds:

| Feed | URL |
| --- | --- |
| Latest uploads | `https://itch.io/feed/new.xml` |
| Homepage features | `https://itch.io/feed/featured.xml` |
| Active sales | `https://itch.io/feed/sales.xml` |

A filtered browse works the same way. Their own example is `https://itch.io/games/price-free.xml` for the free-games browse. The daily job reads `new.xml`, keeps games it has not seen, and queues them.

That feed is every new project, not an adult-only feed. Review has to drop ordinary games, and it has to drop adult games that cross the content line (minors or minor-coded characters, non-consensual content, incest, bestiality, real-person sexual images).

itch.io also has a server-side API at `https://itch.io/docs/api/overview`, including authenticated search. RSS is enough for “what was uploaded since yesterday.” The API key can wait until we need a narrower query than the public feed.

Paid adult discovery on itch.io has been unreliable since the July 2025 card-network deindexing. The feed can still announce a page that their own search hides. We link to the project URL the feed gives us. We do not assume the itch.io payout button on that page works.

## Steam

Steam’s store is queryable through the Steamworks Web API, not by scraping the age-gated HTML.

`IStoreService/GetAppList` returns public store apps. It takes a Web API key. `if_modified_since` limits the list to apps that changed after a timestamp, which is the daily delta. Results page by app id (`last_appid`), and the call can ask for games only. Documentation: `https://partner.steamgames.com/doc/webapi/IStoreService`.

The list does not, by itself, say “this game is sexually explicit.” A second read of the app’s store details checks the adult-only sexual content descriptor and the age rating. Games without that descriptor never enter the adult queue. Games with it still wait for the content-line review, because Steam’s own July 2025 rule removed some adult titles and left the boundary vague. We link to `https://store.steampowered.com/app/<appid>`. The player buys from Steam. We do not rehost the depot.

There is also an unversioned store search endpoint, `https://store.steampowered.com/api/storesearch/`, used for lookup by name. It is a search box, not the daily “what changed” feed. `GetAppList` with `if_modified_since` is the feed.

## Affiliate programs

These are the links that pay. A plain Steam or itch.io URL sends the player away and earns nothing unless that merchant has us in an affiliate program.

Nutaku’s public listings through 2026 show the shape of the offer, not a rate we can budget:

- Revenue share on purchases. One listing described a 20% base with tier bonuses. Another, dated October 2026, showed a 60% CPS offer limited to ten countries (AU, AT, CA, FR, DE, JP, SE, CH, GB, US), single opt-in, account created and activated, no incentivized traffic.
- An older tiered listing paid a small flat fee per activated account, about €0.16–€0.24, and was later marked inactive.

The signed offer is the number. Cookie length, countries, minimum payout, and banned traffic sources are part of the same contract. Manager approval comes before the links work.

After approval, the dashboard is the source of links: tracking URL, the name they want on the row, and the creative they allow us to show. If the dashboard has a product export, the daily job reads that export. We do not scrape `nutaku.net` to reconstruct their catalog. Nutaku’s own platform rules also tell their game partners not to send Nutaku players off to other stores. Our catalog links to Nutaku. We do not frame Nutaku inside our page.

The same pattern applies to any other program we join. No export means we add their games by hand from the creative kit.

## Developers

A form on our site: official URL, contact, platforms. That submission is a candidate, same queue, same content check. It is how a game with no feed gets a row, and it is how a developer later asks us to host a build. Hosting still requires the written license in `docs/considerations.md`. The form does not grant it.

## What a candidate row contains

```text
source, external_id, title, outbound_url, first_seen_at, raw_flags
```

Review promotes it to a public row: platforms, tags, official URL, affiliate URL if we have one, and where the artwork came from. The image is an affiliate creative or a plain typographic card. We do not hotlink their CDN, and we do not save their screenshot gallery.

Dedupe is source plus external id. A weekly pass drops public rows whose URL starts failing. The job identifies itself, goes slowly, and stops when robots.txt or the site’s terms disallow automated reading. No login bypass, no age-gate bypass, no binaries.

## Order

1. itch.io `new.xml` into the queue.
2. Steam `GetAppList` plus the adult descriptor, once we have a Web API key.
3. Affiliate tracking links after each program approves the account.
4. The developer form for everything else.

That is the whole acquisition path for version 1.
