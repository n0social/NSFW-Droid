# Firebase setup (Auth + Analytics)

Player accounts use the **Firebase modular web SDK** on the client and an optional **httpOnly session cookie** for server-side `isSignedIn()` (holiday theme opt-out, SSR).

**Analytics:** When all required Firebase env vars **and** `NEXT_PUBLIC_GA_MEASUREMENT_ID` are set, the app uses the **Firebase Analytics SDK** (`getAnalytics`) only — no duplicate gtag snippet. Use **one** GA4 Measurement ID everywhere: the value in `/etc/nsfwdroid.env`, the Firebase web app `measurementId`, and the GA4 property linked under Project settings → Integrations (production currently uses **`G-T6WLS2QZ7L`** — do not mix a second property such as an old test project). If Firebase is not configured but `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set, the standalone gtag loader in `GoogleAnalytics.tsx` is used instead.

Console: [Firebase console](https://console.firebase.google.com/)

## 1. Create project and web app

1. Create a Firebase project (or use an existing one).
2. **Build → Authentication → Sign-in method**: enable **Email/Password** and **Google**.
3. **Project settings → General → Your apps → Web**: register the app and copy the config object.

## 2. Environment variables

Copy from `.env.example` into local `.env` and on the droplet into `/etc/nsfwdroid.env` (see `deploy/nsfwdroid.service`).

**Required for client sign-in:**

| Variable | Source |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Web app config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Web app config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Web app config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Web app config |

**Optional (shown in console config):**

| Variable | Source |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Web app config |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Web app config |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Web app config `measurementId` (GA4 property linked to this Firebase project) |

**Required for SSR session cookie** (`POST /api/auth/session`, `isSignedIn()` on the server):

| Variable | Source |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Project settings → Service accounts → Generate new private key (paste **minified JSON** on one line) |
| `SESSION_SECRET` | Long random string (e.g. `openssl rand -base64 32`) |

Without `FIREBASE_SERVICE_ACCOUNT_JSON` and `SESSION_SECRET`, `/sign-in` still works in the browser, but the session API returns `503` and the header holiday banner will not see you as signed in until those are set.

Never commit real keys. `.env` stays local; production uses `/etc/nsfwdroid.env`.

## 3. Authorized domains

In Firebase Authentication → Settings → **Authorized domains**, add:

- `localhost` (local dev)
- `nsfwdroid.com` and `www.nsfwdroid.com` (production)

## 4. Deploy on the droplet

After updating `/etc/nsfwdroid.env`:

```bash
cd /var/www/nsfwdroid   # or your app path
git pull
npm ci
npm run build
systemctl restart nsfwdroid
```

## 5. App routes

| Path | Purpose |
| --- | --- |
| `/sign-in` | Email/password + Google |
| `/account` | Email, sign out, favorites/subscription placeholders, holiday theme opt-out |
| `POST /api/auth/session` | Exchange Firebase ID token → httpOnly `USER_SESSION` cookie |
| `DELETE /api/auth/session` | Clear session cookie |

Client state: `src/components/auth/AuthProvider.tsx` (`useAuth()`).  
Server check: `src/lib/user-session.ts` → `isSignedIn()`.
