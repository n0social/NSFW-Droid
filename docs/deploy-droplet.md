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
DEMO_AUTO_PUBLISH=0
STEAM_WEB_API_KEY=optional
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

## 5. After deploy

```bash
cd /var/www/nsfwdroid
npm run ingest          # candidates
# set ADMIN_PASSWORD, visit https://www.nsfwdroid.com/admin
```

Daily ingest (cron):

```text
0 6 * * * cd /var/www/nsfwdroid && npm run ingest >> /var/log/nsfwdroid-ingest.log 2>&1
```

---

## 6. Layout reference

Storefront chrome matches `docs/design-layout.md` (header, 21:9 hero, chip row, horizontal rails, footer). Iterate copy and Vesper artwork from that doc after you review the live site.

---

## Security

- Rotate any API key ever pasted in chat.
- Restrict SSH to your IP in DigitalOcean Cloud Firewall when possible.
- Keep `ADMIN_PASSWORD` only in `/etc/nsfwdroid.env`.
