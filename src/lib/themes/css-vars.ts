import type { CSSProperties } from "react";
import type { ThemeColorTokens, ThemeDefinition } from "./types";

export function themeToCssVariables(colors: ThemeColorTokens): CSSProperties {
  return {
    "--background": colors.background,
    "--foreground": colors.foreground,
    "--theme-primary": colors.primary,
    "--theme-accent": colors.accent,
    "--theme-surface": colors.surface,
    "--theme-text-muted": colors.textMuted,
    "--theme-border": colors.border,
    "--theme-border-strong": colors.borderStrong,
  } as CSSProperties;
}

export function serializeThemeForClient(theme: ThemeDefinition) {
  return {
    id: theme.id,
    name: theme.name,
  };
}
