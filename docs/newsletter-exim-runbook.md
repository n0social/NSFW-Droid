# Newsletter & Exim — zero-touch ops runbook

Sendmail-first on the droplet (`NEWSLETTER_TRANSPORT=sendmail`). Brevo paths remain when transport is Brevo.

## Health

`curl -sS http://127.0.0.1:3000/api/health | jq .newsletter` — check `signingSecretConfigured`, `transport`, `deliveryConfigured`.

## Cron

Friday 21:00 America/New_York → `scripts/weekly-newsletter-cron.sh` → preflight → `send-weekly-newsletter.ts` via `catalog-maintenance.sh`. Log: `/var/log/nsfwdroid-newsletter.log`.

Idempotency: `/var/lib/nsfwdroid/newsletter-weekly-send.json` (skip duplicate week unless `--force-resend`).

## Alerts

`alert-email.sh` keys: `newsletter-preflight-YYYY-MM-DD`, `newsletter-send-failed-YYYY-MM-DD`.

## Tests

`npm run test:newsletter` — see also `docs/newsletter-manual-test.md`.
