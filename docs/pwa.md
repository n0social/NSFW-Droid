# Install NSFW Droid (PWA)

NSFW Droid ships a [web app manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest) so you can add the catalog to your home screen on phones and tablets. The installed shortcut opens in **standalone** mode (no browser chrome) with the same age gate and catalog as the website.

**Production URL:** https://www.nsfwdroid.com

---

## Android (Chrome)

1. Open **https://www.nsfwdroid.com** in Chrome.
2. Pass the **18+ age gate**.
3. Scroll to the footer and tap **Install** on the “Add to Home Screen” card, **or** use Chrome’s menu → **Install app** / **Add to Home screen** when offered.
4. Confirm. The NSFW Droid icon appears on your launcher.

**Notes**

- Install prompts require HTTPS and a valid manifest (served at `/manifest.webmanifest`).
- If you dismissed the footer prompt, clear site data or use Chrome’s menu install option.

---

## iPhone / iPad (Safari)

Apple does not support the Chrome install prompt. Use Safari’s share sheet:

1. Open **https://www.nsfwdroid.com** in **Safari** (not Chrome, not an in-app browser from another app).
2. Pass the **18+ age gate**.
3. In the footer, tap **How on iPhone** for the step list, or:
   - Tap **Share** (square with arrow).
   - Tap **Add to Home Screen**.
   - Tap **Add**.

The shortcut uses the same icon as the site (`apple-icon.png`).

---

## What gets installed

| Item | Value |
| --- | --- |
| App name | NSFW Droid |
| Theme / splash color | `#14061C` |
| Start URL | `/` |
| Icons | `public/icons/icon-192.png`, `apple-icon.png` |

There is **no offline service worker** today — the installed app needs a network connection to load listings.

---

## Developers

- Manifest: `src/app/manifest.ts` (Next.js metadata route).
- Head tags: `themeColor` and `appleWebApp` in `src/app/layout.tsx`.
- Footer UI: `src/components/site/PwaInstallPrompt.tsx`.

After changing manifest or icons, rebuild and redeploy ([deploy-droplet.md §4b](deploy-droplet.md#4b-cloud-agent-release-code--build)).
