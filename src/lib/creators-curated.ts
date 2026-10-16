export type CuratedStudio = {
  id: string;
  name: string;
  blurb: string;
  href: string;
  /** Editorial grouping for the Studios section */
  group: "publisher" | "indie" | "platform";
};

export type CuratedGame = {
  id: string;
  title: string;
  blurb: string;
  href: string;
  store: "steam" | "itch" | "official" | "nutaku" | "patreon";
  genre: string;
};

export const CURATED_STUDIO_GROUPS: { key: CuratedStudio["group"]; label: string; hint: string }[] = [
  {
    key: "publisher",
    label: "Publishers & localization",
    hint: "Retail partners that ship adult titles to Steam and official stores.",
  },
  {
    key: "indie",
    label: "Indie studios",
    hint: "Long-running teams behind fan-favorite adult games and seasons.",
  },
  {
    key: "platform",
    label: "Creator hubs",
    hint: "Official pages where studios sell or update their catalog.",
  },
];

/**
 * Hand-picked studios — edit freely; outbound links only.
 * After edits, run: `npx tsx scripts/verify-creators-links.ts` (HEAD/GET each href).
 */
export const CURATED_STUDIOS: CuratedStudio[] = [
  {
    id: "kagura",
    name: "Kagura Games",
    blurb: "Localizes and publishes adult RPGs and visual novels for Steam and DLsite.",
    href: "https://kaguragames.com/",
    group: "publisher",
  },
  {
    id: "sekaiproject",
    name: "Sekai Project",
    blurb: "Publisher for mature visual novels and all-ages partners on Steam.",
    href: "https://sekaiproject.com/",
    group: "publisher",
  },
  {
    id: "mangagamer",
    name: "MangaGamer",
    blurb: "English publisher for Japanese adult VNs and indie partners.",
    href: "https://www.mangagamer.com/",
    group: "publisher",
  },
  {
    id: "criticalbliss",
    name: "Critical Bliss",
    blurb: "Indie-friendly publisher for lewd RPGs and narrative games.",
    href: "https://criticalbliss.itch.io/",
    group: "publisher",
  },
  {
    id: "wingedcloud",
    name: "Winged Cloud",
    blurb: "Sakura series and related anime-styled visual novels.",
    href: "https://store.steampowered.com/publisher/WingedCloud",
    group: "publisher",
  },
  {
    id: "lewdlab",
    name: "Lewd Lab",
    blurb: "Adult VN studio behind Treasure of Nadia and related titles.",
    href: "https://lewdlab.itch.io/",
    group: "indie",
  },
  {
    id: "team-nimbus",
    name: "Team Nimbus",
    blurb: "Cloud Meadow and other creature-collector style adult games.",
    href: "https://team-nimbus.itch.io/",
    group: "indie",
  },
  {
    id: "drpinkcake",
    name: "DrPinkCake",
    blurb: "Being a DIK and seasonal episodic college VNs.",
    href: "https://www.patreon.com/DrPinkCake",
    group: "indie",
  },
  {
    id: "darkcookie",
    name: "Dark Cookie",
    blurb: "Summertime Saga — long-running free-form dating sim.",
    href: "https://summertimesaga.com/",
    group: "indie",
  },
  {
    id: "oppai",
    name: "Oppai Games",
    blurb: "3D adult sims including Oppai Odyssey and related releases.",
    href: "https://oppaigames.itch.io/",
    group: "indie",
  },
  {
    id: "winterlook",
    name: "Winterlook Games",
    blurb: "Fantasy and corruption-themed RPGs on itch.io.",
    href: "https://winterlook-games.itch.io/",
    group: "indie",
  },
  {
    id: "kravenar",
    name: "Kravenar Games",
    blurb: "3D adventure and sandbox titles with regular chapter updates.",
    href: "https://www.patreon.com/Kravenar",
    group: "indie",
  },
  {
    id: "runey",
    name: "Runey",
    blurb: "Harem Hotel and related management sims.",
    href: "https://www.patreon.com/Runey",
    group: "indie",
  },
  {
    id: "melonberry",
    name: "Melonberry Studio",
    blurb: "Story-driven adult games with anime presentation.",
    href: "https://itch.io/profile/melonberry",
    group: "indie",
  },
  {
    id: "zeroangel",
    name: "ZeroAngel",
    blurb: "Breeding-focused sims and monster-collector experiments.",
    href: "https://itch.io/profile/zeroangel",
    group: "indie",
  },
  {
    id: "kinkoid",
    name: "Kinkoid",
    blurb: "Nutaku partner studio behind Lust Academy and related titles.",
    href: "https://nutaku.net/",
    group: "platform",
  },
  {
    id: "fenoxo",
    name: "Fenoxo",
    blurb: "Corruption of Champions lineage — text-heavy fantasy RPGs.",
    href: "https://fenoxo.com/",
    group: "platform",
  },
  {
    id: "majalis",
    name: "Majalis",
    blurb: "Tales of Androgyny and other gender-bender RPG experiments.",
    href: "https://majalis.itch.io/",
    group: "platform",
  },
];

export const CURATED_GAME_STORES: { key: CuratedGame["store"]; label: string }[] = [
  { key: "steam", label: "Steam" },
  { key: "itch", label: "itch.io" },
  { key: "official", label: "Official site" },
  { key: "nutaku", label: "Nutaku" },
  { key: "patreon", label: "Patreon" },
];

/**
 * Notable adult games — storefront links for discovery outside our catalog.
 * Re-verify with `npx tsx scripts/verify-creators-links.ts` when adding rows.
 */
