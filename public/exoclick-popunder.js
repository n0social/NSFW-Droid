/**
 * Legacy URL. Play popunder is not loaded from this file.
 * Eligible clicks navigate the current tab to the store and open a hidden iframe to
 * /api/ads/popunder-launch?hop=syndication so the browser requests ExoClick link.php
 * (src/lib/exoclick-play-popunder-client.ts). The catalog does not window.open the store.
 * A server fetch of s.pemsrv.com does not bill.
 * Kept so old bookmarks to this URL do not 404.
 */
