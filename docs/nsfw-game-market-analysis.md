# Market analysis: stores for adult mobile and desktop games

**Date:** 10 October 2026  
**Product context:** a store dedicated to adult (18+) mobile and desktop games.  
**Scope:** legal fictional adult games whose characters are unmistakably adults. This is a product and market note, not legal, payments, or tax advice. Policies in this category changed several times between 2024 and 2026; check the primary policy page before building against any rule below.

## What the market actually is

Adult games are a real commercial category with two different businesses sitting on the same audience.

1. **Premium and episodic games.** Players pay for a finished build, a season, or early access. The common path is a public demo, monthly supporter builds, then a store release. Visual novels, dating sims, and story RPGs dominate. Steam is the large general audience. itch.io, DLsite, and publisher shops (JAST USA, MangaGamer, and similar licensors) are the specialist shelves.
2. **Free-to-play live games.** Players install or open a browser build for free and pay inside the game. The successful loops are the same ones that worked in mainstream mobile: character collectors, idle and clicker games, merge, battlers, management sims, card games, and lighter 4X. Anime-style art is the default visual language. Nutaku and EROLABS are the stores built for this model.

Both businesses are shut out of the shelves most phone users expect. Google Play does not allow pornography or apps meant to be sexually gratifying. Apple’s App Store does not carry this catalog either. “Mobile” here means a mobile browser, a sideloaded Android store, or a Windows client that also runs on a desktop. In the EU, the Digital Markets Act has allowed alternative iOS marketplaces to distribute adult apps Apple will not sell (Hot Tub, an adult browser, was notarized and listed on AltStore PAL in February 2025). That is a browser precedent, not an adult game store, and it is limited to the EU.

There is no public, audited size for the whole category. The distributors are private, and the usual mobile intelligence tools do not cover them. The figures below are dated operator statements or secondary writeups of store documents. They are good enough to see the shape of the market. They are not good enough to forecast revenue.

## Who is selling, and what they are good at

| Operator | Role | Where the game runs | How money moves | What is working |
| --- | --- | --- | --- | --- |
| Steam | Largest general PC store. Adult games are allowed if labeled and age-gated, and hidden until the player opts in. | Windows, macOS, Linux clients | $100 Steam Direct fee per product, recouped after $1,000 in adjusted gross. Standard store share is 30%. | Reach, reviews, wishlists, updates, cloud saves, early access. The default destination for a finished Western premium game. |
| itch.io | Open indie store. Developer sets the revenue share; the default is 10%. | Download, browser | Developer-chosen cut. Paid adult checkout still depends on PayPal, Stripe, and Payoneer, and Stripe does not support adult content. | Fast publishing, pay-what-you-want, demos, and a catalog of small games. Best as a demo and direct-download shelf, weakest as a reliable paid-discovery shelf after July 2025. |
| Nutaku (Aylo) | Specialist adult game platform and publisher. About 1,000 games as of June 2024, most of them premium, with about 100 free-to-play. The business focus is free-to-play. | Browser, download, Android sideload store | Platform agreement. In-game purchases through platform currency (“Gold”). | Organic traffic, launch featuring, a wallet, and live-ops games. Reported top free-to-play titles at about $1 million gross per month (Nutaku, June 2024). Registered accounts were reported at 50 million in early 2020. |
| EROLABS | Specialist platform aimed at free-to-play adult games, plus manga and photobooks. About 50 free-to-play titles as of June 2024; the published slate has kept growing through 2026. | Browser, Android, Windows, and some iOS builds; cloud play in the browser | Platform SDK and regional payment methods, including local methods and crypto, per EROLABS’ developer materials. | Same live-service catalog as Nutaku (several of the same games), with stronger emphasis on East and Southeast Asian languages and on instant browser play. |
| DLsite | Japanese self-publishing store for games, comics, and audio since 1996. Adult work is the core, not a filter. More than 9 million users reported in 2022. | Download | Price steps of ¥100. A published example: a ¥1,000 work pays the creator ¥600 plus tax; at ¥4,400 and up the creator share is about 78–80%, before non-resident withholding. | Tag culture, doujin volume, English storefront, and translation programs. The place Japanese-style premium games already sell. |
| FANZA / DMM | Major Japanese commercial adult store (games, anime, books). Separate from the doujin economy. | Download and browser | Retail and platform deals | Commercial eroge and browser games with production budgets above typical doujin. |
| JAST USA, MangaGamer, and peers | Publishers that license, translate, and sell, mostly Japanese visual novels. | Download from their own shops, often also Steam | Publishing contract | English localization as the product. A developer does not self-serve onto these shelves. |
| Patreon, SubscribeStar Adult, pixiv FANBOX | Development funding, not storefronts. | Builds delivered to supporters | Patreon: new pages reported at 10% plus processing (September 2026 secondary writeup). SubscribeStar Adult: 2026 secondary writeups put the platform fee around 5–10% before payment costs. | Monthly builds for multi-year games. The funding layer underneath most long-running Western premium projects. |
| Developer’s own site | Full control of price, page, and customer list. | Direct download | Specialist adult processors (CCBill, Segpay, Epoch, Verotel, and similar). Fees are higher than ordinary card rates. Stripe will not take the account. | The channel nobody else can delist. Weak at discovery unless the developer already has an audience. |

