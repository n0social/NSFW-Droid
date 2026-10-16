# Site backups

## What is backed up

| Asset | Launch snapshot | Notes |
| --- | --- | --- |
| PGlite catalog (`data/catalog/`) | Yes | Critical; 658 listings at launch |
| Next build (`.next/`) | Yes | Matches deployed `next start` |
| App source (`src/`, `scripts/`, `deploy/`, etc.) | Yes | Excludes `node_modules` |
| Lockfile (`package-lock.json`) | Yes | Restore with `npm ci --omit=dev` |
| Deploy markers (`.deploy-sha`, `.deploy-commit`) | Yes | Git commit for this release |
| `/etc/nsfwdroid.env` | **No** | Copy manually to a secrets store; never commit |

## Where backups live

| Location | Purpose |
| --- | --- |
| **Git tag** `site_launch_01_default` | Immutable code state at launch (commit on `main`) |
| **Droplet** `/var/backups/nsfwdroid/site_launch_01_default/` | Manifest + `latest.tar.gz` symlink to dated tarball |
| **Droplet** `/var/backups/nsfwdroid/site_launch_01_default_YYYYMMDD.tar.gz` | Full launch archive |

DigitalOcean droplet **volume snapshots** are mentioned in [architecture.md](architecture.md) as a future ops item; there is no automated DO backup job in-repo yet.

## Create a launch snapshot

On the production droplet (as root):

```bash
cd /var/www/nsfwdroid
chmod +x scripts/backup-site-launch.sh
./scripts/backup-site-launch.sh site_launch_01_default
```

Default name is `site_launch_01_default` if omitted. Expect a short stop/start around the PGlite tar (via `catalog-maintenance.sh`).

## Restore (one-liner sketch)

```bash
# On droplet: extract launch tarball, reinstall deps, restore env separately, restart
tar -xzf /var/backups/nsfwdroid/site_launch_01_default_YYYYMMDD.tar.gz -C /var/www && \
  cd /var/www/nsfwdroid && npm ci --omit=dev && systemctl restart nsfwdroid
```

Ensure `/etc/nsfwdroid.env` exists before restart. Verify: `curl -sf http://localhost:3000/api/health | jq .`

## Inventory (repo + droplet)

- **Repo:** `scripts/backup-site-launch.sh`, this doc, annotated git tag `site_launch_01_default` → `ff3927b`.
- **Droplet:** `/var/backups/nsfwdroid/site_launch_01_default*` (launch archive); otherwise only default Ubuntu `/var/backups/dpkg.*`.
- **GitHub releases:** none for site snapshots (tags only).
