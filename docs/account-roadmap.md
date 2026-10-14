# Player accounts roadmap

## Phase 1b — **shipped** (`main`, migration `0003_user_accounts`)

| Feature | Route / API |
| --- | --- |
| Sign up | `/sign-up` |
| Sign in + forgot password | `/sign-in` |
| Account hub | `/account` (profile, favorites, preferences) |
| Favorites | Heart on `GameCard`; `GET/POST/DELETE /api/account/favorites` |
| Profile | `GET/PATCH /api/account/profile` |
| Session | `POST /api/auth/session` → upserts `user_profile` |

**Server env (droplet `/etc/nsfwdroid.env`):** `SESSION_SECRET` (auto-generated if missing) + **`FIREBASE_SERVICE_ACCOUNT_JSON`** (you must paste from Firebase Console — without it, session API returns 503 and favorites/profile APIs return 401). See `docs/firebase-setup.md`.

## Phase 1b checklist (done)

## Phase 1c+ (after catalog tags exist)

Followed tags, platform filters, NSFW facet opt-outs, hidden listings, recently viewed (tie `listing_view` to `uid` when signed in).

## Phase 2+

Avatar (Vesper/Andri presets), play history, developer-linked submissions, Android same Firebase project, subscriptions.

**Mascots:** **Andri** = header/favicon; **Vesper** = in-app host character (updates, deals) — `docs/mascots.md`.
