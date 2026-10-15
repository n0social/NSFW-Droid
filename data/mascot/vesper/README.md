# Vesper mascot — SFW design pack

**Vesper** is the female host mascot for in-app UI (updates, deals, subscription prompts, empty states). She is **not** the site header mark — that remains **Andri** (`DroidMark` / `src/components/site/DroidMark.tsx`).

Creative direction: `docs/design-and-mascot.md` and role split in `docs/mascots.md`.

## Brand anchors

| Token | Hex | Use in these SVGs |
| --- | --- | --- |
| Background | `#14061C` | Canvas fill, face panels |
| Surface | `#241033` | Tags, secondary panels |
| Primary | `#C026D3` | Strokes, jacket, UI frames |
| Hot accent | `#FF4D8D` | Hearts, sale badges, cheeks |
| Soft pink | `#F9A8D4` | Smiles, secondary hearts |
| Text | `#FFF1F7` | Highlights |
| Muted text | `#E9D5FF` | Notification copy bars |
| Andri pairing | `#22C55E` | Antenna tips, “live” / success dots only |

Palette matches the storefront outfit (cropped violet jacket, heart clasp, dark bottoms). Post–age-gate variants are a separate, gated art set — not included here.

## Files (pick a direction)

| File | Intent |
| --- | --- |
| `vesper-chipper.svg` | Default host energy: heart eyes, antennae echoing Andri, full storefront bust. Good for onboarding and general empty states. |
| `vesper-wink.svg` | Playful promo tone; one wink, subtle “%” badge. Newsletter teasers and light sale nudges. |
| `vesper-deals.svg` | Wider canvas; stacked DEAL / −30% tags and presenting pose. Deal rails and featured sale modules. |
| `vesper-updates.svg` | Violet eyes (alert variant); points at a notification card with green “new” dot. App update prompts and changelog modals. |

All assets are **SFW**: clothed storefront outfit, adult proportions, no explicit content.

## Usage notes

- Prefer **SVG as source**; scale with CSS `width` / `height` or inline in React. Keep `role="img"` and titles for accessibility, or hide decorative instances with `aria-hidden` when paired with visible copy.
- **Do not** swap these into `SiteHeader` or replace `icon.svg` — Andri stays the public mark until product explicitly changes that policy.
- **Future surfaces:** empty library, failed download retry, age-gate companion (Vesper framing the CTA), receipt/email bust crop, subscription popup corner decoration.
- **Explicit variants:** commission separately per `docs/design-and-mascot.md` (same face/hair/colors, gated delivery only).

## Technical

- View boxes differ per pose (`160×200`, `200×200`, `160×220`); normalize in layout with a shared max height (e.g. `h-48 w-auto`).
- Strokes are intentionally **2–2.5px** at native size to match the thick-border UI language.
- Floating geometric hearts are decorative; reduce opacity or omit in very small thumbnails (&lt; 48px).

## Changelog

- **2026-10-15:** Initial four SFW direction SVGs for design review.
