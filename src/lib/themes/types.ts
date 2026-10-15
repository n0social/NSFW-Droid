/** Color tokens mapped to CSS variables (--theme-* and --background/--foreground). */
export type ThemeColorTokens = {
  background: string;
  foreground: string;
  primary: string;
  accent: string;
  surface: string;
  textMuted: string;
  border: string;
  borderStrong: string;
};

/** Calendar window for auto-applying a holiday theme (UTC). */
export type ThemeSchedule = {
  /** Inclusive UTC month numbers 1–12 (e.g. 2 = February). */
  months: number[];
  /** Human-readable note stored in theme.json for operators. */
  description: string;
};

/** Placement hints for optional full-page holiday accents (see docs/themes.md). */
export type ThemeLayoutDecorSlot =
  | "page-pattern"
  | "corner-tl"
  | "corner-tr"
  | "corner-bl"
  | "corner-br"
  | "hero-accent-left"
  | "hero-accent-right";

export type ThemeLayoutDecorEntry = {
  file: string;
  slot: ThemeLayoutDecorSlot;
  /** 0–1; UI defaults per slot when omitted. */
  opacity?: number;
};

export type ThemeDefinition = {
  id: string;
  name: string;
  schedule: ThemeSchedule;
  colors: ThemeColorTokens;
  /** Filename under data/themes/<id>/ (default icon.svg). */
  icon?: string;
  /** Higher wins when multiple themes match the same month. */
  priority?: number;
  /** Optional SVG filenames + slots for browse-page richness. */
  layoutDecor?: ThemeLayoutDecorEntry[];
};

export type ResolvedLayoutDecorItem = {
  url: string;
  slot: ThemeLayoutDecorSlot;
  opacity?: number;
};

export type ThemeOverridePreference = "default" | "auto";

export type ResolvedTheme = ThemeDefinition & {
  source: "default" | "schedule" | "override";
};
