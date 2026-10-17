# Newsletter — manual test path

See [reward_program.md](reward_program.md) for product spec.

## Prerequisites

- `npm run db:migrate` (creates `newsletter_subscriber`)
- **Production transport:** `NEWSLETTER_TRANSPORT=sendmail` and Exim on the droplet (`deploy/setup-local-mail.sh`). Outbound delivery needs DigitalOcean to unblock port 25; until then mail sits in the Exim queue.
- **From / sender name:** Confirm and weekly mail use `sendNewsletterEmail` → local `sendmail` (Exim). Set e.g. `NEWSLETTER_FROM="NSFW Droid <newsletter@nsfwdroid.com>"` in `/etc/nsfwdroid.env` (display name defaults to **NSFW Droid**; override with `NEWSLETTER_FROM_NAME`).
- Ops alerts remain on Resend (`RESEND_API_KEY` in `scripts/alert-email.sh`), not the newsletter path.

## DNS check (before first live send)

```bash
NEWSLETTER_TRANSPORT=sendmail tsx scripts/check-newsletter-dns.ts
```

Fix any `issues` in NameSilo (and PTR via DigitalOcean) before expecting inbox delivery. `send-weekly-newsletter.ts` aborts on DNS issues unless you pass `--skip-dns-check` (emergency only).

## Inbox vs spam (droplet Exim)

Weekly mail is **multipart/alternative** (plain + HTML) with **List-Unsubscribe**, **List-ID**, **Reply-To**, and envelope sender matching `newsletter@nsfwdroid.com` (`sendmail -f`). Exim adds **DKIM** when `deploy/setup-local-mail.sh` is installed.

| Check | Why it matters |
| --- | --- |
| SPF includes droplet IP | Gmail/Yahoo reject or spam-folder without alignment |
| `nsfwdroid._domainkey` TXT | DKIM signature must verify |
| `_dmarc` published | Receivers trust the domain more with DMARC (start `p=none`, monitor) |
| rDNS `mail.nsfwdroid.com` | Weak/missing PTR is a common spam signal for self-hosted mail |
| Same From in env and DNS | `NEWSLETTER_FROM` must match the domain you authenticate |

**One-off test:** `tsx scripts/send-newsletter-test.ts --to you@example.com` (droplet, with env loaded). Inspect Gmail → Show original for `spf=pass`, `dkim=pass`, `dmarc=pass`.

Confirm/double-opt-in mail uses the same transport but omits list headers (transactional). If only the weekly message spams, fix bulk DNS; if confirm mail spams too, fix PTR/SPF/DKIM first.

## Footer subscribe (double opt-in)

1. Open any page with `SiteFooter` (home, browse, game detail).
2. Enter email in **Sign up for our favorite games list** (above the footer ad).
3. Submit — expect green “Check your inbox…” message.
4. Open the confirmation email and click **Confirm subscription**.
5. Land on `/newsletter?status=confirmed`.

**API-only:**

```bash
curl -sS -X POST http://localhost:3000/api/newsletter/subscribe \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com"}'
```

Honeypot: if JSON includes `"website":"spam"`, API returns success without sending.

## Weekly picks + send (dry-run)

```bash
tsx scripts/weekly-newsletter-pick.ts
NEWSLETTER_ENABLED=1 NEWSLETTER_TRANSPORT=sendmail tsx scripts/send-weekly-newsletter.ts --dry-run
```

**Production:** `NEWSLETTER_ENABLED=1`, `NEWSLETTER_TRANSPORT=sendmail`, and cron `deploy/cron.d/nsfwdroid-weekly-newsletter` (Friday 9:00 PM US Eastern). Picks rank by 7-day `listing_view` + weighted `outbound_click` (not favorites). Use `--dry-run` before the first live send after changing picks logic.

**Queue inspection (droplet):** `exim -bp` lists deferred mail while port 25 is blocked.
