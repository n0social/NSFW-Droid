export type CreatorSoundCategory =
  | "discovery"
  | "sfx-packs"
  | "voice-moans"
  | "sfm-sounds";

export type CuratedCreatorSound = {
  id: string;
  name: string;
  blurb: string;
  href: string;
  category: CreatorSoundCategory;
  /** Short license / attribution note for editors (not legal advice). */
  licenseNote?: string;
};

export const CREATOR_SOUND_GROUPS: {
  key: CreatorSoundCategory;
  label: string;
  hint: string;
}[] = [
  {
    key: "discovery",
    label: "Discovery hubs",
    hint: "Browse tags and community collections — not exhaustive catalogs.",
  },
  {
    key: "sfx-packs",
    label: "Sex SFX & foley",
    hint: "Penetration, wetness, slaps, and non-vocal scene audio for games and animation.",
  },
  {
    key: "voice-moans",
    label: "Moans & voice acting",
    hint: "Female/male VO, reactions, and dialogue lines for NSFW scenes.",
  },
  {
    key: "sfm-sounds",
    label: "SFM / SFMLab audio",
    hint: "Classic Source Filmmaker sound drops and megapacks (WAV, SFM-ready paths).",
  },
];

/**
 * Top NSFW sound / SFX / VO picks for adult game and SFM creators — outbound only.
 * After edits: `npm run creators:verify-assets-sounds`
 */
export const CURATED_CREATOR_SOUNDS: CuratedCreatorSound[] = [
  {
    id: "itch-adult-sfx",
    name: "itch.io — adult sound effects",
    blurb: "Official game-assets browse for Adult + Sound effects tags — good starting point for new packs.",
    href: "https://itch.io/game-assets/tag-adult/tag-sound-effects",
    category: "discovery",
  },
  {
    id: "sfmlab-maf-sounds",
    name: "SFMLab — MAF sound collection",
    blurb: "Curated public list of high-traffic SFM sound projects (LordAardvark-era staples and VO rips).",
    href: "https://sfmlab.com/list/68337ab0-4974-4ad5-b499-2cf56dc607ee/",
    category: "discovery",
  },
  {
    id: "monsterbox-hentai-sfx",
    name: "MonsterBox — Free Hentai/SFM SFX Pack",
    blurb: "Small free WAV set tuned for hentai/SFM; easy attribution-friendly starter pack.",
    href: "https://monsterboxgames.itch.io/royalty-free-hentai-sfx-pack",
    category: "sfx-packs",
    licenseNote: "Commercial OK; credit MonsterBox Entertainment.",
  },
  {
    id: "lewdfx-sasp",
    name: "LewdFX — Sexy Adult Sound Pack (SASP)",
    blurb: "600+ non-vocal penetration, wet, and liquid SFX in WAV/MP3/OGG — no moans in the pack.",
    href: "https://lewdfxaudio.itch.io/sasp",
    category: "sfx-packs",
    licenseNote: "Paid; royalty-free commercial per product page.",
  },
  {
    id: "philly-nsfw-sfx",
    name: "Philly — NSFW SFX Pack",
    blurb: "Compact Ogg set aimed at RPG Maker / indie eroge (masturbation, sex, orgasm).",
    href: "https://kento-games.itch.io/nsfw-sfx-pack",
    category: "sfx-packs",
    licenseNote: "Credit Kentaro; commercial allowed.",
  },
  {
    id: "joel-sex-sounds-bundle",
    name: "Joel Loopez — Sex Sounds bundle",
    blurb: "Large mixed library: moans, BJ, penetration, kisses, and reactions with tagged metadata.",
    href: "https://zoidberg-es.itch.io/sex-sounds-bundle",
    category: "sfx-packs",
    licenseNote: "Paid; royalty-free per listing.",
  },
  {
    id: "lecherya-85min-vo",
    name: "LecheryAmoreVA — 85 min free voice pack",
    blurb: "Generous free WAV library: moans, dialogue, kissing, BJ/deepthroat, multiple personas.",
    href: "https://lecheryamoreva.itch.io/nsfw-free-voice-pack-85-mins",
    category: "voice-moans",
    licenseNote: "Commercial OK with @LecheryAmoreVA credit; edits allowed.",
  },
  {
    id: "magicalmystic-moans",
    name: "MagicalMysticVA — free moan samples",
    blurb: "Short free female moan WAV samples — quick filler for prototypes and trailers.",
    href: "https://magicalmysticva.itch.io/free-female-moan-sound-effect-pack",
    category: "voice-moans",
    licenseNote: "Personal & commercial; credit appreciated.",
  },
  {
    id: "awny-bea-voice",
    name: "Awny Games — Bea: 400 wild voice SFX",
    blurb: "Paid pack of 400 recorded moans, breathing, and ad-lib lines (WAV + Unity).",
    href: "https://awny.itch.io/bea-400-wild-voice-sfx",
    category: "voice-moans",
    licenseNote: "Royalty-free commercial per product page.",
  },
  {
    id: "sfmlab-ultimate-sex-sounds",
    name: "SFMLab — Ultimate Sex Sounds Pack",
    blurb: "Megacompilation of classic SFMLab lewd audio sorted by type (moans, slaps, dialogue, etc.).",
    href: "https://sfmlab.com/project/25318b99-9c84-4fc6-9236-74960b7ab830/",
    category: "sfm-sounds",
  },
  {
    id: "sfmlab-drdabblur-sfx",
    name: "SFMLab — Dr.Dabblur's Sexy Sound FX",
    blurb: "307 clipped 16-bit WAV penetration, squelch, spank, and cum sounds for SFM timelines.",
    href: "https://sfmlab.com/project/f477b249-0161-4d0e-83e0-3b9dfad613fb/",
    category: "sfm-sounds",
  },
  {
    id: "sfmlab-lordaardvark-sex-sounds",
    name: "SFMLab — LordAardvark Sex Sounds Pack 1",
    blurb: "Foundational SFM community sex-SFX drop — still referenced in compile-era projects.",
    href: "https://sfmlab.com/project/d75d9d3b-b5af-4800-a2a4-4c9be3ba40f4/",
    category: "sfm-sounds",
  },
];

export function creatorSoundsByCategory(
  category: CreatorSoundCategory,
): CuratedCreatorSound[] {
  return CURATED_CREATOR_SOUNDS.filter((s) => s.category === category);
}
