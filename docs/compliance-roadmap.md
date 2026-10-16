# Trust and compliance roadmap

**Date:** 15 October 2026  
**Status:** Engineering notes — **not legal advice.** Counsel should review before paid traffic or UK/US age-rule claims.

---

## Age assurance (vendor options)

UK Online Safety Act and several US state laws expect **highly effective** age assurance for dedicated adult services — not a self-attested checkbox alone. See [gaps.md](gaps.md) and [reward_program.md](reward_program.md) §B.

| Approach | Pros | Cons / notes |
| --- | --- | --- |
| **Dedicated AV vendors** (e.g. Yoti, Veriff, AgeChecked-style ID + liveness) | Strong assurance, audit trail | Cost per check, UX friction, vendor contract |
| **Payment-card age check** (micro-charge via Stripe) | Familiar checkout flow; ties to [reward_program.md](reward_program.md) verified tier | Not all users have cards; counsel on card-as-age-gate; PCI via Stripe hosted UI |
| **Mobile / platform signals** | Low friction where available | Incomplete coverage on desktop web |
| **Checkbox gate (current Phase 1)** | Fast to ship | **Insufficient** for regulatory “highly effective” standard; document as interim only |

**Product direction:** Keep the checkbox for local/staging; plan vendor or Stripe verification before marketing spend. Verified-member perks in [reward_program.md](reward_program.md) should require vendor-approved assurance, not checkbox alone.

---

## Checkbox limitation (rewards and compliance)

- **Visitor tier** today: `age_verified` cookie after self-attestation — see `AgeGate` and `POST /api/age-gate`.
- **Verified member tier** (spec): Firebase account + **vendor age assurance** — do not grant verification badges, paid perks, or newsletter segments that imply regulatory compliance based only on the checkbox.
- **Engineering hooks:** `user_profile` preferences, future `verification_status` field; Stripe Customer metadata `firebase_uid` per reward_program §B.

---

## User reports and broken links

| Feature | Implementation |
| --- | --- |
| Listing reports | `POST /api/listings/report` → `listing_report` table; admin queue on `/admin` |
| Broken outbound links | `listing.link_status = 'broken'` hides from browse; detail page shows warning and dampens Play CTA |
| Link recheck | `npm run catalog:check-links` (cron) — see [data-and-ingest.md](data-and-ingest.md) |

---

## Cookies and analytics

- **Essential:** `age_verified`, `blur_covers`, `USER_SESSION` (signed Firebase session).
- **Optional / configured:** Google Analytics (`NEXT_PUBLIC_GA_MEASUREMENT_ID`), Firebase Analytics, ExoClick when `NEXT_PUBLIC_ADS_ENABLED=1`.
- **Notice:** Site footer bar + [privacy](/privacy) copy; no full CMP until non-essential tracking expands.

---

## Open items (non-exhaustive)

- DMCA / abuse contact published on `/dmca`
- Counsel review of affiliate + adult ad disclosures ([affiliate](/affiliate), [privacy](/privacy))
- Managed Postgres + backup policy for `listing_report` and audit tables
- Age vendor selection and sandbox → production cutover runbook
