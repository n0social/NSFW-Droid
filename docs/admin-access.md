# Admin access (staff login)

The public catalog stays on **https://www.nsfwdroid.com**. The staff UI and `/api/admin/*` are served on **https://admin.nsfwdroid.com**.

`https://www.nsfwdroid.com/admin` and `https://www.nsfwdroid.com/api/admin…` **308** to the same path and query on the admin host (Caddy and the app). On the admin host, `/` redirects to `/admin`. Other app pages (catalog, public APIs) are not served there; they redirect to www. Static assets the admin pages need (`/_next`, favicon, icons) stay on the admin host.

**Two steps in production:**

1. **Cloudflare Access** on `admin.nsfwdroid.com` (email one-time PIN or Google). This is identity, not an IP allowlist. A phone switching networks does not matter.
2. **`ADMIN_PASSWORD`** on `/admin/login`, unchanged. The `admin_session` cookie is **host-only** (no `Domain=.nsfwdroid.com`), so it is not sent to www.

Until `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD` are both set, step 1 is skipped and the password login works on its own. Set both in production after the Cloudflare application exists. A deploy before that UI is finished does not lock you out. If only one of the two variables is set, Access stays off.

After login:

| Path | Purpose |
| --- | --- |
| `/admin` | Dashboard — catalog counts, sign-ups, analytics (24h/7d), top clicks/views/favorites, `ingest_source` + `ingest_run` history, audit tail. Polls `/api/admin/dashboard` every 30s. |
| `/admin/queue` | TOS / manual candidate review |
| `/admin/listings/new` | Curated partner URL |

Local dev (no DNS): open **http://admin.localhost:3847/admin** while `npm run dev` is on port 3847. `admin.localhost` resolves to loopback. Override the host with `ADMIN_HOST` (hostname or `host:port`; the public site’s port is copied when you omit it).

## What the owner clicks in Cloudflare

Do this in a [maintenance window](autonomous-ops.md#human-scheduled-changes-dns-deploy-maintenance) if the DNS change might briefly affect the zone. Access itself does not take the catalog down.

1. **DNS** (Cloudflare → `nsfwdroid.com` → DNS):
   - Add `admin` as a **proxied** (orange-cloud) **A** record to `159.203.136.220`, or a **proxied CNAME** to `www` / `@`.
   - Proxied is required so Access can sit in front. Grey-cloud (DNS only) skips Access.
   - SSL/TLS mode stays **Full (strict)**. `admin.nsfwdroid.com` uses the Cloudflare origin certificate installed on the droplet (`/etc/caddy/certs/cloudflare-origin.pem` and `.key`, not in git). www keeps Let's Encrypt. The apex name is also on that origin certificate.
2. **Zero Trust** → **Access** → **Applications** → **Add an application** → **Self-hosted**.
   - Application domain: `admin.nsfwdroid.com` (entire hostname).
   - Identity provider: **One-time PIN** and/or **Google**.
   - Policy: **Allow**. Include **Emails** → `donavansky@gmail.com`. Do not add an IP rule or any other address.
   - Create the application.
3. Copy **Application Audience (AUD)** tag from the application’s overview / basic information.
4. Copy the **team domain** (`<team>.cloudflareaccess.com`). It is the host in the Access login URL and under Zero Trust → Settings → **Custom Pages** / team name. Do not include a path.
5. On the droplet, in `/etc/nsfwdroid.env` (never commit):

```bash
CF_ACCESS_TEAM_DOMAIN=<team>.cloudflareaccess.com
CF_ACCESS_AUD=<application AUD tag>
```

Leave `ADMIN_PASSWORD` set. Prefer `ADMIN_SESSION_SECRET` as well (below).

6. After this release is on the box: install the new `deploy/Caddyfile` (`cp deploy/Caddyfile /etc/caddy/Caddyfile && systemctl reload caddy`) and `systemctl restart nsfwdroid`. Restart is enough for the two Access variables; they are read at runtime. Caddy reload is only needed when the site block changes.
7. Check `https://admin.nsfwdroid.com/admin` prompts for Access, then the existing password form. `https://www.nsfwdroid.com/admin?from=www` should land on `https://admin.nsfwdroid.com/admin?from=www`.

This is **not** an IP allowlist. Home, mobile, and travel IPs all work when Access accepts `donavansky@gmail.com`.

## How the JWT is checked

When both Access env vars are set, the app (Node middleware) requires a valid Cloudflare Access JWT on the admin host before `/admin` and `/api/admin/*`.

That is Cloudflare’s documented check ([Validating JSON](https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/)):

- Token header: `Cf-Access-Jwt-Assertion` (fallback cookie `CF_Authorization`).
- Signing keys: `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs` (JWKS). The `jose` `createRemoteJWKSet` + `jwtVerify` helper caches those keys.
- `alg` RS256, `iss` = `https://<team>.cloudflareaccess.com`, `aud` = `CF_ACCESS_AUD`, and `exp` still valid.
- `email` must be `donavansky@gmail.com`. The comparison is case-insensitive (`Donavansky@Gmail.com` matches). Any other address, or a token with no email claim, gets **401**.

A request that reaches the origin without that JWT, or with a verified token for a different email, gets **401** and never sees the password form. Cloudflare normally challenges the browser before the origin. The origin check matters when someone tries the droplet directly with `Host: admin.nsfwdroid.com`. The app enforces the same address even if the Cloudflare policy is later widened.

## Ops

- Set `ADMIN_PASSWORD` in `/etc/nsfwdroid.env` only (login credential). It stays the second factor after Access.
- Set `ADMIN_SESSION_SECRET` to a separate long random string for signing `admin_session` cookies (`openssl rand -base64 32`). If omitted, cookies are still signed with `ADMIN_PASSWORD` (legacy); add `ADMIN_SESSION_SECRET` so you can rotate the login password without kicking every moderator session.
- After `ADMIN_SESSION_SECRET` change, all old admin sessions invalidate. Changing `ADMIN_PASSWORD` alone does not, once `ADMIN_SESSION_SECRET` is set.
- Do not set a `Domain` on `admin_session`. It must stay host-only on `admin.nsfwdroid.com`.
- Query audit: `SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT 50;` (PGlite/Postgres).
