export type SfmTutorialTopic =
  | "install-workflow"
  | "rigging"
  | "lighting"
  | "animation"
  | "sfm2"
  | "resources";

export type SfmTutorialMediaType = "video" | "written" | "forum thread";

export type CuratedSfmTutorial = {
  id: string;
  name: string;
  blurb: string;
  href: string;
  type: SfmTutorialMediaType;
  topic: SfmTutorialTopic;
};

export const SFM_TUTORIAL_TOPICS: {
  key: SfmTutorialTopic;
  label: string;
  hint: string;
}[] = [
  {
    key: "install-workflow",
    label: "Install & SmutBase / SFMLab workflow",
    hint: "Drop models into usermod, Open3DLab accounts, and where tutorials live on the network.",
  },
  {
    key: "rigging",
    label: "Rigging & physics",
    hint: "IK rigs, lewd Blender rigging scripts, jiggle, and weight painting for NSFW models.",
  },
  {
    key: "lighting",
    label: "Lighting & look",
    hint: "Three-point setups, rim light, and scene lighting for posters and shots.",
  },
  {
    key: "animation",
    label: "Lewd animation",
    hint: "Posing, timing, and community write-ups for adult motion in SFM or Blender.",
  },
  {
    key: "sfm2",
    label: "Source 2 Filmmaker (SFM2)",
    hint: "S2FM setup via Half-Life: Alyx and modern Dota/Half-Life assets.",
  },
  {
    key: "resources",
    label: "Mega-lists & official series",
    hint: "Long-form playlists and curated link dumps worth bookmarking.",
  },
];

