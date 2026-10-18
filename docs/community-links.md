# Community links page (`/links`)

**Last updated:** 17 October 2026

Public route: **https://www.nsfwdroid.com/links** — curated outbound URLs for NSFW **game catalogs**, **communities**, **animated/hentai**, and **SFM/3D** hubs (not general tube roundups).

## Navigation

**Creators** in the site header opens a dropdown:

- **Studios & games** → `/creators`
- **Creator assets** → `/creators/assets` (sounds & VO — see [creator-assets-sounds.md](creator-assets-sounds.md))
- **SFM tutorials** → `/creators/tutorials` ([creator-assets-sfm-tutorials.md](creator-assets-sfm-tutorials.md))
- **Community links** → `/links`

## Editing the list

Source: `src/lib/community-links-curated.ts`

| Category key | Purpose |
| --- | --- |
| `game-catalogs` | Directories, databases, storefront hubs |
| `game-communities` | Forums focused on adult games |
| `animated-hentai` | Hentai/anime streaming catalogs |
| `sfm-3d` | SFM and 3D animation archives |

After adding or changing URLs:

```bash
npx tsx scripts/verify-creators-links.ts
```

## Directory outreach

When you email adult **game catalog** directories ([directory-submissions.md](directory-submissions.md)), you can mention that NSFW Droid maintains a reciprocal **Community links** page for other hubs in the same niche (not a link exchange requirement — editorial only).

## Revision log

| Date | Change |
| --- | --- |
| 2026-10-17 | Initial `/links` page, header dropdown, curated data file |
| 2026-10-17 | Expanded hentai + SFM hubs (Porn Dude–aligned picks; SFMLab + SmutBase, SFMCompile) |
