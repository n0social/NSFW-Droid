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
    primary: "#C026D3",
    accent: "#FF4D8D",
    surface: "#241033",
    textMuted: "#E9D5FF",
    border: "#C026D340",
    borderStrong: "#C026D3",
  },
};