/** Outbound NSFW SFM tutorials only. After edits: `npm run creators:verify-sfm-tutorials`. */
export const CURATED_SFM_TUTORIALS: CuratedSfmTutorial[] = [
  {
    id: "open3dlab-install-sfm-models",
    name: "Open3DLab — How to install SFM models",
    blurb:
      "Official walkthrough for unpacking SmutBase/SFMLab zips into usermod and loading models in SFM.",
    href: "https://www.youtube.com/watch?v=z2J0G65vps0",
    type: "video",
    topic: "install-workflow",
  },
  {
    id: "open3dlab-making-sfm-models-p1",
    name: "Open3DLab — Making SFM models (Part 1)",
    blurb:
      "Source-engine model pipeline theory: folders, MDL/VVD/VTX, materials, and sharing-friendly layout.",
    href: "https://www.youtube.com/watch?v=ENwTQ6xcyi8",
    type: "video",
    topic: "install-workflow",
  },
  {
    id: "open3dlab-making-sfm-models-p2",
    name: "Open3DLab — Making SFM models (Part 2)",
    blurb:
      "Toolchain setup: Blender Source Tools, VTFEdit, and QC paths — direct follow-up to Part 1.",
    href: "https://www.youtube.com/watch?v=zTS0PTUHgsg",
    type: "video",
    topic: "install-workflow",
  },
  {
    id: "open3dlab-making-sfm-models-p4",
    name: "Open3DLab — Making SFM models (Part 4)",
    blurb: "Compilation and MDL pipeline closure for shipping custom Source playermodels.",
    href: "https://www.youtube.com/watch?v=D3a_SUTD53c",
    type: "video",
    topic: "install-workflow",
  },
  {
    id: "open3dlab-import-sfm-to-blender",
    name: "Open3DLab — Import SFM models into Blender",
    blurb: "SourceIO walkthrough bridging SmutBase downloads into Blender editing (inverse of porting guides).",
    href: "https://www.youtube.com/watch?v=XX5mzUeZJDo",
    type: "video",
    topic: "install-workflow",
  },
  {
    id: "smutbase-tutorials-index",
    name: "SmutBase — Tutorials hub",
    blurb:
      "Community-written guides plus Open3DLab YouTube picks (install, rip, Blender, cum sim docs).",
    href: "https://smutba.se/tutorials/",
    type: "written",
    topic: "install-workflow",
  },
  {
    id: "sfmlab-tutorials-index",
    name: "SFMLab — Tutorials hub",
    blurb: "SFW-facing tutorial index on the Open3DLab network (same login as SmutBase).",
    href: "https://sfmlab.com/tutorials/",
    type: "written",
    topic: "install-workflow",
  },
  {
    id: "smutbase-blender-resource-list",
    name: "SmutBase — Blender video & resource list",
    blurb:
      "Huge community-maintained index: rigging, fluids, porting to SFM, hair, and simulation links.",
    href: "https://smutba.se/tutorials/view/8af7645b-cb80-4795-a036-49741d5e7d75/",
    type: "written",
    topic: "resources",
  },
  {
    id: "valve-sfm-playlist",
    name: "Valve — Official SFM tutorial playlist",
    blurb: "Canonical basics from Valve: recording, graph editor, rigging, lighting, particles, pose-to-pose.",
    href: "https://www.youtube.com/playlist?list=PL2B46DEB4157E67C4",
    type: "video",
    topic: "resources",
  },
  {
    id: "valve-sfm-rigging",
    name: "Valve — 10 rigging",
    blurb: "Official rigging intro: applying rig scripts, biped vs custom skeletons in the animation set.",
    href: "https://www.youtube.com/watch?v=dPD1HTiRMYM",
    type: "video",
    topic: "rigging",
  },
  {
    id: "steam-sfm-insert-rigs",
    name: "Steam — Insert rigs (discussion)",
    blurb:
      "Long-running SFM thread on choosing rig scripts, auto-rigger workshop tools, and non-Valve models.",
    href: "https://steamcommunity.com/app/1840/discussions/0/1474222595298098426/",
    type: "forum thread",
    topic: "rigging",
  },
  {
    id: "smutbase-auto-dick-rigging",
    name: "SmutBase — Automated dick rigging & weight paint",
    blurb: "Blender script + docs for NSFW penis rigs (Rigify/MHX/DAZ) with community GitHub improvements.",
    href: "https://smutba.se/project/ffeb4d3b-6b02-4293-90e8-8aafb23d8148/",
    type: "written",
    topic: "rigging",
  },
  {
    id: "smutbase-jiggle-blender",
    name: "SmutBase — Jiggle physics in Blender",
    blurb: "Written primer on cloth proxies, wiggle bones, and hand-keyed bounce for lewd characters.",
    href: "https://smutba.se/tutorials/view/89516259-63c4-4a8d-bb4b-0459092d013a/",
    type: "written",
    topic: "rigging",
  },
  {
    id: "valve-sfm-lighting",
    name: "Valve — 11 lighting",
    blurb: "Official lighting fundamentals inside SFM’s scene lights and preview workflow.",
    href: "https://www.youtube.com/watch?v=xO6ouPYmIrM",
    type: "video",
    topic: "lighting",
  },
  {
    id: "cinema-sfm-lighting-process",
    name: "Cinema Films SFM — The lighting process",
    blurb: "Modern 2022 series episode on building readable three-point lighting for SFM shots.",
    href: "https://www.youtube.com/watch?v=pjaDkjSPYzQ",
    type: "video",
    topic: "lighting",
  },
  {
    id: "valve-sfm-particles",
    name: "Valve — 12 particle tutorial",
    blurb: "Official cum, spark, and FX particle workflows missing from our shorter lighting-only picks.",
    href: "https://www.youtube.com/watch?v=zLry-0Oddmo",
    type: "video",
    topic: "animation",
  },
  {
    id: "cinema-sfm-playlist",
    name: "Cinema Films SFM — full tutorial playlist",
    blurb: "Camera, particles, and scene building beyond the single lighting episode we already list.",
    href: "https://www.youtube.com/playlist?list=PLMFQZYYHa96iBJY83SQsXGxwNHfCbCk4G",
    type: "video",
    topic: "resources",
  },
  {
    id: "valve-wiki-sfm",
    name: "Valve Developer Wiki — Source Filmmaker",
    blurb: "Stable written reference for install paths, console commands, and troubleshooting.",
    href: "https://developer.valvesoftware.com/wiki/Source_Filmmaker",
    type: "written",
    topic: "resources",
  },
  {
    id: "smutbase-fluid-cum-doc",
    name: "SmutBase — Advanced fluid / cum simulation doc",
    blurb: "Community doc on fluid/particle-style cum effects for Blender-to-SFM lewd scenes.",
    href: "https://smutba.se/tutorials/view/6c44adf3-f1f4-4831-a6be-4a0b7aad926a/",
    type: "written",
    topic: "animation",
  },
  {
    id: "smutbase-animate-sex",
    name: "SmutBase — How to animate sex",
    blurb: "Salaryman’s written guide to timing, cycles, and constraints for explicit character motion.",
    href: "https://smutba.se/tutorials/view/2e36ddcb-f98b-4777-a86e-881f7ba46237/",
    type: "written",
    topic: "animation",
  },
  {
    id: "smutbase-port-koikatsu-sfm",
    name: "SmutBase — Porting Koikatsu to SFM",
    blurb: "Workflow notes for bringing Illusion/Koikatsu bodies into Source-compatible playermodels.",
    href: "https://smutba.se/tutorials/view/7cfaffdc-6282-46d8-a133-8ed22e398086/",
    type: "written",
    topic: "animation",
  },
  {
    id: "s2fm-basic-setup",
    name: "YouTube — Updated S2FM basic setup",
    blurb: "Install and configure Source 2 Filmmaker (Half-Life: Alyx tool) without a VR headset.",
    href: "https://www.youtube.com/watch?v=jC4DYPJCcL0",
    type: "video",
    topic: "sfm2",
  },
  {
    id: "s2fm-how-to-use",
    name: "YouTube — How to use Source 2 Filmmaker",
    blurb: "Interface tour and first-session tips for S2FM after Alyx install.",
    href: "https://www.youtube.com/watch?v=dnQohkZDGlw",
    type: "video",
    topic: "sfm2",
  },
  {
    id: "inlet-s2fm-extra-tips",
    name: "Inlet — S2FM extra tips",
    blurb: "Written tips: IK rigs, material tinting, animation rename tricks, and Alyx asset access.",
    href: "https://inletzone.com/s2fm-extra-tips/",
    type: "written",
    topic: "sfm2",
  },
];

export function sfmTutorialsByTopic(topic: SfmTutorialTopic): CuratedSfmTutorial[] {
  return CURATED_SFM_TUTORIALS.filter((t) => t.topic === topic);
}
