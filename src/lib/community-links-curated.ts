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
    blurb: "Streaming catalog for hentai anime (video, not games).",
    href: "https://hanime.tv/",
    category: "animated-hentai",
  },
  {
    id: "sfmlab",
    name: "SFMLab",
    blurb: "Model and asset sharing for Source Filmmaker creators.",
    href: "https://sfmlab.com/",
    category: "sfm-3d",
  },
  {
    id: "rule34video",
    name: "Rule34video",
    blurb: "Large index of animated and SFM-style adult video clips.",
    href: "https://rule34video.com/",
    category: "sfm-3d",
  },
];

export function communityLinksByCategory(
  category: CommunityLinkCategory,
): CuratedCommunityLink[] {
  return CURATED_COMMUNITY_LINKS.filter((l) => l.category === category);
}
