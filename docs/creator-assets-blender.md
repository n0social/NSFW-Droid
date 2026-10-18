# Curated Blender environment links (data)

**Last updated:** 17 October 2026

Outbound catalog for adult **Blender locations**, **maps**, and **3D environment assets** aimed at SFM/game-animation creators. We do not host `.blend` files or mirror downloads.

## Source file

`src/lib/creator-assets-blender-curated.ts`

| Category key | Purpose |
| --- | --- |
| `environment-hubs` | Open3DLab / SmutBase indexes and collection directories |
| `scene-collections` | High-signal public lists (stages, rooms, franchise maps) |
| `itch-assets` | itch.io browse feeds and open Blender-friendly projects |
| `patreon-studios` | Creator campaigns that distribute location `.blend` archives |

## UI status

No dedicated route on `main` yet. Sibling work adds **`/creators/assets#blender`** on the creator assets hub; until that merges, import `CURATED_CREATOR_ASSETS_BLENDER` directly.

## Maintainer notes

- **Link-out only** — no affiliate query params unless the destination adds them server-side.
- **Skip tube sites** — asset hosts, storefronts, and creator pages only.
- Prefer **collections** and **official browse URLs** over single project deep links.
- Open3DLab and SmutBase share accounts; SmutBase lists may contain explicit previews.
- itch.io category URLs are stable; individual asset pages churn quickly.

### Verification

```bash
npm run creators:verify-blender-assets
```

Also run after bulk edits:

```bash
npm run build
```

`sfmlab.com`, `smutba.se`, `open3dlab.com`, and `patreon.com` may return **403** to automated probes; the verify script treats those hosts as bot-wall OK.

### Overlap with `/links`

| Topic | Where to edit |
| --- | --- |
| General SFM communities, compile archives | `src/lib/community-links-curated.ts` (`sfm-3d`) |
| Blender **environments** and scene packs | `src/lib/creator-assets-blender-curated.ts` |

## Revision log

| Date | Change |
| --- | --- |
| 2026-10-17 | Initial curated data file (12 links) and verify script |
