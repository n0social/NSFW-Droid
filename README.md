# NSFW-Droid

Adult (18+) game **catalog** — link-out first, DigitalOcean in production. This repo now includes a **working storefront preview** with real itch.io feed data.

## Secrets

Do not commit API keys or `.env` files. Use `.env.example` locally; see [SECURITY.md](SECURITY.md).

## GitHub (private)

Create a **private** repository and push `main` — step-by-step: [docs/github-setup.md](docs/github-setup.md). Dependabot is optional; you can skip it for now.

## Quick start (storefront + data)

```bash
npm install
npm run ingest        # itch.io + Steam (+ affiliate JSON if present) → listings
npm run dev           # http://localhost:3847
```

- **Age gate:** “Are you over 18?” **Yes** / **No** — backdrop is not dismissible.
- **Blur:** Covers are **blurred by default**. If age is not confirmed, blur stays on (anti-bypass). After **Yes**, use **Blur covers: ON/OFF** in the header to test unblurred titles.
- **Data:** Titles and links come from [itch.io new uploads RSS](https://itch.io/feed/new.xml) (not HTML scraping). `DEMO_AUTO_PUBLISH=1` publishes the queue for the mockup; production uses human review.

Local DB is **PGlite** (`data/catalog/`). Production target: **DigitalOcean Managed PostgreSQL** (`docs/data-and-ingest.md`).

## Documentation

| Doc | Contents |
| --- | --- |
| [docs/hosting.md](docs/hosting.md) | **DigitalOcean** hosting |
| [docs/architecture.md](docs/architecture.md) | Website + app architecture |
| [docs/data-and-ingest.md](docs/data-and-ingest.md) | Postgres schema, feed workers |
| [docs/design-layout.md](docs/design-layout.md) | UI wireframes |
| [docs/how_we_get_links.md](docs/how_we_get_links.md) | itch, Steam, affiliate ingestion |
| [docs/considerations.md](docs/considerations.md) | Link vs distribute rights |
| [docs/revenue_streams.md](docs/revenue_streams.md) | Revenue |
| [docs/design-and-mascot.md](docs/design-and-mascot.md) | Brand (Vesper) |

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js on port **3847** |
| `npm run ingest` | Migrate + **itch** + **Steam** + optional **affiliate** file |
| `npm run ingest:itch` | itch.io RSS only |
| `npm run ingest:steam` | Steam only (`STEAM_WEB_API_KEY` or store search fallback) |
| `npm run ingest:affiliate` | `data/affiliate-export.json` (copy from `.example`) |
| `npm run db:migrate` | Apply Drizzle migrations to PGlite |

## Docker (optional)

`docker-compose.yml` is for **Managed Postgres-style** local testing on DigitalOcean deploy; the default dev path uses PGlite without Docker.
