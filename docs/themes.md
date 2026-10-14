# Holiday themes

Server-driven color packs for the storefront. Default branding stays the purple/pink palette from `docs/design-and-mascot.md`; optional holidays swap CSS variables on `<html>`.

## Layout

| Path | Role |
| --- | --- |
| `data/themes/<id>/theme.json` | Name, UTC month schedule, color tokens |
| `data/themes/<id>/icon.svg` | Optional mascot-style icon (served at `/api/theme/icon/<id>`) |
| `src/lib/themes/` | Registry, `resolveActiveTheme()`, cookie preference |
| `src/lib/user-session.ts` | `isSignedIn()` stub until accounts |
| `src/components/theme/ThemeProvider.tsx` | Signed-in-only opt-out banner |
| `POST /api/theme/override` | `{ "preference": "default" \| "auto" }` → `theme_override` httpOnly cookie |

Production can add `data/themes/new-holiday/` on the droplet without redeploying JS: drop `theme.json` (+ icon), restart `nsfwdroid` if the process caches the registry (in-memory cache clears on restart).

## Month rules (UTC)

Months use `schedule.months` with **1 = January … 12 = December**, evaluated in **UTC** on the server.

| Theme | Months | Notes |
| --- | --- | --- |
| `valentines` | February (`2`) | Full month |
| `halloween` | October (`10`) | Full month |
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

`ThemeProvider` shows **Remove holiday theme** only when `isSignedIn()` is true. The stub returns `false` unless `USER_SESSION=1` is set for testing. The override API still works for any visitor (e.g. manual cookie or future account wiring).

## Adding a theme

1. Create `data/themes/<id>/theme.json` (copy an existing file).
2. Add `icon.svg` if desired.
3. Set `schedule.months` and `colors`.
4. Restart the Node process on the server after adding files.

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
