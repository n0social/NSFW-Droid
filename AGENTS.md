# Agent instructions (NSFW Droid)

## Owner handoff / autonomous ops

**Canonical playbook:** [docs/autonomous-ops.md](docs/autonomous-ops.md) — cron table, required droplet env vars, how ops alerts reach the owner’s email (phone via mail push), and **merge vs deploy** (what is automated on the droplet vs what still needs a human or Cloud Agent).

**Agents should know:**

- Production is a **DigitalOcean droplet**; releases use [docs/deploy-droplet.md](docs/deploy-droplet.md) §4b — `./scripts/cloud-agent-deploy-droplet.sh` (not CI auto-deploy).
- Droplet **cron** (`deploy/cron.d/`) runs ingest 3×/day UTC, watchdog every 5 min, Tuesday maintenance, optional Friday newsletter — details in autonomous-ops.
- After merging changes under `deploy/cron.d/`, run `./scripts/cloud-agent-droplet-install-cron.sh` or have the owner run `install-droplet-cron.sh` on the box.
- Ops alerts require `ALERT_EMAIL_TO` (+ Resend/SMTP/sendmail) in `/etc/nsfwdroid.env`; there is no SMS integration.

## Mobile / phone workflow

When the user works from a phone, **every implementation turn** must include:

1. **Chat summary** — Short bullets: what changed, which files/areas, how to verify, any droplet env steps.
2. **PR body** — Same substance in the pull request description (not chat-only).

Keep chat summaries scannable (headers, bullets, PR numbers). Do not put secrets in chat or PRs.

## Deploy

Production droplet: see `docs/deploy-droplet.md` (§4b tarball release via `scripts/cloud-agent-deploy-droplet.sh`).

After deploy, verify `https://www.sfwdroid.com/api/health`. If the PR touched cron or systemd/Caddy deploy files, call out the extra manual steps from [docs/autonomous-ops.md](docs/autonomous-ops.md).