Smaller or selective shelves matter less for a new store’s design, but they show the edges. GOG sells some adult games by invitation and without DRM. The Epic Games Store does not take games that are Adults Only for sexual content. Consoles do not license that rating. Johren has operated as an English portal for Japanese adult browser games, in the same lane as Nutaku’s browser catalog.

Nutaku’s November 2025 public top 30 (App2Top interview) was almost entirely live-service anime games: collectors, idle games, management sims, and battlers. Seven of those thirty were attributed to Russian-speaking teams, which matches the wider pattern that mainstream studios are entering with reskins and with new projects built on existing technology.

## What the operators do that works

### They sort by desire, then by genre

A general store sorts by genre, tags, and “more like this.” A specialist adult store has to sort by sexual content as a first-class facet: art style, pairing, perspective, tone, fetishes, length, and whether the build is censored. DLsite’s doujin culture and Nutaku’s tag browse both do this. Steam can describe sexual content, but adult pages stay behind an opt-in, so sexual browsing is a second-class mode on the biggest store.

Rankings that players trust are simple: top grossing, new, and updated. Nutaku’s own advice to new developers is to study the revenue top when no sale is running. That list is the design spec for the free-to-play shelf.

### They remove the install before they remove the friction of paying

Browser play is the lowest-friction way onto a phone or a laptop. EROLABS sells cloud play for the same reason: a player who never installs is a player who can convert inside the session. Downloadable Windows builds still matter for premium games and for anything the browser cannot run well.

On Android, the working pattern is a first-party store app distributed as an APK, outside Google Play. Nutaku’s Android app is that pattern: the store installs, the player grants install permission, and later games install from Nutaku’s servers. The store is the trust layer. Random APK sites lose to a signed store that updates itself and the games.

### They own checkout

Nutaku Gold and equivalent platform wallets mean the game never has to hold a card. The player buys currency once, and every game spends it. That is also how the platform takes its share and how it can offer the same payment methods to every title. EROLABS’ pitch to developers is the same idea: one SDK, many local payment methods.

Premium stores work differently. Steam, itch.io, and DLsite charge per build. The lesson is to support both receipts: a wallet for live games, and a one-time (or seasonal) purchase for story games.

### They feed live games a content calendar

Adult free-to-play players consume new characters, scenes, and events faster than a mainstream live-ops audience. Nutaku’s June 2024 interview treated three months of ready live-ops content at launch as the bar, not a bonus. The December 2025 interview said the same thing more sharply: day-one retention on a competent soft launch is unusually high, and production quality (art direction, UX, animation, a coherent world) now separates games that last from games that spike.

The loops that already pay are not a mystery. They are mainstream mobile loops with adult characters and scenes as the reward: gacha collectors, idle and clicker, merge, battlers, management, card games, and occasional strategy. “Adultifying” a weak mainstream game is a known entry path. It sometimes multiplies revenue and sometimes does not. New games from mainstream teams are showing up beside the reskins. In June 2024, Nutaku said about 70% of the free-to-play projects then expected were from studios known for mainstream work. Those studios often stay quiet, because an explicit catalog is a problem for their Google Play and App Store relationships.

### They fund long story games before the store release

Western narrative hits are usually paid for twice. Supporters pay monthly on Patreon or SubscribeStar for early builds. When the game is far enough along, a paid version lands on Steam, and the existing supporters are pointed at the next project. A 2023 FDG paper on indie adult-game ecosystems documented that Patreon-then-Steam sequence across several of the best-funded projects. The store did not replace the subscription. The subscription made the game long enough to deserve a store page.

What players pay for on this shelf is a demo that proves the writing and the art, a steady build cadence, and a clear “this version is the one you buy” moment. Early access on Steam is that moment for a lot of teams.

### They treat English and Japanese as two storefronts, not a subtitle track

