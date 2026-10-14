# NSFW-Droid

Adult (18+) game **catalog** — link-out first, DigitalOcean in production. This repo now includes a **working storefront preview** with real itch.io feed data.

## Quick start (storefront + data)

```bash
npm install
npm run ingest:itch   # PGlite DB + migrations + itch.io RSS → listings (demo auto-publish)
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
| `npm run ingest:itch` | Migrate + pull itch RSS into `listing` |
| `npm run db:migrate` | Apply Drizzle migrations to PGlite |

## Docker (optional)

`docker-compose.yml` is for **Managed Postgres-style** local testing on DigitalOcean deploy; the default dev path uses PGlite without Docker.
