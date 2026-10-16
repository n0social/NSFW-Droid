# Newsletter — manual test path

See [reward_program.md](reward_program.md) for product spec.

## Prerequisites

- `npm run db:migrate` (creates `newsletter_subscriber`)
- `RESEND_API_KEY` in env (local `.env` or droplet `/etc/nsfwdroid.env`)
- **From / sender name:** Confirm and weekly mail use `sendResendEmail`, which builds the Resend `from` header from env (not editable in the Resend dashboard alone).
  - **Sandbox:** If you have not verified a domain, Resend only allows `onboarding@resend.dev`; inboxes often show the local part **“onboarding”** unless you set a display name in env. The app defaults the display name to **NSFW Droid** (`NEWSLETTER_FROM_NAME` overrides).
  - **Production:** In [Resend → Domains](https://resend.com/domains), verify **nsfwdroid.com** (DNS records Resend provides). Then set on the droplet, e.g. `NEWSLETTER_FROM=NSFW Droid <newsletter@nsfwdroid.com>` or `ALERT_EMAIL_FROM=newsletter@nsfwdroid.com` (shared with ops alerts if you use one address).

## Footer subscribe (double opt-in)

1. Open any page with `SiteFooter` (home, browse, game detail).
2. Enter email in **Sign up for our favorite games list** (above the footer ad).
3. Submit — expect green “Check your inbox…” message.
4. Open the Resend confirmation email and click **Confirm subscription**.
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

**Production:** `NEWSLETTER_ENABLED=1` in `/etc/nsfwdroid.env` and cron `deploy/cron.d/nsfwdroid-weekly-newsletter` (Sunday 12:00 UTC). Use `--dry-run` before the first live send after changing picks logic.
