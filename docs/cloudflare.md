# Cloudflare (edge proxy)

Production origin stays the DigitalOcean droplet (`159.203.136.220`) running **Caddy → Next.js**. Cloudflare sits in front when DNS is **proxied** (orange cloud).

## Cutover checklist

1. **DNS records** in Cloudflare (zone for `nsfwdroid.com`):
   - `www` → A `159.203.136.220` — **Proxied**
   - Apex `@` → A same IP (proxied) or CNAME flattening per Cloudflare UI
2. **Registrar** → nameservers set to Cloudflare (`*.ns.cloudflare.com`).
3. **SSL/TLS** → **Full (strict)** (origin already has Let’s Encrypt via Caddy).
4. **Verify** (after propagation):
   - `dig NS nsfwdroid.com` shows Cloudflare NS
   - `curl -sI https://www.nsfwdroid.com/api/health` includes `cf-ray` (or `server: cloudflare`)
5. **Smoke test:** homepage, age gate, sign-in, Play/outbound, admin login.
6. **Optional:** DigitalOcean Cloud Firewall allow **443 only from [Cloudflare IP ranges](https://www.cloudflare.com/ips/)** so the origin IP is not a bypass path.

Store the zone ID and API tokens in your password manager — **not** in git. Use scoped API tokens if you automate DNS later.

## During nameserver propagation

TTL flips can cause mixed old/new resolver behavior for up to 24–48 hours. Prefer scheduling registrar/NS changes in **[owner maintenance windows](autonomous-ops.md#human-scheduled-changes-dns-deploy-maintenance)** when possible.

## App-level security (origin)

Even behind Cloudflare, the app sets baseline security headers in middleware (`src/lib/security-headers.ts`) and rate limits abusive POST APIs. Cloudflare free tier adds network DDoS absorption; tune **WAF / rate limiting rules** in the dashboard for edge-specific rules.
