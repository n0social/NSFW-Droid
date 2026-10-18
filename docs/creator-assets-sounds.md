# Creator assets — sounds & VO

**Last updated:** 17 October 2026

Curated outbound links for **NSFW sound effects**, **moan/voice libraries**, and **SFMLab audio** used by adult game devs and SFM editors. NSFW Droid does not host audio files.

## Public route

- **Hub stub:** `/creators/assets` (section anchor `#sounds`)
- **Source data:** `src/lib/creator-assets-sounds-curated.ts`
- **Hub export:** `exportCreatorAssetsHub()` in `src/lib/creator-assets-hub.ts` (for future static export / ingest)

## Categories

| Key | Purpose |
| --- | --- |
| `sfx-packs` | Non-vocal or mixed sex/erotic SFX for games (includes itch.io tag browse) |
| `voice-moans` | Moans, dialogue, and VO packs |
| `sfm-sounds` | Classic SFMLab projects (WAV, SFM install paths) |

## Verify links

After adding or changing URLs:

```bash
npm run creators:verify-assets-sounds
```

itch.io may return **429** to automated probes — the script treats that as OK. SFMLab **403** bot walls are also accepted when the host is known.

## Navigation

**Creators** header dropdown includes **Creator assets** → `/creators/assets`.

Sibling sections on the same hub: **SFM tutorials** (`#tutorials`, live — see [creator-assets-sfm-tutorials.md](creator-assets-sfm-tutorials.md)); **Blender & files** (`#blender`, coming soon).

## Revision log

| Date | Change |
| --- | --- |
| 2026-10-17 | Initial 12-link sounds curation, verify script, assets hub stub |
