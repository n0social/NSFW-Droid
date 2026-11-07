"use client";

import { useEffect } from "react";
import { shouldShowPlayPopunder } from "@/lib/ads-config";
import { EXOCLICK_PLAY_OUTBOUND_TRIGGER_CLASS } from "@/lib/outbound-play-link";
import { popunderZoneIdForUserAgent } from "@/lib/exoclick-popunder-syndication";

const POPUNDER_SCRIPT_SRC = "https://a.pemsrv.com/popunder1000.js";
const POPUNDER_SCRIPT_ID = "exoclick-popunder";

type PopunderWindow = Window & {
  ad_idzone?: string;
  ad_popup_fallback?: boolean;
  ad_popup_force?: boolean;
  ad_chrome_enabled?: boolean;
  ad_new_tab?: boolean;
  ad_frequency_period?: number;
  ad_frequency_count?: number;
  ad_trigger_method?: number;
  ad_trigger_class?: string;
  ad_trigger_delay?: number;
  ad_capping_enabled?: boolean;
};

/**
 * Official ExoClick popunder tag. Zones 6062592 / 6062594 are set to
 * trigger_method 2 (click a link with class nsfwdroid-play-outbound).
 * A hidden iframe to link.php is not what those zones count.
 * Loads only after the age gate, same as the footer banner.
 */
export function ExoClickPopunderScript({ ageVerified }: { ageVerified: boolean }) {
  const live = shouldShowPlayPopunder(ageVerified);

  useEffect(() => {
    if (!live || typeof document === "undefined") return;
    if (document.getElementById(POPUNDER_SCRIPT_ID)) return;
    const zoneId = popunderZoneIdForUserAgent(navigator.userAgent);
    if (!zoneId) return;

    const w = window as PopunderWindow;
    w.ad_idzone = zoneId;
    w.ad_popup_fallback = false;
    w.ad_popup_force = false;
    w.ad_chrome_enabled = true;
    w.ad_new_tab = true;
    w.ad_frequency_period = 60;
    w.ad_frequency_count = 1;
    w.ad_trigger_method = 2;
    w.ad_trigger_class = EXOCLICK_PLAY_OUTBOUND_TRIGGER_CLASS;
    w.ad_trigger_delay = 0;
    w.ad_capping_enabled = true;

    const script = document.createElement("script");
    script.id = POPUNDER_SCRIPT_ID;
    script.async = true;
    script.src = POPUNDER_SCRIPT_SRC;
    document.body.appendChild(script);
  }, [live]);

  return null;
}
