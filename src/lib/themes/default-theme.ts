import type { ThemeDefinition } from "./types";

/** Built-in storefront palette (docs/design-and-mascot.md). */
export const DEFAULT_THEME: ThemeDefinition = {
  id: "default",
  name: "NSFW Droid",
  schedule: {
    months: [],
    description: "Default brand theme when no holiday schedule matches.",
  },
  colors: {
    background: "#14061C",
    foreground: "#FFF1F7",
    primary: "#22FF88",
    accent: "#39FF14",
    surface: "#241033",
    textMuted: "#86EFAC",
    border: "#22FF8840",
    borderStrong: "#39FF14",
  },
};
