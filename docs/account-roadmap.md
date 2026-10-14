# Player accounts roadmap

**Today:** `/sign-in` (email + Google), `/account` (minimal), sign out in header. **No** `/sign-up`, password reset, or Postgres profile/favorites. Session: `POST /api/auth/session` + `USER_SESSION` cookie (needs `FIREBASE_SERVICE_ACCOUNT_JSON` + `SESSION_SECRET` on the droplet).

See `docs/firebase-setup.md` for env setup.

## Phase 1b (recommended next)

1. **Self-service:** `/sign-up`, password reset, keep Google.
2. **`user_profile`** table — upsert on first session (`firebase_uid`, `display_name`, `preferences` jsonb).
3. **Favorites** — `user_favorite` + heart on cards + list on `/account`.
4. **Persist preferences** — holiday theme, blur default, newsletter opt-in (sync cookies on login where needed).
5. **Account UI** — Profile, Favorites, Preferences sections (replace placeholders).

## Phase 1c+ (after catalog tags exist)

Followed tags, platform filters, NSFW facet opt-outs, hidden listings, recently viewed (tie `listing_view` to `uid` when signed in).

## Phase 2+

Avatar (Vesper/Andri presets), play history, developer-linked submissions, Android same Firebase project, subscriptions.

**Mascots:** **Andri** = header/favicon; **Vesper** = in-app host character (updates, deals) — `docs/mascots.md`.
