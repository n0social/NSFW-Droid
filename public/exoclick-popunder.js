/**
 * ExoClick popunder loader — replace this file with the full zone snippet from
 * Publishers → Zones → (your popunder) → Integration.
 *
 * In adConfig set:
 *   trigger_method: 2  (links with a specific class)
 *   trigger_class: "nsfwdroid-play-outbound"
 *
 * Recommended zone options: New Tab ON, Chrome enabled, capping 1 per session (or your choice).
 * See docs/exoclick-setup.md § Play-click popunder.
 */
(function noopUntilConfigured() {
  if (typeof console !== "undefined" && console.debug) {
    console.debug("[nsfwdroid] exoclick-popunder.js placeholder — paste ExoClick zone script");
  }
})();
