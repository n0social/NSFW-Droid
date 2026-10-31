# Newsletter — manual test path

See [reward_program.md](reward_program.md) for product spec.

## Prerequisites

- `npm run db:migrate` (creates `newsletter_subscriber`)
- `SESSION_SECRET` or `NEWSLETTER_TOKEN_SECRET` in production (HMAC for weekly unsubscribe links; not used for Exim/sendmail authentication)
- `NEWSLETTER_TRANSPORT=sendmail` (default on droplet; local dev needs `sendmail` or skip live sends)
- **From / sender name:** Confirm and weekly mail use Exim `sendmail` via `sendNewsletterEmail`. Set e.g. `NEWSLETTER_FROM=NSFW Droid <newsletter@nsfwdroid.com>` or `ALERT_EMAIL_FROM=newsletter@nsfwdroid.com` in `/etc/nsfwdroid.env`. Display name defaults to **NSFW Droid** (`NEWSLETTER_FROM_NAME` overrides).
- **DNS:** Publish Exim DKIM from `./scripts/print-exim-dkim-dns.sh` — see [newsletter-exim-runbook.md](newsletter-exim-runbook.md) and [deploy-droplet.md](deploy-droplet.md).

## DNS check (before first live send)

```bash
tsx scripts/check-newsletter-dns.ts
```

Fix any `issues` in DNS before sending. `send-weekly-newsletter.ts` aborts on DNS issues unless you pass `--skip-dns-check` (emergency only).

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

**Production:** `NEWSLETTER_ENABLED=1`, `NEWSLETTER_TRANSPORT=sendmail`, and cron `deploy/cron.d/nsfwdroid-weekly-newsletter` (Sunday 12:00 UTC). Use `--dry-run` before the first live send after changing picks logic.
