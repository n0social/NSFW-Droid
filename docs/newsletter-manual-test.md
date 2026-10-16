# Newsletter — manual test path

See [reward_program.md](reward_program.md) for product spec.

## Prerequisites

- `npm run db:migrate` (creates `newsletter_subscriber`)
- `BREVO_API_KEY` in env (local `.env` or droplet `/etc/nsfwdroid.env`)
- **From / sender name:** Confirm and weekly mail use `sendBrevoEmail`, which builds the Brevo `sender` from env (set the same address in Brevo → Senders).
  - **Production:** In [Brevo → Senders, Domains & Dedicated IPs → Domains](https://app.brevo.com/senders/domain), authenticate **nsfwdroid.com** (SPF, DKIM, and brevo-code TXT in NameSilo — see [deploy-droplet.md](deploy-droplet.md)). Then set on the droplet, e.g. `NEWSLETTER_FROM=NSFW Droid <newsletter@nsfwdroid.com>` or `ALERT_EMAIL_FROM=newsletter@nsfwdroid.com` (shared with ops alerts if you use one address). The app defaults the display name to **NSFW Droid** (`NEWSLETTER_FROM_NAME` overrides).

## DNS check (before first live send)

```bash
tsx scripts/check-newsletter-dns.ts
```

Fix any `issues` in NameSilo before sending. `send-weekly-newsletter.ts` aborts on DNS issues unless you pass `--skip-dns-check` (emergency only).

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
NEWSLETTER_ENABLED=1 tsx scripts/send-weekly-newsletter.ts --dry-run
```

**Production:** `NEWSLETTER_ENABLED=1` and `BREVO_API_KEY` in `/etc/nsfwdroid.env` and cron `deploy/cron.d/nsfwdroid-weekly-newsletter` (Sunday 12:00 UTC). Use `--dry-run` before the first live send after changing picks logic.