export const CURATED_GAMES: CuratedGame[] = [
  {
    id: "being-a-dik",
    title: "Being a DIK",
    blurb: "Episodic college visual novel with branching routes.",
    href: "https://store.steampowered.com/app/1126320/Being_a_DIK/",
    store: "steam",
    genre: "Visual novel",
  },
  {
    id: "freshwomen",
    title: "FreshWomen",
    blurb: "Cinematic adult VN with motion-comic presentation.",
    href: "https://store.steampowered.com/app/1350650/FreshWomen__Season_1/",
    store: "steam",
    genre: "Visual novel",
  },
  {
    id: "summertime-saga",
    title: "Summertime Saga",
    blurb: "Sandbox dating sim with comic art and frequent updates.",
    href: "https://summertimesaga.com/",
    store: "official",
    genre: "Sandbox",
  },
  {
    id: "cloud-meadow",
    title: "Cloud Meadow",
    blurb: "Monster-collector farming sim with adult scenes.",
    href: "https://team-nimbus.itch.io/cloud-meadow",
    store: "itch",
    genre: "RPG / sim",
  },
  {
    id: "harem-hotel",
    title: "Harem Hotel",
    blurb: "Management sim with a large recurring cast.",
    href: "https://store.steampowered.com/app/1398740/Harem_Hotel/",
    store: "steam",
    genre: "Management sim",
  },
  {
    id: "carnal-instinct",
    title: "Carnal Instinct",
    blurb: "Open-world 3D exploration on an erotic fantasy map.",
    href: "https://store.steampowered.com/app/1399410/Carnal_Instinct/",
    store: "steam",
    genre: "3D adventure",
  },
  {
    id: "subverse",
    title: "Subverse",
    blurb: "Sci-fi shooter / strategy hybrid from Studio FOW.",
    href: "https://store.steampowered.com/app/1034140/Subverse/",
    store: "steam",
    genre: "3D shooter",
  },
  {
    id: "monster-girl-island",
    title: "Monster Girl Island",
    blurb: "3D dating sim on a tropical island of monster girls.",
    href: "https://store.steampowered.com/app/1102930/Monster_Girl_Island_Prologue/",
    store: "steam",
    genre: "3D dating sim",
  },
  {
    id: "tales-of-androgyny",
    title: "Tales of Androgyny",
    blurb: "Party-based RPG with extensive adult content.",
    href: "https://majalis.itch.io/tales-of-androgyny",
    store: "itch",
    genre: "RPG",
  },
  {
    id: "coc2",
    title: "Corruption of Champions II",
    blurb: "Text-forward fantasy RPG with transformation themes.",
    href: "https://fenoxo.com/",
    store: "official",
    genre: "Text RPG",
  },
  {
    id: "liliths-throne",
    title: "Lilith's Throne",
    blurb: "Java desktop RPG with deep character customization.",
    href: "https://lilithsthrone.blogspot.com/",
    store: "official",
    genre: "Text RPG",
  },
  {
    id: "lust-academy",
    title: "Lust Academy",
    blurb: "Magic-school visual novel — full saga on Steam.",
    href: "https://store.steampowered.com/app/3230990/Lust_Academy_Final/",
    store: "steam",
    genre: "Visual novel",
  },
  {
    id: "college-kings",
    title: "College Kings",
    blurb: "Choice-driven college life visual novel series.",
    href: "https://store.steampowered.com/app/1383410/College_Kings__The_Complete_Season/",
    store: "steam",
    genre: "Visual novel",
  },
  {
    id: "princess-conquest",
    title: "Princess & Conquest",
    blurb: "Pixel RPG with conquest mechanics and adult scenes.",
    href: "https://store.steampowered.com/app/1132690/Princess__Conquest/",
    store: "steam",
    genre: "RPG",
  },
  {
    id: "third-crisis",
    title: "Third Crisis",
    blurb: "Tactical RPG with corruption and management layers.",
    href: "https://store.steampowered.com/app/1412620/Third_Crisis/",
    store: "steam",
    genre: "Tactical RPG",
  },
  {
    id: "house-in-the-rift",
    title: "A House in the Rift",
    blurb: "3D VN / sim hybrid with time-loop mystery.",
    href: "https://store.steampowered.com/app/1354370/A_House_in_the_Rift/",
    store: "steam",
    genre: "3D VN",
  },
  {
    id: "treasure-of-nadia",
    title: "Treasure of Nadia",
    blurb: "Adventure VN with puzzle and exploration beats.",
    href: "https://store.steampowered.com/app/1594940/Treasure_of_Nadia/",
    store: "steam",
    genre: "Adventure VN",
  },
  {
    id: "waifu-fighter",
    title: "Waifu Fighter",
    blurb: "Arena fighter with adult reward scenes.",
    href: "https://store.steampowered.com/app/2378900/Waifu_Fighter/",
    store: "steam",
    genre: "Fighting",
  },
  {
    id: "fashion-business",
    title: "Fashion Business",
    blurb: "Office drama visual novel with episodic seasons.",
    href: "https://store.steampowered.com/app/1928690/Fashion_Business/",
    store: "steam",
    genre: "Visual novel",
  },
];

export function studiosByGroup(group: CuratedStudio["group"]): CuratedStudio[] {
  return CURATED_STUDIOS.filter((s) => s.group === group);
}

export function gamesByStore(store: CuratedGame["store"]): CuratedGame[] {
  return CURATED_GAMES.filter((g) => g.store === store);
}
