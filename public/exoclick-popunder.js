/**
 * ExoClick popunder zone 6062592 — remote loader (popunder1000.js).
 * Trigger: class nsfwdroid-play-outbound on Play / Play on store only.
 * Align ExoClick dashboard: trigger method = link class, class = nsfwdroid-play-outbound.
 */
(function () {
  if (typeof document === "undefined") return;

  var cfg = {
    ads_host: "a.pemsrv.com",
    syndication_host: "s.pemsrv.com",
    idzone: 6062592,
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

  if (document.getElementById("exoclick-popunder-remote")) return;

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
