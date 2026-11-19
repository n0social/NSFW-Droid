# Agent instructions (NSFW Droid)

## Owner handoff / autonomous ops

**Canonical playbook:** [docs/autonomous-ops.md](docs/autonomous-ops.md) — cron table, required droplet env vars, how ops alerts reach the owner’s email (phone via mail push), and **merge vs deploy** (what is automated on the droplet vs what still needs a human or Cloud Agent).

**Agents should know:**

- Production is a **DigitalOcean droplet**; releases use [docs/deploy-droplet.md](docs/deploy-droplet.md) §4b — `./scripts/cloud-agent-deploy-droplet.sh` (not CI auto-deploy).
- Droplet **cron** (`deploy/cron.d/`) runs ingest 3×/day UTC, watchdog every 5 min, Tuesday maintenance, optional Friday newsletter — details in autonomous-ops.
- After merging changes under `deploy/cron.d/`, run `./scripts/cloud-agent-droplet-install-cron.sh` or have the owner run `install-droplet-cron.sh` on the box.
- Ops alerts require `ALERT_EMAIL_TO` and local Exim `sendmail` (or optional `SMTP_*`) in `/etc/nsfwdroid.env`; there is no SMS integration.
- **Owner maintenance timing:** Before DNS cutovers, droplet deploys, or other work that may cause 502/503 or brief catalog downtime, remind the owner to use the windows in [docs/autonomous-ops.md](docs/autonomous-ops.md#human-scheduled-changes-dns-deploy-maintenance) (weekly Tue UTC maintenance, late-night Eastern, avoid ingest triples when possible).

## Mobile / phone workflow

When the user works from a phone, **every implementation turn** must include:

1. **Chat summary** — Short bullets: what changed, which files/areas, how to verify, any droplet env steps.
2. **PR body** — Same substance in the pull request description (not chat-only).

Keep chat summaries scannable (headers, bullets, PR numbers). Do not put secrets in chat or PRs.

## Deploy

Production droplet: see `docs/deploy-droplet.md` (§4b tarball release via `scripts/cloud-agent-deploy-droplet.sh`). **Minnows/minnow.cloud is a different host** — never deploy or install Minnows paths on the NSFW Droid droplet (`159.203.136.220`, `/var/www/nsfwdroid`).

After deploy, verify `https://www.nsfwdroid.com/api/health`. If the PR touched cron or systemd/Caddy deploy files, call out the extra manual steps from [docs/autonomous-ops.md](docs/autonomous-ops.md).

## Cloud Agent → droplet SSH

**Diagnostics (run first):** `./scripts/cloud-agent-debug-droplet-ssh.sh` → `/opt/cursor/artifacts/droplet-ssh-debug.md`

**Rotate / enable key (agent VM):**
1. `./scripts/cloud-agent-enable-droplet-ssh.sh` (or `--skip-keygen` if key already exists)
2. Owner sets Cursor secret `CURSOR_CLOUD_AGENT_NSFWDROID_PRIVATE_KEY` (never chat), then starts a **new** agent run
3. `./scripts/cloud-agent-ssh-setup.sh` must print `ssh ok (nsfwdroid-deploy)`

**If install over SSH fails** (no `sudo … nsfwdroid-install-agent-ssh-key.sh` on droplet yet), owner **once** as root on `159.203.136.220`:

```bash
cd /var/www/nsfwdroid && ./deploy/setup-droplet-deploy-user.sh
sudo bash ~nsfwdroid-deploy/nsfwdroid-install-agent-ssh-key.sh ~nsfwdroid-deploy/agent.pub
```

After that, agents can rotate keys with `enable-droplet-ssh.sh` alone (uploads pub to deploy user home, `sudo` install helper).

**Deploy:** `NSFWDROID_DEPLOY_SSH_USER` defaults to `nsfwdroid-deploy`. If extract fails, owner: `chown -R nsfwdroid-deploy:www-data /var/www/nsfwdroid` then redeploy.

Details: [docs/deploy-droplet.md](docs/deploy-droplet.md) (Cloud Agent SSH section).

## Merch shop (paused)

The **NSFW Droid merch shop** (`/shop`, `/design/shop`, shop canvases) is **not** a Cursor Published App. Checkout is not live; the owner paused storefront work.

**Agents must not:**
- Call `publish-app` for shop routes, shop mockups, or a standalone “NSFW Droid Shop” app.
- Create or refresh shop **canvases** unless the owner explicitly asks for shop UI work.
- Nudge the owner to publish/unpublish shop in Cursor chat (no publish pills or preview links in summaries).

Catalog `/shop` on nsfwdroid.com stays `noindex` until the owner reopens storefront work.
