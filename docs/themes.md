# Holiday themes

Server-driven color packs for the storefront. Default branding stays the purple/pink palette from `docs/design-and-mascot.md`; optional holidays swap CSS variables on `<html>`.

**Live behavior:** In production, the active month (UTC) selects the theme — e.g. October → Halloween, December → Christmas. Holiday `icon.svg` files are decorative layout icons, not the **Vesper** character mascot (Vesper is reserved for in-app prompts and updates later).

## Theme package convention

Each holiday lives under `data/themes/<id>/` as a **theme package**:

| File | Required | Role |
| --- | --- | --- |
| `theme.json` | Yes | `id`, `name`, `priority`, `schedule.months`, `schedule.description`, `colors` |
| `icon.svg` | Yes | Tab/mark icon (~36px) served at `/api/theme/icon/<id>` |
| `decor.svg` | Yes | Banner/larger decorative SVG (seasonal garland; optional global wiring) |
| `chip.svg` | Recommended | 24×24 accent for filter chips / pills |
| `rail.svg` | Recommended | 80×40 end-cap for horizontal section headers |
| `badge.svg` | Recommended | Corner badge (sale/event) with optional holiday motif |
| `empty.svg` | Optional | Empty favorites / browse illustration for that month |
| `README.md` | Yes | One-line description + asset list for operators |

**Serving assets:** Any whitelisted SVG in the theme folder is available at  
`GET /api/theme/asset/<id>/<filename>` where `<filename>` matches `[a-z0-9-]+.svg`  
(e.g. `/api/theme/asset/halloween/chip.svg`). The legacy icon route  
`/api/theme/icon/<id>` still serves `icon.svg` (or `theme.json` → `icon`).

## Shipped theme packages

| `id` | Months (UTC) | Package files |
| --- | --- | --- |
| `valentines` | `2` (February) | `theme.json`, `icon.svg`, `decor.svg`, `chip.svg`, `rail.svg`, `badge.svg`, `empty.svg`, `README.md` |
| `easter` | `3`, `4` (March–April) | same asset set as above |
| `summer` | `6`, `7`, `8` (June–August) | same asset set as above |
| `halloween` | `10` (October) | same asset set as above |
| `thanksgiving` | `11` (November) | same asset set as above |
| `christmas` | `12` (December) | same asset set as above |

| `id` | Icon motif |
| --- | --- |
| `valentines` | Heart-eyed android |
| `easter` | Pastel egg-bodied android |
| `summer` | Sunglasses android with sun |
| `halloween` | Pumpkin + orange android |
| `thanksgiving` | Pilgrim-hat harvest android |
| `christmas` | Santa-hat android with snow accents |

Default (non-holiday) colors are compiled from `src/lib/themes/default-theme.ts` (neon green accents on `#14061C`); holiday packs override via `theme.json` only.

## Layout (code)

| Path | Role |
| --- | --- |
| `data/themes/<id>/theme.json` | Name, UTC month schedule, color tokens |
| `data/themes/<id>/icon.svg` | Mascot-style icon (served at `/api/theme/icon/<id>`) |
| `data/themes/<id>/decor.svg` | Seasonal garland / banner art |
| `data/themes/<id>/*.svg` | Extra assets via `/api/theme/asset/<id>/<filename>` |
| `src/lib/themes/` | Registry, `resolveActiveTheme()`, cookie preference |
| `src/lib/user-session.ts` | `isSignedIn()` via httpOnly session cookie (Firebase) |
| `src/components/theme/ThemeProvider.tsx` | Signed-in-only opt-out banner (theme name + `/api/theme/icon/<id>`) |
| `POST /api/theme/override` | `{ "preference": "default" \| "auto" }` → `theme_override` httpOnly cookie |

Production can add `data/themes/new-holiday/` on the droplet without redeploying JS: drop the package files, restart `nsfwdroid` if the process caches the registry (in-memory cache clears on restart).

## Month rules (UTC)

Months use `schedule.months` with **1 = January … 12 = December**, evaluated in **UTC** on the server.

| Theme | Months | Notes |
| --- | --- | --- |
| `valentines` | February (`2`) | Full month |
| `easter` | March–April (`3`, `4`) | Full months |
| `summer` | June–August (`6`, `7`, `8`) | Full months |
| `halloween` | October (`10`) | Full month |
| `thanksgiving` | November (`11`) | Full month |
| `christmas` | December (`12`) | Full month |

If two themes share a month, the higher `priority` in `theme.json` wins.

## Resolution order

1. Cookie `theme_override=default` → force built-in default colors (opt out).
2. Else if a holiday matches the current UTC month → that theme.
3. Else → default.

`preference: "auto"` clears the override cookie.

Future: `getUserThemePreference(userId)` in `src/lib/themes/preferences.ts` can override the cookie when accounts persist settings.

## CSS variables

Injected on `<html data-theme="…">` from the active theme:

- `--background`, `--foreground`
- `--theme-primary`, `--theme-accent`, `--theme-surface`, `--theme-text-muted`, `--theme-border`, `--theme-border-strong`

Storefront chrome (`SiteHeader`, home page shell, blur chip) reads these where practical.

## Signed-in UI

`ThemeProvider` shows **Remove holiday theme** only when `isSignedIn()` is true (Firebase session cookie). When a holiday is active, the banner shows the theme name and a small icon from `/api/theme/icon/<id>`. The override API still works for any visitor via the `theme_override` cookie. Account page duplicates the opt-out for signed-in users.

## Adding a theme

1. Create `data/themes/<id>/` with `theme.json`, `icon.svg`, `decor.svg`, recommended `chip.svg` / `rail.svg` / `badge.svg`, optional `empty.svg`, and `README.md`.
2. Set `schedule.months` and `colors`.
3. Restart the Node process on the server after adding files.

Example `theme.json` shape:

```json
{
  "id": "valentines",
  "name": "Valentine's",
  "priority": 10,
  "schedule": { "months": [2], "description": "February UTC" },
  "colors": {
    "background": "#14061C",
    "foreground": "#FFF1F7",
    "primary": "#C026D3",
    "accent": "#FF4D8D",
    "surface": "#241033",
    "textMuted": "#E9D5FF",
    "border": "#C026D340",
    "borderStrong": "#C026D3"
  }
}
```