DLsite is where Japanese creators already upload. Steam and Patreon are where English-speaking narrative players already browse. Publishers such as JAST USA and MangaGamer exist because translation, age-gate paperwork, and a local audience are a business of their own. EROLABS markets ten interface languages and culturally adapted text, not raw machine translation. A new store that only speaks one language is choosing one of these audiences on purpose.

Japanese domestic law is why many of those games ship with a mosaic and an uncensored export build. A store that sells both needs a censor flag on the build, not a single file that is wrong in one of the two markets.

### They keep a direct line to the player

From 2024 through 2026, every major shelf changed its adult rules because of payment companies. DLsite suspended Visa, Mastercard, and American Express in April 2024; by late 2025, secondary reporting still described JCB as the remaining card brand. In July 2025, after an Australian campaign asked card networks to cut off Steam and itch.io, Valve added a rule against content that may violate payment-processor standards and removed a set of adult games, largely titles with incest themes. itch.io deindexed adult content, restored free adult browsing about a week later, and said paid adult content would return slowly. As of October 2026 there was still no clear public announcement that paid adult discovery on itch.io was back to its old state, though some paid adult pages were observable again by September 2026.

The developers who kept selling were on more than one shelf and had a mailing list or a site of their own. That is the practical response to platform risk.

### They publish the line, and they stay inside it

The stores that still take cards now refuse the same themes, with slightly different wording:

- any sexual content involving minors, or characters presented as minors, including “barely legal” framing
- non-consensual sexual content, including fictional rape and coercion, on the shelves that have written it down (itch.io is explicit; card-network brand rules push the others the same way)
- incest
- bestiality
- sexually explicit images of real people (Steam’s rule)

Patreon’s Adult/18+ rules, finalized in March 2026, require illustrated and animated characters to be unmistakably adults. SubscribeStar tightened fictional themes in March 2026 and then said the wording was ambiguous and would be reworked, again citing payment partners. Steam also blocks live-generated AI adult sexual content for the moment, even where static adult games are allowed.

A store that wants mainstream card payments has to make this list visible to developers before upload. A store that wants games outside the list has to live without Visa and Mastercard. That tradeoff is the whole recent history of the category.

## Where a new store can fit

The shelves that exist each fail a job the others do well.

- **Steam** has the players, the updater, and the reviews. Adult games are opt-in, country-blocked in places, and subject to an undefined payment-processor rule. It is a poor phone store.
- **itch.io** is the easiest place to publish a demo. Paid adult discovery is unreliable, and the payment stack is not built for this category.
- **Nutaku** is the proven free-to-play platform, with traffic and an Android installer. Premium games are still accepted and are not where the company is focused. The catalog is partnership-gated.
- **EROLABS** overlaps Nutaku’s free-to-play catalog and adds browser cloud play and Asian language operations. It is not a home for episodic Western story games.
- **DLsite** is the premium doujin shelf and the Japanese audience. Western card checkout has been broken since 2024. Live-service games are a thin slice of a huge download catalog.
- **Patreon and SubscribeStar** fund production and do not install, update, or merchandise a library.
- **Official mobile stores** are closed to the explicit build. Sideload trust and update friction are the unsolved mobile problems.

The open position is a dedicated library for adult games that treats phone and desktop as equal clients: signed Android install, desktop download, and browser play, with one account across them. The catalog has to carry both shelves, because the audience overlaps and the operators do not. Free-to-play needs a wallet, featuring, and a live-ops cadence. Premium needs demos, versioned builds, reviews, and a path from supporter funding to a paid release. Neither shelf needs Google Play.

Discovery is the other gap. Sexual tags, “updated this week,” and revenue-based charts are how players already choose on specialist sites. A general-store layout with an adult toggle will feel like Steam’s filter, which is exactly the experience a dedicated store exists to replace.

Payments are the constraint on that position, not an afterthought. Plan the processor, the age gate, the refund policy, and the prohibited-theme list as part of the store, and assume a card brand can leave. Japanese local methods kept DLsite alive after Visa and Mastercard left. A Western store needs more than one way to take money before launch.

## Implications for this product

Design the first version as a store, not as a single game and not as a Patreon clone.

- **Two shelves, one account.** Live-service games with a platform wallet, and premium or episodic games with a straight purchase. Browser, Android sideload, and desktop download from the same library.
- **A first-party Android installer.** The store app is the product on phones. Games install and update through it. The explicit build does not go to Google Play or the App Store.
- **Browse by sexual tags and by freshness.** Genre is secondary. Ship content descriptors, an 18+ gate, and player filters on day one.
- **Curate the opening catalog.** Volume of low-effort premium games does not pay on Nutaku, and the free-to-play winners are a short list of well-operated live games. A new store gets further with a small set of games that already have an audience than with an open upload firehose.
- **Give developers a reason to multi-home.** They will keep Steam and Patreon. Offer them something those two do not: phone install, sexual-tag discovery, and a wallet, with a written content policy that matches what card networks already enforce.
- **Own the player list.** Email or an equivalent direct channel sits beside the account system, because every incumbent shelf has already shown it can change the rules.
- **Match the quality bar that is already rising.** The 2025 Nutaku postmortem is blunt: art direction, UX, animation, and a real update plan beat a thin reskin. The store should feature games that meet that bar.

