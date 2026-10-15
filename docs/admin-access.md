# Admin access (staff login)

**Current (Phase 1):** `/admin/login` with `ADMIN_PASSWORD` from server env. Sessions use signed random cookies (`Secure` in production), login rate limiting, and `admin_audit_log` for moderation actions.

After login:

| Path | Purpose |
| --- | --- |
| `/admin` | Dashboard — catalog counts, sign-ups, analytics (24h/7d), top clicks/views/favorites, `ingest_source` + `ingest_run` history, audit tail. Polls `/api/admin/dashboard` every 30s. |
| `/admin/queue` | TOS / manual candidate review |
| `/admin/listings/new` | Curated partner URL |

## What most sites do next

| Approach | When |
| --- | --- |
| **IP allowlist** (DO firewall or Caddy) on `/admin*` | Stable office/home IPs |
| **Cloudflare Access** | DNS on Cloudflare; Google/GitHub gate before the app |
| **Auth.js + Google allowlist** | Named moderators and per-user audit |
| **`admin.nsfwdroid.com`** | Separate hostname or VPN-only admin |

See the product discussion in repo history; implementation upgrades are incremental on top of the hardened password flow.

## Ops

- Set `ADMIN_PASSWORD` in `/etc/nsfwdroid.env` only.
- After password change, all old sessions invalidate (HMAC uses the secret).
- Query audit: `SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT 50;` (PGlite/Postgres).
