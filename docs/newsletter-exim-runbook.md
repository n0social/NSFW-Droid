# Newsletter & Exim — zero-touch ops runbook

Sendmail-first on the droplet (`NEWSLETTER_TRANSPORT=sendmail`). Brevo paths remain when transport is Brevo.

## Health

`curl -sS http://127.0.0.1:3000/api/health | jq .newsletter` — check `signingSecretConfigured`, `transport`, `deliveryConfigured`.

## Cron

Friday 21:00 America/New_York → `scripts/weekly-newsletter-cron.sh` → preflight → `send-weekly-newsletter.ts` via `catalog-maintenance.sh`. Log: `/var/log/nsfwdroid-newsletter.log`.

Idempotency: `/var/lib/nsfwdroid/newsletter-weekly-send.json` (skip duplicate week unless `--force-resend`).

## Alerts

Ops and newsletter failure mail use the same **Exim sendmail** path as weekly sends (`scripts/alert-email.sh`, default `ALERT_EMAIL_TRANSPORT=sendmail`). Keys: `newsletter-preflight-YYYY-MM-DD`, `newsletter-send-failed-YYYY-MM-DD`. Test: `./scripts/ops-alert-email-test.sh` on the droplet.

Remove unused `RESEND_API_KEY` from `/etc/nsfwdroid.env` — ops alerts no longer call Resend.

## Tests

`npm run test:newsletter` — see also `docs/newsletter-manual-test.md`.
