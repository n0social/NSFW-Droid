# Inbound discovery playbook (social & traffic)

**Last updated:** 17 October 2026  
**Operating mode:** **They come to us** — automation and the site do the work; **no expectation** that you run Mastodon/Twitter-style engagement.  
**Account:** [@nsfwdroid@mastodon.social](https://mastodon.social/@nsfwdroid)  
**Site:** [https://www.nsfwdroid.com](https://www.nsfwdroid.com)

Fediverse rules and where adult-game creators host **will change** — bump the date when you edit.

**Technical setup (OAuth, cron, outbox):** [social-mastodon-pillowfort.md](social-mastodon-pillowfort.md)  
**Newsletter (Friday, Exim on droplet):** [newsletter-manual-test.md](newsletter-manual-test.md)  
**Adult game directories (The Porn Dude–style lists):** [directory-submissions.md](directory-submissions.md) — **priority reminder** + example outreach email  
**Product context:** [reward_program.md](reward_program.md)

---

## When you forget (60-second version)

You are **not** forgetting to “do social.” You only need to remember what **already runs**:

1. **Ingest** (3×/day) → new listings on the site.  
2. **Mastodon drain** → public posts with title, **game link**, cover, hashtags (discovery beacon, not a conversation account).  
3. **Friday newsletter** → opted-in members get top picks (return traffic).  
4. **Site** → browse, search engines, game pages, outbound store links.

**Priority when you have time (not social):** contact **NSFW game catalog directories** — see [directory-submissions.md](directory-submissions.md) (tracking table + copy-paste email). Aim for a few pitches per quarter, not daily work.

**Optional, rare:** once a quarter, skim [Ops checklist](#ops-checklist-quarterly-optional-10-min) so logs/DNS are healthy. That is infrastructure, not “posting on social.”

---

## What “they come to us” means here

| Inbound path | How visitors find you | Your effort |
| --- | --- | --- |
| **Search (Google, etc.)** | Game titles, tags, listing pages | Keep ingest + site up; no social posting |
| **Direct / bookmark** | `nsfwdroid.com`, newsletter links | Footer signup + Friday email |
| **Mastodon hashtag browse** | Someone searches `#nsfwgames`, `#visualnovel`, sees your **automated** drop | Bot only; profile is a landing page with site link |
| **Fediverse profile** | `discoverable` / `indexable` account; bio + header point to site | Set once (see social doc); no daily checks |
| **Dev or player shares** | They link your game page or boost your bot post | Passive; you do not need to follow them first |
| **Newsletter forward** | Subscriber shares an issue | Double opt-in list on site |
| **Adult directory listings** | Someone finds you on a “best NSFW games” / catalog list | Manual outreach — [directory-submissions.md](directory-submissions.md) |

**Not in scope for you:** following accounts, replying, boosting, Discord/Reddit campaigns, or “building community” on Mastodon. Those can help **if** you ever want them; they are **not** required for this strategy.

**Honest expectation:** Inbound-only on Mastodon is **slow** (few followers, hashtag noise). The main job of the account is a **steady, legitimate catalog signal** — not viral growth. Traffic you care about should lean on **site + SEO + newsletter + store outbound clicks**, with Mastodon as a free extra surface.

---

## What runs without you

| System | Role in inbound model | Where to check |
| --- | --- | --- |
| **Mastodon bot** | Publishes new games; each post links to `https://www.nsfwdroid.com/game/{slug}` | `/var/log/nsfwdroid-social.log`; [@nsfwdroid](https://mastodon.social/@nsfwdroid) |
| **Catalog ingest** | Fresh inventory = SEO + “new” rails | `/api/health` |
| **Weekly newsletter** | Brings **returning** visitors who opted in | Friday 9pm US Eastern; `/var/log/nsfwdroid-newsletter.log` |
| **Analytics on site** | Views/clicks on listings (rails, admin) | Admin traffic |
| **Affiliate / outbound** | Revenue when they leave for stores | `/api/go` |

---

## How automated Mastodon supports inbound (not engagement)

Each drain post is a **small ad** on the fediverse:

- **Link** → your canonical game page (not itch/Steam directly — your catalog owns the click path).  
- **Cover** → same image as on-site cards (`MASTODON_ATTACH_COVER=1` by default).  
- **Hashtags** → `#nsfwgames` plus title-based tags (`#visualnovel`, etc.) for timeline search.  
- **Sensitive media** → marked when a cover is attached (instance-friendly).  
- **Profile** → site URL in bio and profile field; Vesper branding = recognizable if someone lands on the account.

Nobody has to follow you for a hashtag searcher to see **one** post. Followers are a bonus, not the plan.

---

## Inbound traffic loop (no manual social step)

```text
Ingest new listing
    → Game page live (SEO, browse, shareable URL)
    → Mastodon post (optional fediverse discovery)
    → Visitor clicks through to site
    → Newsletter signup / favorites / outbound to store
Friday newsletter
    → Return visit to site (not to Mastodon)
```

---

## Ops checklist (quarterly, optional ~10 min)

Only for **when something breaks** or you have not looked in months. Not “social media time.”

- [ ] `curl` or browser: `/api/health` OK on production.  
- [ ] Tail `/var/log/nsfwdroid-social.log` — no burst of `failed` outbox rows.  
- [ ] Spot-check [@nsfwdroid](https://mastodon.social/@nsfwdroid): recent posts have links + covers.  
- [ ] If newsletter matters: one `--dry-run` or DNS check per [newsletter-manual-test.md](newsletter-manual-test.md).  
- [ ] Glance admin **outbound clicks** / views — trend over months, not daily.

**Calendar title suggestion:** `NSFW Droid — quarterly ops (10 min)` — **not** “social media.”

Optional same quarter: `NSFW Droid — directory outreach (30 min)` — pick one list from [directory-submissions.md](directory-submissions.md), send the example email if it fits.

---

## Instance & rules (set-and-forget unless you move)

Home instance today: **mastodon.social**. Inbound posts still federate; some servers limit what they show from large instances.

| If… | Then… |
| --- | --- |
| Everything works, mods leave you alone | **Do nothing** — stay inbound-only |
| Posts removed or account limited | Read instance rules; consider migrating to an NSFW-tolerant server ([social-mastodon-pillowfort.md](social-mastodon-pillowfort.md)) |
| Creators cluster on another instance | Optional **future** move for discovery; still no manual engagement required |

Revisit when the fediverse landscape shifts (see revision log).

---

## Pillowfort & other silos

| Platform | Inbound fit | Effort |
| --- | --- | --- |
| **Pillowfort** | Extra discovery if you create an account | **Manual** only; skip unless you want another passive mirror |
| **Discord / Reddit / X** | Can drive traffic | **Out of scope** for this playbook — you said you will not run them |

---

## Metrics that matter for inbound (not follower count)

| Metric | Why |
| --- | --- |
| **Outbound clicks** / **listing views** | People reached your catalog and acted |
| **Newsletter confirms** | Opt-in return channel working |
| **Ingest + social errors** | Automation still publishing |
| Mastodon followers | Nice to have; **not** a goal for this mode |

---

## Troubleshooting

| Problem | Likely cause | Fix |
| --- | --- | --- |
| No Mastodon posts | Env off, drain limit 0, unhealthy catalog | [social-mastodon-pillowfort.md](social-mastodon-pillowfort.md) |
| Posts without images | Cover fetch failed | Log: `mastodon_cover_skipped` |
| “No engagement” on Mastodon | **Expected** in inbound-only mode | Not a failure; check **site** metrics instead |
| Newsletter not sending | `NEWSLETTER_ENABLED`, Exim/DNS | [newsletter-manual-test.md](newsletter-manual-test.md) |

---

## Appendix: optional manual social (only if you change your mind)

If you ever want **extra** fediverse reach beyond automation, these help — **none are required:**

- Boost your own bot post with one sentence of context.  
- Follow a few devs you already list.  
- One pinned intro toot on the account.

If you are not doing this, **ignore this appendix.**

---

## Revision log

| Date | Change |
| --- | --- |
| 2026-10-17 | Initial playbook (included weekly manual social — superseded same day) |
| 2026-10-17 | Reframed for **inbound / they come to us**; removed expectation of manual Mastodon work |
| 2026-10-17 | Linked [directory-submissions.md](directory-submissions.md) (game-catalog directories + example email) |
