import { exoclickPopunderLiveReady, isAdsEnabled } from "@/lib/ads-config";
import {
  EXOCLICK_POPUNDER_LAUNCH_PATH,
  EXOCLICK_POPUNDER_REFERRER_HOME,
} from "@/lib/exoclick-popunder-syndication";
import type { Listing } from "@/db/schema";
import { listingEligibleForPlayPopunder, urlEligibleForOutboundPopunder } from "@/lib/outbound-link";

export function shouldServeExoclickRedirectInterstitial(
  ageVerified: boolean,
  listing?: Pick<Listing, "source" | "officialUrl" | "affiliateUrl">,
  outboundUrl?: string,
): boolean {
  if (!isAdsEnabled() || !ageVerified || !exoclickPopunderLiveReady()) return false;
  if (listing) return listingEligibleForPlayPopunder(listing);
  if (outboundUrl) return urlEligibleForOutboundPopunder(outboundUrl);
  return false;
}

export function buildPopunderLaunchUrlForRequest(requestUrl: string): string {
  const launch = new URL(EXOCLICK_POPUNDER_LAUNCH_PATH, requestUrl);
  launch.searchParams.set("p", EXOCLICK_POPUNDER_REFERRER_HOME);
  launch.searchParams.set("hop", "syndication");
  launch.searchParams.set("cb", String(Math.floor(Math.random() * 1e9)));
  return launch.toString();
}

/** Same-tab redirect: beacon ExoClick via launch URL, then `location.replace` to the store. */
export function buildMonetizedRedirectInterstitialHtml(
  destinationUrl: string,
  popunderLaunchUrl: string,
): string {
  const storeJson = JSON.stringify(destinationUrl);
  const launchJson = JSON.stringify(popunderLaunchUrl);
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="referrer" content="no-referrer">
<title>Opening link…</title>
<style>body{margin:0;font-family:system-ui,sans-serif;background:#14061c;color:#e9d5ff;display:flex;min-height:100vh;align-items:center;justify-content:center;font-size:14px}</style>
</head><body>
<p>Opening link…</p>
<script>
(function(){
  var launch=${launchJson};
  var store=${storeJson};
  var img=new Image();
  img.referrerPolicy="no-referrer";
  img.src=launch;
  setTimeout(function(){ location.replace(store); }, 400);
})();
</script>
</body></html>`;
}
