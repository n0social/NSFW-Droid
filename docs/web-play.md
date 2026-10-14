# Web-based play (browser games)

**Date:** 14 October 2026  
**Status:** product guidance (not implemented).  
**Related:** [considerations.md](considerations.md), [architecture.md](architecture.md), [revenue_streams.md](revenue_streams.md), [hosting.md](hosting.md).

---

## Short answer

| Question | Answer |
| --- | --- |
| Easy access with **credit to the maker** on the catalog? | **Yes** — listing pages, outbound CTAs, and (later) creator profiles are the right place for attribution. |
| **Host game files** on `nsfwdroid.com` / DO Spaces today? | **No** — Phase 1 is link-out only; no game binaries on the Droplet or in Spaces. |
| **Play inside our site** without hosting the build? | **Maybe** — Phase A can link or embed the **maker’s** official web player (e.g. itch.io HTML5 embed URL) when the platform and developer allow it. Embedding is not a substitute for a **distribution license** if we copy or serve the build ourselves. |

---

## What is possible today (Phase 1 — link catalog)

1. **Primary path (supported now):** Game detail shows title, artwork (kit or typographic), **maker credit** (manual/admin or future `creator` entity — see [roadmap-creators.md](roadmap-creators.md)), and an outbound button to the official page (`official_url` / `affiliate_url`). The player plays on itch.io, Steam, Nutaku, or the developer’s site. We do not store the game package.

2. **Optional “Play here” embed (product decision, not built):** Some titles ship an **official browser build** on itch.io (or similar) with a documented embed/player URL. We could add a second CTA or an iframe that loads **that URL on their origin**, still behind our age gate, with a persistent **“By [Creator] — support on [official link]”** strip on our page.  
   - **Not** the same as hosting: traffic and file delivery stay on the merchant unless we rehost.  
   - **Constraints:** [architecture.md](architecture.md) already excludes iframe embed of **Nutaku/Steam checkout**; respect each platform’s embed/X-Frame-Options and terms. Affiliate programs usually cover **link + creatives**, not rehosting ([considerations.md](considerations.md)).  
   - **Do not** embed or hotlink **Patreon member builds**, leaked mirrors, or paywalled files — link to the campaign only ([roadmap-creators.md](roadmap-creators.md)).

3. **What we do not do in Phase 1:** Upload HTML5/WebGL builds to our Droplet or Spaces, proxy game assets through our domain, or mirror a `.zip` from someone else’s CDN without a written **distribute** grant ([considerations.md](considerations.md)).

---

## Legal / licensing (three permissions)

| Permission | Web play implication |
| --- | --- |
| **Link** | Outbound to official store page or public HTML5 player URL. |
| **Promote** | Title, logo, screenshots on our listing — affiliate kit or written art license. |
| **Distribute** | Required before **our** Spaces/CDN serves the browser package or APK. Must name **browser play** explicitly in the grant ([considerations.md](considerations.md)). |

Operational minimum before any hosted or wide embed program: developer upload terms (stored acceptance), DMCA contact, takedown-first on named builds, content line aligned with DO AUP ([hosting.md](hosting.md)).

---

## Phased technical path

| Phase | User experience | Infrastructure | License |
| --- | --- | --- | --- |
| **A — Link / embed** | “Play on itch.io” or iframe to **maker-hosted** player; credit banner on our shell | Catalog + age gate only; no game objects in Spaces | Link + promote; confirm embed allowed per platform/dev |
| **B — Licensed CDN** | “Play” loads build from **DO Spaces** via short-lived signed URL (same boundary as APK download) | Spaces + hash per build; egress budgeted per [revenue_streams.md](revenue_streams.md) | Written **distribute** license including browser platform |
| **C — First-party player shell** | Unified fullscreen player, account optional, **fixed credit UI** (creator name, link to tip/store), version/update from API | BFF serves signed URLs; CSP locked down; analytics on play start | Same as B; optional commission if we sell access |

Phase A can ship while the catalog is link-only. Phases B–C wait on upload terms and per-title licenses — same gate as APK hosting ([architecture.md](architecture.md) Phase 2).

---

## Risks

- **Bandwidth / cost:** Embeds mostly hit the maker’s host; **our** hosting (B/C) pays Spaces egress — price downloads/plays in margin ([revenue_streams.md](revenue_streams.md)).  
- **DMCA / copyright:** Hosting or wide redistribution increases exposure; need notice workflow and repeat-infringer policy ([considerations.md](considerations.md)).  
- **Adult content on our domain:** Full-screen play on `nsfwdroid.com` (B/C) makes us the delivery surface for explicit content — stricter review, processor rules, and DO AUP alignment ([hosting.md](hosting.md)).  
- **UK Online Safety Act:** Catalog already plans third-party **age assurance** before explicit UI ([architecture.md](architecture.md)); in-browser play must not bypass that gate.

---

## Recommendation

Stay aligned with **catalog first, host only with license**:

1. Ship **credit-rich listings** and outbound play (Phase A).  
2. Add curated **embed** only where the official player URL is public and embeddable; never for Patreon-gated or pirated builds.  
3. Open **Spaces browser packages** (B) only after developer terms and per-game **distribute** licenses that include web delivery.  
4. Invest in a **player shell** (C) when enough licensed browser titles justify egress and compliance overhead.

Affiliate revenue on link-out rows is unchanged; per-play commission applies only when we process payment on a licensed hosted build ([revenue_streams.md](revenue_streams.md)).
