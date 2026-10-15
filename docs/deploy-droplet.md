# Deploy to DigitalOcean Droplet (www.nsfwdroid.com)

**Production URL:** https://www.nsfwdroid.com (HTTPS via Caddy + Let’s Encrypt). Admin: `/admin/login`.  
**Droplet public IP:** `159.203.136.220`  
**Your key on droplet:** `icollar-droplet` (for you from your laptop).

**Cloud agent deploy key (add to droplet once):** public key in `deploy/nsfwdroid-deploy.pub`:

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMdIdQkh4DkAO9/giumJnatx9T2k0zkEmF/NuxKEPVmS nsfwdroid-cloud-agent-deploy
```

While logged in as **root** with your existing key, append it:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
grep -q 'nsfwdroid-cloud-agent-deploy' ~/.ssh/authorized_keys 2>/dev/null || \
  echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMdIdQkh4DkAO9/giumJnatx9T2k0zkEmF/NuxKEPVmS nsfwdroid-cloud-agent-deploy' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Or: DigitalOcean → **Settings → Security → SSH keys** → Add, then **Droplet → Access → Add SSH key** (or recreate with both keys).

After that, the Cursor cloud agent can `ssh root@159.203.136.220` and run bootstrap. The **private** key never leaves the agent VM and is **not** in git.

---

## 1. DNS (at your registrar)

| Host | Type | Value |
| --- | --- | --- |
| `@` (apex) | A | `159.203.136.220` |
| `www` | A | `159.203.136.220` |

Optional: CNAME `www` → apex if your DNS provider prefers it. Caddy in `deploy/Caddyfile` requests certificates for both `www.nsfwdroid.com` and `nsfwdroid.com`.

Propagation can take up to an hour.

---

## 2. SSH to the droplet

```bash
ssh -i ~/.ssh/icollar-droplet root@159.203.136.220
```

Create app directory and clone (private GitHub example):

```bash
apt-get update && apt-get install -y git
mkdir -p /var/www/nsfwdroid
cd /var/www/nsfwdroid
git clone git@github.com:YOUR_ORG/NSFW-Droid.git .
```

---

## 3. Environment (`/etc/nsfwdroid.env`)

Never commit this file. Example:

```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://www.nsfwdroid.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX   # same as Firebase web app measurementId
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
# FIREBASE_SERVICE_ACCOUNT_JSON=   # minified service account JSON (one line)
# SESSION_SECRET=
ADMIN_PASSWORD=choose-a-long-secret
# Auto-publish TOS-clear ingest (default on when NODE_ENV=production). Use 0 for all-manual review.
AUTO_PUBLISH=1
# Legacy local demo flag (also enables auto-publish in dev)
# DEMO_AUTO_PUBLISH=0
# Strict manual ingest (overrides AUTO_PUBLISH)
# INGEST_REQUIRE_REVIEW=0
STEAM_WEB_API_KEY=optional
ITCH_NSFW_ONLY=1
CATALOG_NSFW_ONLY=1
```

- **Google Analytics:** use the Firebase web app **measurementId** (`G-…`) in `NEXT_PUBLIC_GA_MEASUREMENT_ID` (see [firebase-setup.md](firebase-setup.md)). Rebuild (`npm run build`), restart `nsfwdroid`.
- First-party rails still use `analytics_event` in Postgres/PGlite; GA is for marketing and funnel views.

---

## 4. Bootstrap script

From the repo on the server:

```bash
chmod +x deploy/bootstrap-droplet.sh
./deploy/bootstrap-droplet.sh
```

This installs Node 20, Caddy, builds the app, installs `deploy/nsfwdroid.service`, and proxies HTTPS → `localhost:3000`.

---

## 4b. Cloud agent release (code + build)

On the small droplet (~512 MiB RAM), **do not** rsync a partial `node_modules` tree — it causes `502` from Caddy when `next` or transitive deps (e.g. `lodash.isinteger` for `firebase-admin`) are missing.

Reliable pattern:

1. On the agent: `npm run build` with production `NEXT_PUBLIC_*` from `/etc/nsfwdroid.env` (never commit secrets). Keep `@electric-sql/pglite` external (`serverExternalPackages` in `next.config.mjs`) so the catalog DB works in `next start`.
2. Tar-sync the repo **excluding** `node_modules` and `data/catalog` to `/var/www/nsfwdroid`.
3. Install production deps either:
   - **On droplet:** `cd /var/www/nsfwdroid && npm ci --omit=dev` (slow; needs swap), or
   - **From agent:** `npm ci --omit=dev` in a temp dir, `tar czf node_modules.tgz node_modules`, copy to `/var/www/nsfwdroid` (not `/tmp` if tmpfs is full), extract, `chown -R www-data:www-data node_modules`.
4. `systemctl restart nsfwdroid` and verify `curl -sI http://localhost:3000` and `https://www.nsfwdroid.com`.

---

## 5. After deploy

### Catalog ingest runbook (required)

PGlite allows **one process** per `data/catalog` directory. If ingest or migrate runs while `nsfwdroid` is up, initialization fails (`PGlite failed to initialize`), `/api/health` returns **503**, and the homepage may show an empty catalog even though data on disk is fine.

**Always stop the web service before any migrate/ingest:**

```bash
systemctl stop nsfwdroid
cd /var/www/nsfwdroid
set -a && source /etc/nsfwdroid.env && set +a
npx --yes tsx scripts/db-migrate.ts && npx --yes tsx scripts/ingest-all.ts
chown -R www-data:www-data data/catalog
systemctl start nsfwdroid
```

Verify after start:

```bash
curl -sf http://localhost:3000/api/health | jq .
# expect status 200 and listingCount > 0
curl -sI https://www.nsfwdroid.com/api/health
```

(`npm run ingest` needs `tsx` from devDependencies; production `node_modules` from `npm ci --omit=dev` does not include it — use `npx tsx` as above.)

**One-off maintenance scripts** (e.g. `unpublish-non-nsfw-listings.ts`, `backfill-listing-covers.ts`) use the same rule: `systemctl stop nsfwdroid` first, run as needed, `chown -R www-data:www-data data/catalog`, remove stale `data/catalog/postmaster.pid` if present, then **`systemctl start nsfwdroid`**. A manual stop does not auto-restart (`Restart=on-failure` only). If the site shows **502**, check `systemctl is-active nsfwdroid` before debugging Caddy.

TOS holds: visit https://www.nsfwdroid.com/admin (set `ADMIN_PASSWORD`).

### Daily ingest (cron)

Cron must **stop** the app, ingest, then **start** — same as manual ingest:

```bash
# /etc/cron.d/nsfwdroid-ingest (example)
0 6 * * * root systemctl stop nsfwdroid && cd /var/www/nsfwdroid && set -a && . /etc/nsfwdroid.env && set +a && npx --yes tsx scripts/db-migrate.ts && npx --yes tsx scripts/ingest-all.ts && chown -R www-data:www-data data/catalog && systemctl start nsfwdroid >> /var/log/nsfwdroid-ingest.log 2>&1
```

---

## 6. Layout reference

Storefront chrome matches `docs/design-layout.md` (header, 21:9 hero, chip row, horizontal rails, footer). Iterate copy and Vesper artwork from that doc after you review the live site.

---

## Security

- Rotate any API key ever pasted in chat.
- Restrict SSH to your IP in DigitalOcean Cloud Firewall when possible.
- Keep `ADMIN_PASSWORD` only in `/etc/nsfwdroid.env`.
