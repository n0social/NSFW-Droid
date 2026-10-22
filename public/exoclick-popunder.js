/**
 * ExoClick play-click popunder — remote popunder1000.js loader.
 * Zone: desktop/web 6062592, mobile 6062594 (overridable via data-zone-* on this script tag).
 * Trigger: nsfwdroid-play-outbound only (trigger_method 2).
 */
(function () {
  if (typeof document === "undefined") return;

  var current = document.currentScript;
  var desktopZone = (current && current.getAttribute("data-zone-desktop")) || "6062592";
  var mobileZone = (current && current.getAttribute("data-zone-mobile")) || "6062594";

  function isMobileUa() {
    if (typeof navigator === "undefined") return false;
    return /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WebOS|Windows Phone/i.test(
      navigator.userAgent,
    );
  }

  var idzone = parseInt(isMobileUa() ? mobileZone : desktopZone, 10);
  if (!idzone || Number.isNaN(idzone)) return;

  if (document.getElementById("exoclick-popunder-remote")) return;

  var cfg = {
    ads_host: "a.pemsrv.com",
    syndication_host: "s.pemsrv.com",
    idzone: idzone,
    popup_fallback: false,
    popup_force: false,
    chrome_enabled: true,
    new_tab: false,
    frequency_period: 60,
    frequency_count: 1,
    trigger_method: 2,
    trigger_class: "nsfwdroid-play-outbound",
    trigger_delay: 0,
    capping_enabled: true,
    tcf_enabled: true,
    agego_cross_site_enabled: true,
    only_inline: false,
  };

  var s = document.createElement("script");
  s.type = "application/javascript";
  s.async = true;
  s.src = "https://" + cfg.ads_host + "/popunder1000.js";
  s.id = "exoclick-popunder-remote";
  Object.keys(cfg).forEach(function (key) {
    if (key === "ads_host") return;
    s.setAttribute("data-msg-" + key, String(cfg[key]));
  });

  var body = document.body;
  if (!body) return;
  if (body.firstChild) body.insertBefore(s, body.firstChild);
  else body.appendChild(s);
})();
