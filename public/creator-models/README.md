# SFM model card previews (`/creators/models`)

Place **WebP or JPEG** preview images here — one per model id in `src/lib/sfm-models-curated.ts`:

| File | Model id |
| --- | --- |
| `tifa-lockhart.webp` | `tifa-lockhart` |
| `widowmaker.webp` | `widowmaker` |
| … | … |

**Source:** Use the model’s **official preview** from its SmutBase/SFMLab project page (screenshot or uploader-provided preview). Do not hotlink third-party CDNs in production if they block embeds.

**Rights:** Link-out catalog only; we are not redistributing the `.mdl` files.

After adding images, hard-refresh `/creators/models` and run `npx tsx scripts/verify-sfm-models.ts`.
