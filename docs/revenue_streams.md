# Revenue streams

**Date:** 10 October 2026  
**Product context:** an adult (18+) game catalog. Phase 1 links out from a site on Vultr and does not host builds. Phase 2 hosts builds the store has a license to distribute. See `docs/considerations.md` for how that license is obtained.  
**Scope:** where money can come from, what has to be true first, and which familiar ad products do not apply. Rates below are examples from public listings, not a forecast. The signed offer is the rate.

## Phase 1, while the store only links out

You do not take a cut of a sale you do not process. Money comes from sending a player somewhere that pays you, or from selling attention on your own pages.

### Affiliate revenue share and per-action fees

This is the stream that matches a link catalog.

The player clicks a tracking link, registers or buys on the other platform, and that platform pays you. Nutaku’s public affiliate listings in 2026 show both shapes: a revenue share on purchases (one older listing described 20% as a base, with tier bonuses; another network listing in October 2026 showed a 60% CPS offer limited to ten countries) and a small fixed fee per activated account (about €0.16–€0.24 on a tiered listing that was later marked inactive). Minimum payouts, cookies, and banned traffic (no incentives, sometimes no brand bidding) are part of the same offer. Expect manager approval before the links work.

What you need:

- One `affiliate_url` per game, stored next to the official URL.
- A disclosure on the row that the link is paid.
- Traffic they accept. Buying random adult clicks and hoping for a bounty usually violates the offer and does not survive their review.

A game with no affiliate program earns nothing from the click. Keep the link if the page is a useful official destination, and make money on that page from ads or a sponsorship instead.

### Adult display and native ads

Sell space on the catalog to an adult ad network. ExoClick and TrafficJunky are the networks already used around this category. They pay for impressions and clicks from advertisers who are allowed to appear next to adult content.

Google AdSense does not. Google’s publisher policy refuses graphic sexual text, images, and games, and names cartoon porn and hentai as examples. AdSense on this site is a disabled account, not a revenue plan.

What you need:

- An age gate before explicit ads or explicit thumbnails.
- Enough real visits that a network will approve the property and that the check is worth more than the minimum payout.
- Placement that leaves the game list usable. A catalog buried under popunders teaches people to leave.

On a new site this stream is small. It becomes real after the catalog is a place people return to.

### Sponsored placement

A developer or publisher pays for a featured row, a newsletter mention, or a fixed week on the homepage. You invoice them. You still link to their official or affiliate URL. You still do not host the build.

This is the cleanest early money from developers who want to be found and do not have an affiliate program. Price it as a flat fee. Keep paid rows labeled. A featured slot that looks like an editorial ranking will get ignored once players notice.

## Phase 2, after you have a license to host

These start only when `docs/considerations.md` is satisfied for that game: a written license, the build in Vultr Object Storage, and a short-lived download link. Each download costs egress. Vultr’s Standard Object Storage tier is $18 a month for 1 TB stored and 1 TB out, then $0.01 per GB. A 2 GB game downloaded 500 times uses the included terabyte. The fee you keep has to clear that cost.

### Paid download commission

The player buys the build from you. You keep a percentage and pay the developer the rest, on the schedule in the upload terms or the one-off agreement. Steam’s standard store share is 30%, which is the number developers will compare you with. A new store with a smaller audience justifies a lower share, especially while you are asking them to upload a build they could also sell on Steam.

You now handle the receipt, the refund, and the chargeback. Specialist adult processors (CCBill, Segpay, Epoch, Verotel, and similar) are the ones that will consider this category. Stripe will not. Processor fees on adult merchants are higher than ordinary card rates, and the same content line applies: the themes card networks treat as brand-damaging do not get a checkout.

### Platform wallet for free-to-play

This is Nutaku’s model, and it is a later product. The player buys store currency once. Games spend that currency. You keep a share of the currency sale and the developer redeems the rest.

It fits live-service games with ongoing purchases, and it needs an SDK, fraud checks, refund rules, and live-ops games that actually retain spenders. It is a poor fit for a single visual novel. Do not build the wallet to monetize the link catalog.

## Streams that stay small until there is an audience

- **A paid membership for the store itself.** Players already pay creators on Patreon and buy games on Steam. A fee to browse your links has nothing to attach to until the hosted library is deep enough that the membership includes games.
- **A fee to list.** Charging developers to upload, before anyone is browsing, empties the catalog. Revisit a listing fee only after featured placement is selling.
- **Email sponsorship.** A list you own is worth selling against, once the list exists. Collect it from the age-gated site. The message is still an ad, so the adult-network and disclosure rules apply.

## What to turn on first

1. Affiliate links on every game that has a program, with the paid relationship disclosed.
2. One adult ad network, after the age gate, once there is traffic to show them.
3. A labeled featured row sold as a flat fee.
4. A download commission only for games under a distribution license, priced so the share clears processor fees and Object Storage egress.
5. A currency wallet only after free-to-play partners are actually shipping on the store.

The link catalog can earn from the first three. The last two wait on the right to distribute the file.
