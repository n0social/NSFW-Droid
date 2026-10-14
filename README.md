# NSFW-Droid

Adult (18+) game **catalog** — link-out first, DigitalOcean in production. This repo now includes a **working storefront preview** with real itch.io feed data.

## Secrets

Do not commit API keys or `.env` files. Use `.env.example` locally; see [SECURITY.md](SECURITY.md).

## GitHub (private)

Create a **private** repository and push `main` — step-by-step: [docs/github-setup.md](docs/github-setup.md). Dependabot is optional; you can skip it for now.

## Production (DigitalOcean)

Live domain: **https://www.nsfwdroid.com** on droplet `159.203.136.220`. Deploy checklist: [docs/deploy-droplet.md](docs/deploy-droplet.md) (DNS, Caddy, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `/etc/nsfwdroid.env`).

## Quick start (storefront + data)

```bash
npm install
npm run ingest        # itch.io + Steam → candidates (auto-publish when TOS-clear)
npm run dev           # http://localhost:3847
```

- **Age gate:** “Are you over 18?” **Yes** / **No** — backdrop is not dismissible.
- **Blur:** Covers are **blurred by default**. If age is not confirmed, blur stays on (anti-bypass). After **Yes**, use **Blur covers: ON/OFF** in the header to test unblurred titles.
- **Data:** itch.io RSS (default: **new/featured/sales + NSFW tag browses**, ~300–500 unique titles per full ingest) and Steam storesearch → **candidates** with **auto-extracted tags** (`tag` / `listing_tag`); production auto-publishes when TOS-clear (`docs/tos-review-policy.md`). **TOS holds** and strict mode: `/admin` (set `ADMIN_PASSWORD`). Developers submit at `/submit`.
- **Rankings:** Outbound clicks (`/api/go/…`) and card views feed **Hottest** / **Trending** rails — your traffic, not store charts.
- **Auto-publish:** `AUTO_PUBLISH=1` on production droplet; `DEMO_AUTO_PUBLISH=1` for local mockups. `INGEST_REQUIRE_REVIEW=1` forces manual approval for everything.

Local DB is **PGlite** (`data/catalog/`). Production target: **DigitalOcean Managed PostgreSQL** (`docs/data-and-ingest.md`).

## Documentation

| Doc | Contents |
| --- | --- |
| [docs/hosting.md](docs/hosting.md) | **DigitalOcean** hosting |
| [docs/architecture.md](docs/architecture.md) | Website + app architecture |
| [docs/data-and-ingest.md](docs/data-and-ingest.md) | Postgres schema, feed workers |
| [docs/themes.md](docs/themes.md) | Holiday color packs (UTC month auto-apply, signed-in opt-out) |
| [docs/account-roadmap.md](docs/account-roadmap.md) | Player accounts (Phase 1b shipped) |
| [docs/firebase-setup.md](docs/firebase-setup.md) | Firebase Auth + session cookie env |
| [docs/design-layout.md](docs/design-layout.md) | UI wireframes |
| [docs/how_we_get_links.md](docs/how_we_get_links.md) | itch, Steam, affiliate ingestion |
| [docs/considerations.md](docs/considerations.md) | Link vs distribute rights |
| [docs/revenue_streams.md](docs/revenue_streams.md) | Revenue |
| [docs/design-and-mascot.md](docs/design-and-mascot.md) | Brand (Vesper) |

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js on port **3847** |
| `npm run ingest` | Migrate + **itch** + **Steam** + tag backfill |
| `npm run ingest:itch` | itch.io RSS (see `.env.example` feed env vars) |
| `npm run ingest:steam` | Steam storesearch + adult descriptor filter |
| `npm run db:migrate` | Apply Drizzle migrations to PGlite |

## Docker (optional)

`docker-compose.yml` is for **Managed Postgres-style** local testing on DigitalOcean deploy; the default dev path uses PGlite without Docker.
