# Creator hub — top SFM models

**Route:** `/creators/models`  
**Nav:** Creators → **SFM models**

## Purpose

Help creators jump straight to **high-traffic NSFW SFM models** on **SmutBase** (Open3DLab). Cards show a local preview image and open the SmutBase project in a new tab.

## Data

- `src/lib/sfm-models-curated.ts` — top 10 list, `projectId` UUIDs, optional `previewImageSrc` under `public/creator-models/`
- `src/lib/smutbase-url.ts` — outbound URLs use **`https://smutba.se/project/{uuid}/`** (same network as SmutBase; `smutbase.com` may redirect incorrectly from some networks)

## Previews

See `public/creator-models/README.md`. Until images exist, cards show a gradient fallback with the character name.

## Picking showcase images (agent workflow)

Scraped SmutBase gallery thumbs live **outside git** (Cloud Agent artifacts):

| Path | Contents |
| --- | --- |
| `/opt/cursor/artifacts/sfm-model-candidates/{id}/` | Original PNG thumbs (`candidate-1.png`, …) |
| `/opt/cursor/artifacts/sfm-model-candidates-nobg/{id}/` | Background-removed versions for card mockups |
| `/opt/cursor/artifacts/sfm-model-candidates/manifest.json` | Per-model candidate list + source URLs |

Regenerate the review page:

```bash
node scripts/build-sfm-model-pick-gallery.mjs
```

Open **`/opt/cursor/artifacts/sfm-model-pick-review.html`** (paths are relative to the `artifacts/` folder).

**Reply format** — one line per character:

```text
tifa-lockhart: candidate-2
widowmaker: candidate-1
```

Use the **character id** from `src/lib/sfm-models-curated.ts`, not the display name. Prefer standing / full-body nude previews when available.

After you pick, the agent copies the chosen no-bg (or original) asset into `public/creator-models/{id}.webp` and updates verification.

Re-scrape if candidates are missing:

```bash
node scripts/scrape-sfm-model-previews.mjs
node scripts/build-sfm-model-pick-gallery.mjs
```

## Verification

```bash
npx tsx scripts/verify-sfm-models.ts
```

## Roadmap (same hub)

- NSFW sound packs, tutorials, Blender/Ren’Py links — separate sections, not mixed into the top-10 grid.
