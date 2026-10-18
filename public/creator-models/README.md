# SFM model card previews (`/creators/models`)

**SFW** marketing-style previews for the SmutBase link-out catalog (not SmutBase gallery thumbs).

| File | Model id |
| --- | --- |
| `tifa-lockhart.webp` | `tifa-lockhart` |
| `widowmaker.webp` | `widowmaker` |
| … | … |

## Regenerate

```bash
node scripts/fetch-sfm-model-sfw-mvp.mjs
```

Sources and license notes: `scripts/sfm-model-sfw-sources.json`. Downloaded originals + manifest:

`/opt/cursor/artifacts/sfm-model-mvp-sfw/{id}/`

Optional local review page:

```bash
node scripts/build-sfm-model-sfw-pick-review.mjs
# open /opt/cursor/artifacts/sfm-model-sfw-mvp-review.html
```

**Rights:** Card images are official Steam / Blizzard marketing art or a generated placeholder (Aunt Cass). We do not redistribute `.mdl` files; outbound links go to SmutBase.

After updates, hard-refresh `/creators/models` and run:

```bash
npx tsx scripts/verify-sfm-models.ts
```

## Legacy NSFW pick workflow

Older SmutBase thumb scraping (`scripts/scrape-sfm-model-previews.mjs`) is deprecated for MVP cards. See `docs/creator-sfm-models.md`.
