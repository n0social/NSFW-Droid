# Creator hub — top SFM models

**Route:** `/creators/models`  
**Nav:** Creators → **SFM models**

## Purpose

Help creators jump straight to **high-traffic NSFW SFM models** on **SmutBase** (Open3DLab). Cards show a local preview image and open the SmutBase project in a new tab.

## Data

- `src/lib/sfm-models-curated.ts` — top 10 list, `projectId` UUIDs, optional `previewImageSrc` under `public/creator-models/`
- `src/lib/smutbase-url.ts` — outbound URLs use **`https://smutba.se/project/{uuid}/`** (same network as SmutBase; `smutbase.com` may redirect incorrectly from some networks)

## Previews (SFW MVP)

Card images are **SFW** **solo-character** marketing art (per-character Steam screenshots, Square Enix / Blizzard hero key art, Capcom portrait via Wikimedia, or a generated silhouette for Aunt Cass). They live in `public/creator-models/{id}.webp`.

```bash
node scripts/fetch-sfm-model-sfw-mvp.mjs
```

Source URLs and license notes: `scripts/sfm-model-sfw-sources.json`. Artifacts: `/opt/cursor/artifacts/sfm-model-mvp-sfw/`.

Review locally:

```bash
node scripts/build-sfm-model-sfw-pick-review.mjs
```

Tunneled pick retry (SFW MVP options per row):

```bash
node scripts/build-sfm-model-sfw-pick-submit.mjs
node scripts/sfm-model-pick-server.mjs
```

Until images exist, cards show a gradient fallback.

## Legacy NSFW pick workflow (deprecated for cards)

SmutBase gallery thumb scraping (`scripts/scrape-sfm-model-previews.mjs`, `build-sfm-model-pick-gallery.mjs`) was used for early NSFW candidate picks. **Do not use those thumbs for production card MVPs.**

## Verification

```bash
npx tsx scripts/verify-sfm-models.ts
```

## Roadmap (same hub)

- NSFW sound packs, tutorials, Blender/Ren’Py links — separate sections, not mixed into the top-10 grid.
