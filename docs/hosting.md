# Hosting platform: DigitalOcean

**Date:** 14 October 2026  
**Decision:** Production runs on **DigitalOcean** (existing account). Vultr was an early default in planning docs; after comparing AUPs, DO is **not stricter** for lawful fictional adult catalog + licensed builds, and DO’s policy text is **narrower** on “unlawful pornography” (CSAM / non-consensual imagery) than Vultr’s broad “obscene / offensive” bucket.

**Not legal advice.** Confirm with DigitalOcean if you host large volumes of explicit binaries.

---

## Why DigitalOcean over Vultr (for this project)

| Factor | DigitalOcean | Vultr |
| --- | --- | --- |
| Account | You already have one | Would need new account |
| Lawful adult fiction (policy wording) | Illegal porn defined narrowly in AUP | Broader “offensive / obscene” language |
| Crawling / feeds | No impairing crawls; rights to hosted files | Same pattern |
| Compute | Droplets | Cloud Compute |
| DB | Managed PostgreSQL | Managed PostgreSQL |
| Build/APK storage (Phase 2) | **Spaces** (S3-compatible) | Object Storage |
| Firewall | Cloud Firewalls | Firewall groups |

Both forbid CSAM, non-consensual sexual imagery, disruptive crawling, and copyright infringement. Our ingest stays **RSS/API**, not HTML scrapers (`docs/data-and-ingest.md`).

**Primary AUP:** [DigitalOcean Acceptable Use Policy](https://www.digitalocean.com/legal/acceptable-use-policy) (last updated 20 March 2026).

**Production domain:** `https://www.nsfwdroid.com` (apex `nsfwdroid.com` served by the same Caddy config).  
**Droplet IP:** `159.203.136.220` — deploy steps: [deploy-droplet.md](deploy-droplet.md).

---

## DO product map

| Need | DigitalOcean product |
| --- | --- |
| Web + workers + Redis (Phase 1) | **Droplet** (e.g. 2 vCPU / 4 GB) |
| Postgres | **Managed Database for PostgreSQL** |
| TLS | **Caddy/nginx** on Droplet + Let’s Encrypt |
| Static assets / typographic templates | Spaces optional in Phase 1 |
| Game binaries + APK (Phase 2) | **Spaces** + signed URLs |
| Ingress lockdown | **Cloud Firewall** (443 public, 22 admin-only) |
| Optional PaaS later | App Platform (same account) |

---

## When we need your DigitalOcean access

| Phase | Need DO? |
| --- | --- |
| Docs, wireframes, local Docker | No |
| Implement app + ingest in repo | No |
| Staging/production deploy | **Yes** — API token or SSH to Droplet, Managed DB connection string, Spaces keys (Phase 2) |

We do **not** need credentials until you want a live Droplet. Configure secrets on the server or in your host’s env UI — **never** in this git repo ([SECURITY.md](../SECURITY.md)).

---

## Related

- Topology and deploy steps: `docs/architecture.md` → **Initial hosting on DigitalOcean**
- Data and ingest: `docs/data-and-ingest.md`
