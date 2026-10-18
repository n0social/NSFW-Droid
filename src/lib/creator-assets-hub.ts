import {
  CREATOR_ASSETS_BLENDER_GROUPS,
  CURATED_CREATOR_ASSETS_BLENDER,
  creatorAssetsBlenderByCategory,
  type CreatorAssetsBlenderCategory,
  type CuratedCreatorAssetsBlenderLink,
} from "@/lib/creator-assets-blender-curated";
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
    hint: "Open3DLab, SmutBase, itch.io environments, Patreon scene packs",
    href: "/creators/assets#blender",
    available: true,
  },
];

export type CreatorAssetsHubExport = {
  sections: CreatorAssetsSectionMeta[];
  sounds: {
    groups: typeof CREATOR_SOUND_GROUPS;
    items: CuratedCreatorSound[];
    byCategory: (category: CreatorSoundCategory) => CuratedCreatorSound[];
  };
  blender: {
    groups: typeof CREATOR_ASSETS_BLENDER_GROUPS;
    items: CuratedCreatorAssetsBlenderLink[];
    byCategory: (category: CreatorAssetsBlenderCategory) => CuratedCreatorAssetsBlenderLink[];
  };
  tutorials: {
    groups: typeof SFM_TUTORIAL_TOPICS;
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
    blender: {
      groups: CREATOR_ASSETS_BLENDER_GROUPS,
      items: CURATED_CREATOR_ASSETS_BLENDER,
      byCategory: creatorAssetsBlenderByCategory,
    },
    tutorials: {
      groups: SFM_TUTORIAL_TOPICS,
      items: CURATED_SFM_TUTORIALS,
      byTopic: sfmTutorialsByTopic,
    },
  };
}
