# Database and ingest (feeds, not scrapers)

**Date:** 14 October 2026  
**Status:** specification for implementation.  
**Related:** `docs/how_we_get_links.md`, `docs/architecture.md`, `docs/considerations.md`.

---

## Terminology

| Term we use | Meaning |
| --- | --- |
| **Ingest worker** | Scheduled job that reads **official feeds/APIs** and writes **candidates** |
| **Crawler / scraper** | HTML page parsing — **out of scope** for v1 (policy, breakage, rights) |

We do **not** crawl Steam store HTML, Nutaku pages, or forum mirrors. We pull **RSS**, **Steam Web API**, **affiliate exports**, and **developer form** posts.

---

## Database (Postgres)

Runs on **DigitalOcean** in production (Managed PostgreSQL + Droplet workers). **Local dev** uses **PGlite** (`data/catalog/`) with the same Drizzle schema — run `npm run ingest:itch`. Optional `docker-compose.yml` for Postgres. No DO account required to build or test ingest.

### Core tables

```text
ingest_source          -- config: name, enabled, cursor, last_run_at, last_error
candidate              -- pre-public rows from any source (review queue)
listing                -- public catalog (approved)
listing_click          -- outbound analytics
ingest_run             -- optional audit log per job execution
developer_submission   -- form PII, links to candidate
```

### `candidate` (review queue)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | PK |
| `source` | enum | `itch`, `steam`, `affiliate_export`, `developer_form` |
| `external_id` | text | itch game id, Steam app id, affiliate sku, etc. |
| `title` | text | from feed |
| `outbound_url` | text | official page URL |
| `first_seen_at` | timestamptz | |
| `raw_payload` | jsonb | full feed/API snippet for reviewers |
| `review_status` | enum | `pending`, `approved`, `rejected` |
| `reviewed_at` | timestamptz | |
| `reviewed_by` | text | staff id |
| `reject_reason` | text | internal |

**Unique:** `(source, external_id)` — dedupe.

### `listing` (public)

Extends approved candidate fields plus:

| Column | Type | Notes |
| --- | --- | --- |
| `slug` | text | unique URL |
| `platforms` | text[] | `windows`, `browser`, `android`, … |
| `official_url` | text | |
| `affiliate_url` | text | nullable |
| `artwork_source` | enum | `typographic`, `affiliate_kit`, `licensed_upload` |
| `sponsorship` | jsonb | `{ "type": "featured", "until": "…" }` or null |
| `link_status` | enum | `ok`, `broken` |
| `published_at` | timestamptz | |
| `chart_rank` | int | nullable — **editorial / affiliate “top”** until real revenue data exists |
| `chart_bucket` | text | nullable — `top_grossing`, `new`, … for home rails |

**Top grossing rail (UI):** v1 ranks come from **manual curation**, **affiliate program “top” exports**, or **outbound click velocity** computed in our DB — not from scraping Nutaku’s charts.

### `ingest_source` (cursor state)

| Column | Example |
| --- | --- |
| `name` | `itch_new_xml` |
| `cursor` | jsonb: `{ "last_guid": "…" }` or `{ "last_modified_since": 1730000000 }` |
| `schedule` | cron expression |
| `enabled` | boolean |

### `listing_click` (for “popular” later)

`listing_id`, `url_type`, `created_at`, optional coarse `country` — aggregate for “Popular now” without third-party charts.

---

## Ingest pipeline

```mermaid
flowchart LR
  subgraph sources [External — no login bypass]
    itch[itch.io RSS new.xml]
    steam[Steam GetAppList + details]
    aff[Affiliate CSV/API]
    form[Developer form]
  end

  subgraph dovm [DO Droplet — cron/systemd]
    job[Ingest worker]
  end

  subgraph db [Postgres]
    cand[(candidate)]
    list[(listing)]
  end

  itch --> job
  steam --> job
  aff --> job
  form --> job
  job --> cand
  cand -->|human approve| list
```

