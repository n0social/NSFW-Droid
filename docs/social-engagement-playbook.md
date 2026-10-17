# Social & traffic engagement playbook

**Last updated:** 17 October 2026  
**Account:** [@nsfwdroid@mastodon.social](https://mastodon.social/@nsfwdroid)  
**Site:** [https://www.nsfwdroid.com](https://www.nsfwdroid.com)

This doc is a **reminder system** for traffic you do not want to forget. Fediverse norms and which instances allow adult game promos **will change** as more creators show up — bump the date at the top when you edit.

**Technical setup (OAuth, cron, outbox):** [social-mastodon-pillowfort.md](social-mastodon-pillowfort.md)  
**Newsletter (Friday send, Exim on droplet):** [newsletter-manual-test.md](newsletter-manual-test.md), [deploy-droplet.md](deploy-droplet.md)  
**Product context:** [reward_program.md](reward_program.md)

---

## When you forget (60-second version)

1. **Automated (no action):** Ingest runs 3×/day → new listings can enqueue → Mastodon drain posts (title, link, cover, hashtags). Friday **newsletter** if `NEWSLETTER_ENABLED=1`.
2. **You (15 min/week):** Open Mastodon → **boost 1–2** of your own new-game posts with a one-line human comment → **follow 2–3** relevant creators or curators → reply **once** if someone engaged with you.
3. **You (monthly):** Skim admin traffic / newsletter signups → adjust who you follow → consider one **pinned** or **intro** post on Mastodon if the bio feels stale.

Traffic is mostly **follow graph + trust**, not hashtag spam. The bot announces; **you** show up as a person occasionally.

---

## What runs without you

| Channel | What it does | Where to check |
| --- | --- | --- |
| **Mastodon bot** | Up to ~3 new listings per ingest, ≤15/day; cover image by default | `/var/log/nsfwdroid-social.log` on droplet; [@nsfwdroid](https://mastodon.social/@nsfwdroid) |
| **Catalog ingest** | Fresh games in browse / new arrivals | `/api/health`, admin traffic |
| **Weekly newsletter** | Top picks email to confirmed subscribers | Friday 9pm US Eastern; `/var/log/nsfwdroid-newsletter.log` |
| **Site SEO / rails** | Hottest, new, game pages, outbound `/api/go` | Google Search Console (if configured), admin metrics |

**Not automated:** following people, joining conversations, Pillowfort, Reddit/Discord, paid ads, or choosing a better Mastodon **home instance** if you move.

---

## Weekly rhythm (pick a fixed day, e.g. Sunday)

Use this as a literal checklist. Copy into a calendar reminder titled **“NSFW Droid — 15 min social”**.

### A. Mastodon (10–15 min)

- [ ] Open [mastodon.social/@nsfwdroid](https://mastodon.social/@nsfwdroid) — confirm recent **automated** posts look right (link, cover, sensitive media if needed).
- [ ] **Boost** (repost) your best 1–2 catalog posts from the week; add a short line: *why this game is on the list*, not just the title.
- [ ] **Search** `#nsfwgames`, `#adultgames`, `#visualnovel`, `#nsfwvn` (and tags that match your ingest) — find **one** post from a dev or player you respect → **like** or **polite reply** (no drive-by link dumps).
- [ ] **Follow** up to **3** accounts: itch devs you already list, VN makers, NSFW game curators, or fediverse artists who allow promo replies. Unfollow inactive accounts later.
- [ ] If inbox empty: still post **one** manual toot monthly (see [Monthly](#monthly-rhythm-30-min) below).

**Do not:** mass-follow hundreds, auto-DM, or reply with only your homepage link on strangers’ posts (report bait).

### B. Site ↔ social (2 min)

- [ ] Footer newsletter signup works (you or a test email) — [newsletter-manual-test.md](newsletter-manual-test.md).
- [ ] Game pages load and **Play** / affiliate outbound works for one random new listing.

### C. Optional Pillowfort (5 min, if account exists)

- [ ] Mirror **one** Mastodon post manually (same copy from outbox or game page).
- [ ] Comment in **one** NSFW games thread if your instance/community has one.

---

## Monthly rhythm (30 min)

- [ ] **Admin / traffic:** note 7-day views, top outbound clicks, newsletter subscriber count (trend, not vanity).
- [ ] **Mastodon profile:** avatar, header, bio still match [social-mastodon-pillowfort.md](social-mastodon-pillowfort.md); website field = `https://www.nsfwdroid.com`.
- [ ] **Pinned or intro post** (manual, once a month or after big site change):

  > NSFW Droid lists mobile & web adult games with outbound links to stores. New drops post here automatically; weekly favorites go to the email list on the site. 18+ only. [link]

- [ ] **Instance check:** Is `mastodon.social` still the right home? (See [Instance strategy](#instance-strategy-when-creators-multiply).) If you move, update `MASTODON_INSTANCE_URL` + token on droplet — never commit tokens.
- [ ] **Deliverability:** if newsletter hits spam, run `tsx scripts/check-newsletter-dns.ts` on droplet and fix PTR/SPF/DKIM per [newsletter-manual-test.md](newsletter-manual-test.md).

---

## Instance strategy (when creators multiply)

Mastodon is not one website — it is many servers (**instances**) that federate. “Community” = **who you follow**, **who follows you**, and **which server’s rules** host your account.

| Situation | Suggestion |
| --- | --- |
| **Today** | `@nsfwdroid@mastodon.social` — large audience potential, strict mods, easy to get lost in noise |
| **More adult-game creators on fediverse** | Watch where **they** host (e.g. NSFW-tolerant instances). A second account or **migration** to a games-friendly server can outperform staying only on `.social` |
| **Before moving** | Read instance rules on adult content + **linking to your catalog**; export followers if the target supports migration; re-run OAuth on new instance |
| **Two accounts** | Optional: keep `.social` for reach + niche instance for community — only if you can maintain both without duplicate spam |

Revisit this table **quarterly** or when a creator you care about announces a new instance.

---

## Who to follow & engage (starter list — customize)

Replace these with real accounts as you discover them. Goal: **curators and makers**, not only other link directories.

| Type | Why | How to find |
| --- | --- | --- |
| **itch.io NSFW devs** | You already list them; following = visibility when they post WIPs | Search game title on Mastodon; dev links in itch pages |
| **VN / RPG NSFW communities** | Hashtag timelines | `#visualnovel`, `#nsfwrpg`, `#yuri`, `#yaoi`, `#furry` (when title fits — bot already adds some) |
| **Fediverse curators** | Boost each other’s discovery posts | Search “NSFW games”, “adult games”, “lewd games” |
| **Your newsletter readers** | Not on Mastodon by default | Encourage signup in bio; never post subscriber emails |

**Engagement rule of thumb:** for every **10** automated catalog posts, aim for **≥1** human action (boost with comment, reply, or follow) so the account is not a pure link bot.

---

## Hashtags (bot + you)

The drain script always adds **`#nsfwgames`** and may add title-based tags (`#visualnovel`, `#yuri`, etc.). You can add **one** extra tag manually when boosting if it fits — do not stack ten tags.

| Tag | Use when |
| --- | --- |
| `#nsfwgames` | Default catalog drops |
| `#adultgames` | Manual boosts / community posts |
| `#visualnovel` / `#nsfwvn` | VN listings |
| `#indiegame` | Safer on mixed-audience instances (still mark sensitive media) |

Hashtag reach **shrinks** as tags get spammed; **follows and boosts** matter more over time.

---

## Pillowfort & other silos

| Platform | Status | Your job |
| --- | --- | --- |
| **Pillowfort** | No API in repo; pro-NSFW | Manual account + optional community; mirror 1–2 posts/week |
| **Discord / Reddit** | Out of scope in automation | Only if you already moderate a server; link in bio, not auto-post |
| **X / Twitter** | Out of scope | Optional single weekly “what’s new” — easy to forget; skip unless committed |

---

## Traffic loops (how pieces reinforce each other)

```text
New game ingested
    → Mastodon post (discovery)
    → Game page on site (SEO, shares)
    → Member favorites / analytics (rails)
    → Friday newsletter (returning visitors)
    → You boost on Mastodon (second chance in followers’ timelines)
```

**Newsletter CTA in Mastodon bio** is already in the default note template. Repeat the signup link when you write a **manual** monthly intro post.

---

## Metrics worth a glance (not daily)

| Metric | Where | “Good enough” signal |
| --- | --- | --- |
| Mastodon followers | Profile | Slow growth beats zero; spikes after a dev boosts you |
| `listing_view` / `outbound_click` | Admin traffic | Uptick after you boost a specific game |
| Newsletter active subscribers | DB / admin | Steady confirm rate from footer signup |
| Ingest + social log errors | Droplet logs | No repeated `failed` in social outbox |

Do not optimize for follower count alone on a promo account — optimize for **clicks to store pages you care about**.

---

## Troubleshooting

| Problem | Likely cause | Fix |
| --- | --- | --- |
| No Mastodon posts | `SOCIAL_MASTODON_ENABLED=0`, drain limit 0, or catalog unhealthy | [social-mastodon-pillowfort.md](social-mastodon-pillowfort.md) ops section |
| Posts without images | Cover fetch failed or `MASTODON_ATTACH_COVER=0` | Check log for `mastodon_cover_skipped` |
| Zero engagement | No follows, only link posts | Weekly checklist above |
| Newsletter not sending | `NEWSLETTER_ENABLED`, Exim/DNS | [newsletter-manual-test.md](newsletter-manual-test.md) |
| Mod warning on instance | Too many links, wrong instance | Slow rate limits; consider NSFW-tolerant instance |

---

## Revision log

| Date | Change |
| --- | --- |
| 2026-10-17 | Initial playbook: weekly/monthly checklists, instance strategy, automation vs manual split |

---

## Calendar reminders (suggested titles)

Copy into your calendar as recurring events:

1. **Weekly — NSFW Droid social (15 min)** — Mastodon boost + follow + one search
2. **Monthly — NSFW Droid traffic review (30 min)** — metrics, bio, intro post, instance sanity check
3. **Friday 9pm ET** — optional: spot-check newsletter sent (after cron); only if you care about first-send verification

When the fediverse landscape shifts (new instance, new hashtag norm, Pillowfort API), update this file and add a row to **Revision log**.
