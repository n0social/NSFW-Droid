# Agent instructions (NSFW Droid)

## Mobile / phone workflow

When the user works from a phone, **every implementation turn** must include:

1. **Chat summary** — Short bullets: what changed, which files/areas, how to verify, any droplet env steps.
2. **PR body** — Same substance in the pull request description (not chat-only).

Keep chat summaries scannable (headers, bullets, PR numbers). Do not put secrets in chat or PRs.

## Deploy

Production droplet: see `docs/deploy-droplet.md` (§4b tarball release via `scripts/cloud-agent-deploy-droplet.sh`).
