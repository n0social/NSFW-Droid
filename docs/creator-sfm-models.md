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

## Verification

```bash
npx tsx scripts/verify-sfm-models.ts
```

## Roadmap (same hub)

- NSFW sound packs, tutorials, Blender/Ren’Py links — separate sections, not mixed into the top-10 grid.
