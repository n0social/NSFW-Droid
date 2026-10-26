# Newsletter & Exim — zero-touch ops runbook

Sendmail-first on the droplet (`NEWSLETTER_TRANSPORT=sendmail`). Ops alerts use the same Exim path (`ALERT_EMAIL_TRANSPORT=sendmail`).

## Gmail inbox (not spam) without a third-party API

Exim on the droplet **already DKIM-signs** outbound mail (`DKIM_SELECTOR=nsfwdroid`). Gmail often files messages as spam when the **public key is missing in DNS**.

1. On the droplet: `./scripts/print-exim-dkim-dns.sh`
2. Add the printed **TXT** at `nsfwdroid._domainkey.nsfwdroid.com` in Cloudflare (DNS only).
3. Confirm SPF includes the droplet: `dig +short TXT nsfwdroid.com` should contain `ip4:159.203.136.220`.
4. Re-run `./scripts/ops-alert-email-test.sh` and check **Primary** (may take up to an hour for DNS).

Optional: route ops mail through your mailbox provider with `ALERT_EMAIL_TRANSPORT=smtp` and `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` (e.g. Gmail App Password) if you prefer not to publish DKIM.

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
