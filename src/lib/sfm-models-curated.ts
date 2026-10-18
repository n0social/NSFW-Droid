import { smutbaseProjectUrl } from "@/lib/smutbase-url";

export type CuratedSfmModel = {
  id: string;
  /** Card title (character name). */
  characterName: string;
  sourceGame: string;
  /** SmutBase / Open3DLab project UUID. */
  projectId: string;
  /** SFW card preview — `/creator-models/{id}.webp` (official/Steam/Blizzard marketing art; see `scripts/sfm-model-sfw-sources.json`). */
  previewImageSrc?: string;
  /** Editorial note — why this pick is in the top list. */
  pickNote: string;
  /** Approx. view count on SFMLab/SmutBase when curated (for ordering context). */
  approxViews?: number;
};

export function smutbaseHref(model: CuratedSfmModel): string {
  return smutbaseProjectUrl(model.projectId);
}

/**
 * Top NSFW SFM models by community usage (views / meme frequency / compile site tags).
 * Outbound only — files stay on SmutBase. After edits: `npx tsx scripts/verify-sfm-models.ts`
 */
export const TOP_SFM_MODELS: CuratedSfmModel[] = [
  {
    id: "tifa-lockhart",
    characterName: "Tifa Lockhart",
    sourceGame: "Final Fantasy VII Remake",
    projectId: "0ecab6da-ddc5-4109-b9d5-fe4976fde428",
    previewImageSrc: "/creator-models/tifa-lockhart.webp",
    pickNote: "High-traffic FF7R rig with nude bodygroups and outfit flexes.",
    approxViews: 59000,
  },
  {
    id: "widowmaker",
    characterName: "Widowmaker",
    sourceGame: "Overwatch",
    projectId: "9d953968-d1b0-452f-9572-544598a17b65",
    previewImageSrc: "/creator-models/widowmaker.webp",
    pickNote: "Classic LordAardvark-era nude Widowmaker; still a compile staple.",
    approxViews: 120000,
  },
  {
    id: "d-va",
    characterName: "D.Va",
    sourceGame: "Overwatch",
    projectId: "8f3a6013-b367-411c-b7d5-e07835bebf5c",
    previewImageSrc: "/creator-models/d-va.webp",
    pickNote: "NSFW playermodel pack popular in GMod/SFM crossovers.",
    approxViews: 7000,
  },
  {
    id: "2b",
    characterName: "2B",
    sourceGame: "NieR:Automata",
    projectId: "748da69c-42d3-4ee6-b4fd-3c3ad638acd5",
    previewImageSrc: "/creator-models/2b.webp",
    pickNote: "SFM2 port with full dress-down bodygroups to nude.",
    approxViews: 15000,
  },
  {
    id: "tracer",
    characterName: "Tracer",
    sourceGame: "Overwatch",
    projectId: "5ffcf6dc-ade6-4ef9-9266-12614271162e",
    previewImageSrc: "/creator-models/tracer.webp",
    pickNote: "SFM2 Tracer with gear toggles down to nude.",
    approxViews: 8000,
  },
  {
    id: "mercy",
    characterName: "Mercy",
    sourceGame: "Overwatch",
    projectId: "291bef9d-aeb2-441f-8726-703f079e7985",
    previewImageSrc: "/creator-models/mercy.webp",
    pickNote: "Lewd Mercy — long-standing nude/top/bottom bodygroups.",
    approxViews: 90000,
  },
  {
    id: "lady-dimitrescu",
    characterName: "Lady Dimitrescu",
    sourceGame: "Resident Evil Village",
    projectId: "51462581-a31d-4d2a-b2ae-b3e1acf0c446",
    previewImageSrc: "/creator-models/lady-dimitrescu.webp",
    pickNote: "RE8 tall vampire — outfit flexes and NSFW posing.",
    approxViews: 50000,
  },
  {
    id: "jill-valentine",
    characterName: "Jill Valentine",
    sourceGame: "Resident Evil 3 Remake",
    projectId: "cd428014-7528-406a-86b4-f3c6d5d3785b",
    previewImageSrc: "/creator-models/jill-valentine.webp",
    pickNote: "LordAardvark DazV5 RE3 Jill — nude + outfit loader.",
    approxViews: 45000,
  },
  {
    id: "lara-croft",
    characterName: "Lara Croft",
    sourceGame: "Tomb Raider (reboot trilogy)",
    projectId: "2f2f576b-185e-4521-aa1a-9ffc285015ea",
    previewImageSrc: "/creator-models/lara-croft.webp",
    pickNote: "Survivor-era Lara (SOTR/ROTR) — outfit bodygroups and NSFW flexes.",
    approxViews: 35000,
  },
  {
    id: "aunt-cass",
    characterName: "Aunt Cass",
    sourceGame: "Big Hero 6",
    projectId: "f04ddfbb-bc77-4c56-acc5-d0a97ff88b6e",
    previewImageSrc: "/creator-models/aunt-cass.webp",
    pickNote: "Meme-tier usage in modern SFM compilations.",
    approxViews: 25000,
  },
];
