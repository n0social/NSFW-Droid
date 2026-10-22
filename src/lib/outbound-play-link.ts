/**
 * CSS class ExoClick popunder zones must use for "trigger on link class" mode.
 * Must match `trigger_class` in the popunder script from the ExoClick dashboard.
 */
export const EXOCLICK_PLAY_OUTBOUND_TRIGGER_CLASS = "nsfwdroid-play-outbound";

export function outboundPlayLinkClassName(extra?: string): string {
  const parts = [EXOCLICK_PLAY_OUTBOUND_TRIGGER_CLASS, extra?.trim()].filter(Boolean);
  return parts.join(" ");
}
