# Engagement vs public access

Signed-in users get **engagement** features (favorites, saved browse filters, profile preferences). Anonymous visitors get a **read-only catalog** with no server-side engagement state.

Age verification, catalog browsing, outbound `/api/go` links, and blur/theme **cookies** for the current browser session are **not** gated on account sign-in.

## Sign-in required

| Feature | Behavior |
| --- | --- |
| **Favorites** | Heart on `GameCard` toggles only when signed in. Logged-out visitors see ♡; tap shows “[Sign in](/sign-in) to save favorites.” State lives in `user_favorite` via `GET/POST/DELETE /api/account/favorites` (401 without session). No client-only favorite lists. |
| **Account hub** | `/account` — profile, favorites list, theme/blur defaults stored on `user_profile`. |
| **Saved browse filters** | `user_profile.preferences.browse` (rail, tag, search, vanilla). Applied on `/browse` only when signed in; anonymous users use URL query params only (not persisted). |
| **Profile preferences** | Theme opt-out and default blur on account; synced after session via `/api/account/profile`. |

## Public (no account)

| Feature | Behavior |
| --- | --- |
| **Home & browse** | Read catalog, chips, search/filter via URL on `/browse`. |
| **Age gate** | `/api/age-gate` cookie; required for unblurred covers, not for sign-in. |
| **Outbound links** | `/api/go/[listingId]` for all visitors. |
| **Analytics** | Anonymous `listing_view` / `outbound_click` events (no `user_favorite`). |
| **Blur toggle** | Session cookie when age-verified; profile merge only if signed in. |
| **Submit game** | Developer form at `/submit` (no account required in Phase 1). |
| **Legal pages** | Terms, privacy, DMCA, affiliate. |

## Leaderboard / rails

Home **Hottest** and **Trending** rails blend analytics with favorite counts from **`user_favorite` only** (signed-in saves). Weights: `RANK_WEIGHT_FAVORITE_ON_HOT`, `RANK_WEIGHT_FAVORITE_ON_TRENDING` in `src/lib/listings-ranking.ts`. See `docs/data-and-ingest.md`.

## Admin-only (not a player feature)

| Metric / UI | Access |
| --- | --- |
| Sign-ups (24h / 7d), ingest runs, audit tail | `/admin` + `GET /api/admin/dashboard` (admin session only) |
| TOS review queue | `/admin/queue` |

Player-facing UI does not expose sign-up counts or staff analytics.
