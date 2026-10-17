import {
  CREATOR_SOUND_GROUPS,
  CURATED_CREATOR_SOUNDS,
  creatorSoundsByCategory,
  type CreatorSoundCategory,
  type CuratedCreatorSound,
} from "@/lib/creator-assets-sounds-curated";
import {
  CURATED_SFM_TUTORIALS,
  SFM_TUTORIAL_TOPICS,
  sfmTutorialsByTopic,
  type CuratedSfmTutorial,
  type SfmTutorialTopic,
} from "@/lib/creator-assets-sfm-tutorials-curated";

export type CreatorAssetsSectionKey = "sounds" | "tutorials" | "blender";

export type CreatorAssetsSectionMeta = {
  key: CreatorAssetsSectionKey;
  label: string;
  hint: string;
  href: string;
  available: boolean;
};

export const CREATOR_ASSETS_SECTIONS: CreatorAssetsSectionMeta[] = [
  {
    key: "sounds",
    label: "Sounds & VO",
    hint: "SFX packs, moans, SFMLab audio",
    href: "/creators/assets#sounds",
    available: true,
  },
  {
    key: "tutorials",
    label: "SFM tutorials",
    hint: "NSFW SFM install, rigging, lighting, SmutBase workflow",
    href: "/creators/assets#tutorials",
    available: true,
  },
  {
    key: "blender",
    label: "Blender & files",
    hint: "Rigs and scene files — coming soon",
    href: "/creators/assets#blender",
    available: false,
  },
];

export type CreatorAssetsHubExport = {
  sections: CreatorAssetsSectionMeta[];
  sounds: {
    groups: typeof CREATOR_SOUND_GROUPS;
    items: CuratedCreatorSound[];
    byCategory: (category: CreatorSoundCategory) => CuratedCreatorSound[];
  };
  sfmTutorials: {
    topics: typeof SFM_TUTORIAL_TOPICS;
    items: CuratedSfmTutorial[];
    byTopic: (topic: SfmTutorialTopic) => CuratedSfmTutorial[];
  };
};

export function exportCreatorAssetsHub(): CreatorAssetsHubExport {
  return {
    sections: CREATOR_ASSETS_SECTIONS,
    sounds: {
      groups: CREATOR_SOUND_GROUPS,
      items: CURATED_CREATOR_SOUNDS,
      byCategory: creatorSoundsByCategory,
    },
    sfmTutorials: {
      topics: SFM_TUTORIAL_TOPICS,
      items: CURATED_SFM_TUTORIALS,
      byTopic: sfmTutorialsByTopic,
    },
  };
}
