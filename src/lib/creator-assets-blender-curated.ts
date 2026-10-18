export type CreatorAssetsBlenderCategory =
  | "environment-hubs"
  | "scene-collections"
  | "itch-assets"
  | "patreon-studios";

export type CuratedCreatorAssetsBlenderLink = {
  id: string;
  name: string;
  blurb: string;
  href: string;
  category: CreatorAssetsBlenderCategory;
};

export const CREATOR_ASSETS_BLENDER_GROUPS: {
  key: CreatorAssetsBlenderCategory;
  label: string;
  hint: string;
}[] = [
  {
    key: "environment-hubs",
    label: "Environment hubs",
    hint: "Open3DLab / SmutBase indexes and community collection directories (maps, rooms, props).",
  },
  {
    key: "scene-collections",
    label: "Curated scene packs",
    hint: "High-signal user lists of Blender-ready locations and stages for adult renders.",
  },
  {
    key: "itch-assets",
    label: "itch.io 3D assets",
    hint: "Storefront browse feeds and open projects with Blender environment workflows.",
  },
  {
    key: "patreon-studios",
    label: "Patreon & studio pages",
    hint: "Notable creators who ship Blender location files or scene archives (paid tiers; link-out only).",
  },
];

/**
 * Curated outbound links for NSFW Blender locations, maps, and environment assets.
 * Files stay on third-party hosts — we only link out.
 *
 * Planned UI: `/creators/assets#blender` on the creator assets hub. Import
 * `CURATED_CREATOR_ASSETS_BLENDER` when that section ships.
 *
 * After edits: `npm run creators:verify-blender-assets`
 */
export const CURATED_CREATOR_ASSETS_BLENDER: CuratedCreatorAssetsBlenderLink[] = [
  {
    id: "open3dlab-collections",
    name: "Open3DLab — public collections",
    blurb: "Community-curated lists of maps, rooms, and props; good starting point before keyword search.",
    href: "https://open3dlab.com/collections/",
    category: "environment-hubs",
  },
  {
    id: "open3dlab-maps",
    name: "Open3DLab — Maps (Naga6Kiwi)",
    blurb: "Large rolling collection of game-derived and original Blender environments (Cyberpunk, RE, cozy interiors, etc.).",
    href: "https://open3dlab.com/list/92a9ff75-ccc0-4c10-81d8-22bef301f67b/",
    category: "environment-hubs",
  },
  {
    id: "smutbase-home",
    name: "SmutBase",
    blurb: "NSFW sibling of the Open3DLab network — same accounts, explicit uploads enabled in profile settings.",
    href: "https://smutba.se/",
    category: "environment-hubs",
  },
  {
    id: "smutbase-stages-blender",
    name: "SmutBase — Stages for Blender",
    blurb: "1,700+ environments, maps, and stage props curated for Blender scenes (LoveEuphoria list).",
    href: "https://smutba.se/list/1eed4e69-a689-4c37-8537-a6605b90f4e4/",
    category: "scene-collections",
  },
  {
    id: "open3dlab-rooms-places",
    name: "Open3DLab — rooms/places",
    blurb: "Anthony’s public list of bedrooms, clubs, apartments, and franchise interiors for stills and animation.",
    href: "https://open3dlab.com/list/ad82034c-723d-4413-9a85-fa6340fa6c1c/",
    category: "scene-collections",
  },
  {
    id: "open3dlab-bg-re-maps",
    name: "Open3DLab — BG (RE & franchise maps)",
    blurb: "351-item background pack heavy on ubermachine Resident Evil ports plus other franchise locations.",
    href: "https://open3dlab.com/list/47e0adbe-2609-4fa0-ba6d-5f2d19d444da/",
    category: "scene-collections",
  },
  {
    id: "open3dlab-environment-picks",
    name: "Open3DLab — environment picks",
    blurb: "Smaller curated set mixing NSFW props (milking tables, clubs) with iconic game interiors.",
    href: "https://open3dlab.com/list/8e41c65f-43d8-4cf0-bff4-8712d3348e22/",
    category: "scene-collections",
  },
  {
    id: "itch-nsfw-blender",
    name: "itch.io — NSFW Blender assets",
    blurb: "Official mature-tagged asset browse; filter for rooms, asset packs, and scene kits.",
    href: "https://itch.io/game-assets/nsfw/tag-blender",
    category: "itch-assets",
  },
  {
    id: "itch-nsfw-3d",
    name: "itch.io — NSFW 3D assets",
    blurb: "Broader 3D environment and prop feed when a project is not tagged Blender specifically.",
    href: "https://itch.io/game-assets/nsfw/tag-3d",
    category: "itch-assets",
  },
  {
    id: "itch-land-of-desire",
    name: "Land of Desire (Kertero)",
    blurb: "Open-source adult sim that loads custom `.blend` characters, outfits, and environments from folders.",
    href: "https://kertero.itch.io/land-of-desire",
    category: "itch-assets",
  },
  {
    id: "patreon-holopointz",
    name: "Holopointz 3D — Patreon",
    blurb: "Cyberpunk 2077 and Phantom Liberty location ports; supporter archive of 100+ Blender scene files.",
    href: "https://www.patreon.com/cw/holopointz",
    category: "patreon-studios",
  },
  {
    id: "sfmlab-stages-blender",
    name: "SFMLab — Stages for Blender",
    blurb: "Same LoveEuphoria stage list on the SFM-oriented host (Open3DLab login); useful if you already browse SFMLab.",
    href: "https://sfmlab.com/list/1eed4e69-a689-4c37-8537-a6605b90f4e4/",
    category: "scene-collections",
  },
  {
    id: "open3dlab-blender-favored",
    name: "Open3DLab — Blender Favored",
    blurb: "~330-item community list biased toward Blender-usable ports (characters and scenes, not just maps).",
    href: "https://open3dlab.com/list/3e36efee-8586-495d-ba6b-d283bb0b39d8/",
    category: "environment-hubs",
  },
  {
    id: "open3dlab-recommendations-smutbase",
    name: "Open3DLab — My Recommendations (Smutbase Edition)",
    blurb: "Editor-curated “best and wacky” Blender NSFW models when environment lists feel too samey.",
    href: "https://open3dlab.com/list/4884c443-4af3-403d-a34d-0c55ef14251f/",
    category: "scene-collections",
  },
  {
    id: "itch-nsfw-rigged",
    name: "itch.io — NSFW rigged assets",
    blurb: "Official mature + rigged tag browse — surfaces characters and props outside Open3DLab mega-lists.",
    href: "https://itch.io/game-assets/tag-nsfw/tag-rigged",
    category: "itch-assets",
  },
];

export function creatorAssetsBlenderByCategory(
  category: CreatorAssetsBlenderCategory,
): CuratedCreatorAssetsBlenderLink[] {
  return CURATED_CREATOR_ASSETS_BLENDER.filter((l) => l.category === category);
}