## Sources

Figures and policy descriptions come from the pages below. Operator interviews are attributed to the speaker and the date. Secondary guides are used where they quote store documents; they are not treated as the store’s own contract.

- Andrey Postnikov (Nutaku), interview, WN Hub / App2Top, 24 June 2024. Catalog counts, the $1 million top-grossing claim, live-ops expectations, organic traffic, and the Steam release-volume comment. [https://wnhub.io/news/analytics/item-43901](https://wnhub.io/news/analytics/item-43901)
- Andrey Postnikov (Nutaku), 2025 retrospective, App2Top, 15 December 2025. November 2025 top 30, audience notes, and the shift toward cross-platform live games. [https://app2top.com/2025-in-video-games/many-studios-have-begun-to-view-adult-games-as-a-growth-channel-said-andrey-postnikov-from-nutaku-on-the-results-of-2025-286378.html](https://app2top.com/2025-in-video-games/many-studios-have-begun-to-view-adult-games-as-a-growth-channel-said-andrey-postnikov-from-nutaku-on-the-results-of-2025-286378.html)
- Veilwright Studio, “Where adult games can be sold in 2026,” 2 October 2026, updated 7 October 2026. Comparison of Steam, itch.io, DLsite, Nutaku, Patreon, SubscribeStar, and direct sales, with links back to store documents. [https://veilwrightstudio.com/journal/where-to-sell-adult-games/](https://veilwrightstudio.com/journal/where-to-sell-adult-games/)
- naughty.games, “How to make money from an adult game in 2026,” checked against the October 2026 state of itch.io and DLsite payouts. [https://naughty.games/guides/make-money-from-adult-games](https://naughty.games/guides/make-money-from-adult-games)
- Steamworks: onboarding rules and the Steam Direct fee; content-warning / age-gate documentation; content survey, including the current refusal to ship live-generated AI adult-only sexual content. [https://partner.steamgames.com/steamdirect/](https://partner.steamgames.com/steamdirect/) and [https://partner.steamgames.com/doc/gettingstarted/contentsurvey](https://partner.steamgames.com/doc/gettingstarted/contentsurvey)
- Ars Technica, 23 July 2025, on Steam’s payment-processor rule and the accompanying delistings. [https://arstechnica.com/gaming/2025/07/steam-cracks-down-on-some-sex-games-to-appease-payment-processors/](https://arstechnica.com/gaming/2025/07/steam-cracks-down-on-some-sex-games-to-appease-payment-processors/)
- The Guardian, 29 July 2025, on the Collective Shout campaign and itch.io’s deindexing. [https://www.theguardian.com/world/2025/jul/29/mastercard-visa-backlash-adult-games-removed-online-stores-steam-itchio-ntwnfb](https://www.theguardian.com/world/2025/jul/29/mastercard-visa-backlash-adult-games-removed-online-stores-steam-itchio-ntwnfb)
- Google Play sexual content and profanity policy. [https://support.google.com/googleplay/android-developer/answer/9878810](https://support.google.com/googleplay/android-developer/answer/9878810)
- Nutaku Android store download requirements (sideloaded store app, Android 5.0+). [https://www.nutaku.net/mobile-app-download/](https://www.nutaku.net/mobile-app-download/)
- Reuters, 3 February 2025, on the first Apple-notarized porn app reaching EU iPhones through an alternative marketplace. [https://www.reuters.com/technology/apple-raises-concern-over-first-porn-app-iphone-under-eu-rules-2025-02-04/](https://www.reuters.com/technology/apple-raises-concern-over-first-porn-app-iphone-under-eu-rules-2025-02-04/)
- EROLABS developer overview (languages, payments, cloud play). [https://developers.ero-labs.org/en/index.html](https://developers.ero-labs.org/en/index.html)
- Sihvonen and Harviainen, “Ecosystems of indie porn game development,” FDG 2023. Patreon-funded development followed by a Steam release. [https://dl.acm.org/doi/fullHtml/10.1145/3582437.3587176](https://dl.acm.org/doi/fullHtml/10.1145/3582437.3587176)