**CLI:** `npm run ingest` runs itch + Steam + affiliate file, then demo auto-publish when `DEMO_AUTO_PUBLISH=1`. Per-source: `ingest:itch`, `ingest:steam`, `ingest:affiliate`.

### Job 1: itch.io (`itch_new_xml`)

- **GET** `https://itch.io/feed/new.xml` (public RSS).
- Parse `item` → `title`, `link`, `guid`, `pubDate`.
- `INSERT … ON CONFLICT (source, external_id) DO NOTHING` into `candidate`.
- Rate: once per day (or every 6h); polite `User-Agent` identifying the catalog.
- **No** HTML scrape of project pages.

### Job 2: Steam (`steam_app_delta`)

Implemented in `scripts/ingest-steam.ts`.

- **With `STEAM_WEB_API_KEY`:** `IStoreService/GetAppList` delta, then per-app `appdetails`.
- **Without key (dev/demo):** merges `data/steam-seed-appids.json` + Steam **storesearch** JSON (`cc=us`) + `appdetails` filter.
- **Adult filter:** Steam content descriptor **#3 (Adult Only Sexual Content)** only — not every game with mild nudity.
- Rows → `candidate` (`source = steam`), `platforms` from Steam (windows/mac/linux).
- Production still uses **human review** before public listings unless `DEMO_AUTO_PUBLISH=1`.

#### Steam Web API key

Optional for production-style deltas. Register the key in Steamworks using your **production domain** (apex or `www` — no `https://`). Store the key only in **local `.env`** (gitignored) or your host’s secret/env UI. **Do not** put keys, tokens, or connection strings in this repository or in markdown docs.

### Job 3: Affiliate export (`affiliate_*`)

Implemented in `scripts/ingest-affiliate.ts`.

- Copy `data/affiliate-export.example.json` → `data/affiliate-export.json` when a program gives you an export.
- Fields: `external_id`, `title`, `outbound_url`, optional `affiliate_url`.
- **No** scraping partner storefront HTML (Nutaku, etc.).

### Job 4: Developer form

- HTTP POST from site → `developer_submission` + `candidate` (`source = developer_form`).

### Job 5: Link health (weekly)

- HEAD/GET `official_url` / `affiliate_url` on `listing`.
- Set `link_status = broken` on repeated failures.

### Review → publish

Staff UI: approve candidate → create `listing`, assign `slug`, platforms, artwork policy, optional `chart_rank` for **Top grossing** rail.

---

## What runs where

| Environment | Postgres | Ingest jobs | Needs DigitalOcean? |
| --- | --- | --- | --- |
| **This repo / your laptop** | Docker Compose | `npm run ingest` manually | **No** |
| **Cursor Cloud Agent VM** | Docker Compose | same — can hit public RSS/API | **No** |
| **Staging / production** | DO Managed PostgreSQL | cron on Droplet | **Yes**, when you deploy |

---

## Do you need DigitalOcean access now?

**No — not for design, schema, app code, or ingest development.** You already have a DO account; we only need credentials when you want a live Droplet.

| Task | DigitalOcean access |
| --- | --- |
| Docs, UI wireframes, Next.js scaffold | Not needed |
| Postgres schema + migrations | Local Docker |
| itch.io ingest (public RSS) | Runs from dev machine or Cloud Agent |
| Steam ingest | Needs **Steam Web API key** only |
| Production domain, TLS, cron 24/7 | **Droplet + Managed DB** when you go live |

**Deploy credentials** (API tokens, DB URLs, Steam key, etc.) are configured on the host or in a private password manager — **never** committed to GitHub. See [SECURITY.md](../SECURITY.md).

**We are not on your Droplet today.** Work happens in this repo and the Cloud Agent environment until you provision infrastructure and we add `infra/` deploy scripts (or you run `docker compose up` locally).

---

## Implementation order

1. Docker Compose: Postgres + Redis.
2. Migrations: `candidate`, `listing`, `ingest_source`, `listing_click`.
3. CLI: `ingest itch` (single run, logs counts).
4. Admin: candidate queue + approve.
5. Steam job after API key exists.
6. Deploy worker + web to DigitalOcean when catalog is ready to be public.
