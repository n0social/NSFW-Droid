# Considerations: getting the right to distribute

**Date:** 10 October 2026  
**Product context:** an adult (18+) game catalog. The first version links out. Later versions may host builds on DigitalOcean Spaces and deliver them through the store’s own Android app and desktop downloads.  
**Scope:** how a listing becomes legal to show, and how a file becomes legal to host. This is a product note, not legal advice. Have a lawyer draft the developer terms and any distribution agreement before the first hosted build goes live.

## Three permissions, three deals

A store listing needs up to three separate permissions. Getting one does not include the others.

| Permission | What you are allowed to do | What creates it |
| --- | --- | --- |
| Link | Send the player to a page the rights holder already operates | The page is public, or an affiliate program gives you a tracking URL |
| Promote | Use the name, logo, and approved artwork on your pages and in ads | An affiliate creative kit, or a written trademark and artwork license |
| Distribute | Copy the build onto your storage and deliver it to players | A written copyright license that names the build, the platforms, and the territory |

The first version of this store only needs the first row, and the second row wherever a banner or screenshot appears. Hosting an APK, a Windows build, or a browser package on our object storage (DO Spaces) is the third row. A public download button on someone else’s site is not that license. A Steam page, an itch.io page, a Discord “feel free to share,” or a file already circulating on a mirror is not that license either.

## Phase 1: links and artwork

While the catalog only links out, do not put game binaries in Spaces, GitHub, or the store app.

1. **Official URL.** Point at the developer’s or publisher’s own page, or at the store they already sell on (Steam, itch.io, DLsite, Nutaku, their site). The player downloads from them. You are sending traffic, not copying the game.
2. **Affiliate URL, when one exists.** Nutaku and similar programs pay for a referred registration or a referred purchase. The program’s current offer states the rate, the countries, the cookie, and the banned traffic sources. Typical bans include incentivized clicks. Read that offer before spending on ads. Listings in October 2026 showed both revenue-share and per-registration offers, and the numbers differ by network and tier, so the contract you sign is the number that counts.
3. **Artwork.** Use the images the affiliate program or the developer gives you for promotion. If there is no kit, ask before you crop a screenshot onto your homepage. A link to their page is a smaller rights question than republishing their art.
4. **Record the basis for every row.** Each game in the database stores `official_url`, optional `affiliate_url`, who approved the artwork, and the date. If the answer is “we found the APK,” the row does not go up.

An affiliate agreement is a promotion agreement. In the usual structure the sale, the file, the refund, and the player account stay on the merchant’s side. Treat “we are an affiliate” as permission to link and to use the supplied creatives. Treat it as permission to rehost the build only if the written terms say so in those words.

## Phase 2: hosting a build

You host a file only after the person who controls the copyright gives you a license to reproduce and distribute that file. The practical ways to get that license:

- **The developer accepts your upload terms.** They create an account, upload a build, and agree that they are granting you a non-exclusive license to store, transmit, and display that build and its listing. This is the scalable path. The terms have to exist before the first upload, and the acceptance has to be stored (account, timestamp, version of the terms).
- **A one-off distribution agreement.** Worth it for a game you are featuring, advancing money against, or localizing. Same license, negotiated: share, territory, term, who sets the price, who handles refunds.
- **A publisher who already holds the license.** Some English releases of Japanese games are controlled by JAST USA, MangaGamer, or a similar licensor. The developer’s wish is not enough. The contract has to be with whoever owns the distribution right in your territory.

You cannot get this right by being an affiliate, by embedding their page in an iframe, or by hotlinking the file on their server.

### What the license has to cover

The grant should be boring and specific.

- **Copyright.** A non-exclusive license to reproduce, store, and distribute the submitted builds, patches, and listing text. Exclusive rights cost more and block the developer from Steam and Patreon, which is where most of them already make money. Start non-exclusive.
- **Name and art.** A license to use the title, logo, and screenshots in the store, in the Android app, and in marketing you actually run.
- **Platforms.** Name them: your website, the sideloaded Android store app, Windows, macOS, and browser play. A license that says “Steam” does not cover your APK.
- **Territory.** Worldwide unless the developer carves out a country. Some Japanese licenses exclude Japan, or require the mosaic build there and the uncensored build only for export.
- **Term and end.** A start date, a renewal, and what happens to installed copies and to the file in Object Storage when the deal ends. Delete the object. Stop new downloads. Say whether players who already downloaded may keep playing.
- **Money.** The share, when you pay, what “net” subtracts (refunds, chargebacks, tax you are required to withhold), and a right for the developer to see the unit count.
- **Updates.** Who uploads a patch, how fast a broken or non-compliant build comes down, and that each new build is covered by the same license.
- **Price.** Who sets it. On a link-out row this is their problem. On a hosted row it is yours to agree.

### What the developer has to promise

The license is worthless if they do not own what they uploaded. The terms should include warranties that:

- They own the game or have every license they need, including music, fonts, plugins, and third-party art.
- Every character in sexual content is an adult, written and drawn as an adult.
- The build does not include the categories our hosting AUP (DigitalOcean, see `docs/hosting.md`) and card networks already refuse: sexual content involving minors or characters presented as minors, non-consensual sexual content, incest, bestiality, and sexually explicit images of real people.
- They will tell you if a claim arrives, and they will cover your losses if the warranty is false.

Keep the content rules in the developer terms even when a developer offers a game outside them. A file you cannot show under DigitalOcean’s Acceptable Use Policy (20 March 2026) or under a payment partner’s rules, is a file you should not accept.

### Operations that make the right real

- Store the accepted terms version on the developer account.
- Store a hash of each accepted build next to the license record.
- Serve downloads from Spaces with a short-lived link, after the age gate.
- Publish a copyright complaint contact. If developers can upload, follow a DMCA-style notice and a repeat-uploader ban even before a lawyer tells you the formal agent registration is due.
- Take the file down first when a complaint names a specific build. Sort out the contract afterward.

## Order of operations

1. Ship the catalog as links. Record the URL and the artwork source for every game.
2. Join the affiliate programs whose games you want to feature. Use their links and their creatives.
3. Have the upload terms written, then open hosting to developers who accept them.
4. Use a negotiated agreement only when the game is important enough to bargain over share, territory, or an advance.

Until step 3 is done, the store does not distribute games. It distributes links.
