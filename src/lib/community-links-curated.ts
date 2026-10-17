export type CommunityLinkCategory =
  | "game-catalogs"
  | "game-communities"
  | "animated-hentai"
  | "sfm-3d";

export type CuratedCommunityLink = {
  id: string;
  name: string;
  blurb: string;
  href: string;
  category: CommunityLinkCategory;
};

export const COMMUNITY_LINK_GROUPS: {
  key: CommunityLinkCategory;
  label: string;
  hint: string;
}[] = [
  {
    key: "game-catalogs",
    label: "Game catalogs & stores",
    hint: "Directories, databases, and storefront hubs for adult games (not tube sites).",
  },
  {
    key: "game-communities",
    label: "NSFW game communities",
    hint: "Forums and discussion focused on adult games, patches, and dev news.",
  },
  {
    key: "animated-hentai",
    label: "Animated & hentai",
    hint: "Major streaming/catalog sites for 18+ anime — separate from our game listings.",
  },
  {
    key: "sfm-3d",
    label: "SFM & 3D animation",
    hint: "Communities and archives for Source Filmmaker and related 3D adult animation.",
  },
];

/**
 * Outbound community links — edit freely. No affiliate params unless disclosed on partner site.
 * After edits: `npx tsx scripts/verify-creators-links.ts`
 */
export const CURATED_COMMUNITY_LINKS: CuratedCommunityLink[] = [
  {
    id: "itch-nsfw",
    name: "itch.io — NSFW games",
    blurb: "Official browse feed for mature-tagged indie games.",
    href: "https://itch.io/games/tag-nsfw",
    category: "game-catalogs",
  },
  {
    id: "vndb",
    name: "VNDB",
    blurb: "Visual Novel Database — metadata and links for VNs worldwide.",
    href: "https://vndb.org/",
    category: "game-catalogs",
  },
  {
    id: "dlsite-en",
    name: "DLsite (English)",
    blurb: "Major digital store for Japanese and indie adult games and assets.",
    href: "https://www.dlsite.com/home/",
    category: "game-catalogs",
  },
  {
    id: "nutaku",
    name: "Nutaku",
    blurb: "Browser and mobile adult games storefront.",
    href: "https://www.nutaku.net/",
    category: "game-catalogs",
  },
  {
    id: "steam-adult-tag",
    name: "Steam — Sexual Content hub",
    blurb: "Valve’s public landing for mature-themed games on Steam.",
    href: "https://store.steampowered.com/tags/en/Sexual%20Content/492/",
    category: "game-catalogs",
  },
  {
    id: "f95",
    name: "F95zone",
    blurb: "Large community forum for adult games, updates, and translations.",
    href: "https://f95zone.to/",
    category: "game-communities",
  },
  {
    id: "ulmf",
    name: "ULMF",
    blurb: "Long-running forum for text-heavy and indie adult games.",
    href: "https://www.ulmf.org/",
    category: "game-communities",
  },
  {
    id: "hanime",
    name: "hanime.tv",
    blurb: "HD streaming catalog for hentai anime (video, not games).",
    href: "https://hanime.tv/",
    category: "animated-hentai",
  },
  {
    id: "hentai-haven",
    name: "Hentai Haven",
    blurb: "Long-running hentai streaming tube (episodes and clips).",
    href: "https://hentaihaven.org/",
    category: "animated-hentai",
  },
  {
    id: "hentai-tv",
    name: "Hentai.tv",
    blurb: "Anime-style adult video streaming hub.",
    href: "https://hentai.tv/",
    category: "animated-hentai",
  },
  {
    id: "nhentai",
    name: "nHentai",
    blurb: "Huge free doujinshi and hentai manga archive (read online).",
    href: "https://nhentai.net/",
    category: "animated-hentai",
  },
  {
    id: "hentaifox",
    name: "HentaiFox",
    blurb: "Popular hentai manga and doujin reader.",
    href: "https://hentaifox.com/",
    category: "animated-hentai",
  },
  {
    id: "sfmlab",
    name: "SFMLab",
    blurb: "SFM models and assets (Open3DLab network; same login as SmutBase). Turn on NSFW in account settings.",
    href: "https://sfmlab.com/",
    category: "sfm-3d",
  },
  {
    id: "sfmlab-nsfw",
    name: "SFMLab — NSFW hub",
    blurb: "Popular public NSFW Blender/SFM model collection on SFMLab (explicit content).",
    href: "https://sfmlab.com/list/07897729-977b-4d8e-b88f-3e92a1445181/",
    category: "sfm-3d",
  },
  {
    id: "sfmcompile",
    name: "SFMCompile",
    blurb: "Curated archive of Source Filmmaker adult animations (game characters).",
    href: "https://sfmcompile.club/",
    category: "sfm-3d",
  },
  {
    id: "naughty-machinima",
    name: "Naughty Machinima",
    blurb: "Hosted 3D machinima and SFM porn from community creators.",
    href: "https://naughtymachinima.com/",
    category: "sfm-3d",
  },
  {
    id: "rule34video",
    name: "Rule34video",
    blurb: "Large index of animated, hentai, and SFM-style adult clips.",
    href: "https://rule34video.com/",
    category: "sfm-3d",
  },
];

export function communityLinksByCategory(
  category: CommunityLinkCategory,
): CuratedCommunityLink[] {
  return CURATED_COMMUNITY_LINKS.filter((l) => l.category === category);
}
