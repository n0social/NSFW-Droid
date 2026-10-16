# Vesper mascot — anime host pack (18+ brand)

**Vesper** is the female host mascot for in-app UI (updates, deals, subscription prompts, empty states). She is **not** the site header mark — that remains **Andri** (`DroidMark` / `src/components/site/DroidMark.tsx`).

Creative direction: `docs/design-and-mascot.md` and role split in `docs/mascots.md`.

## Art direction (current — locked)

| Aspect | Direction |
| --- | --- |
| Style | High-quality **anime / ecchi** illustration — adult woman, large expressive eyes, stylized hair, soft skin. **Not** a robot, fembot, or Andri echo. |
| Character | Original **Vesper**: athletic adult (25+), **fair lighter skin tone (locked)**, long black hair with vivid **magenta-pink streak**, **violet** eyes, confident host personality. |
| Outfit | Storefront set: **oversized light-blue boyfriend button-up** — **a little larger and longer** than prior pass (more drape, hem covers more hip/upper thigh), **top buttons unbuttoned** — **only** the shirt (no undershirt, bralette, or visible underwear). **Bare feet** in standing poses (**no boots or shoes**). **No jacket**. Thin **anime glasses** (oval/semi-rimless). Modest ecchi: cleavage/skin from the open shirt at card size, **no explicit nudity** in this pack. |
| Pose | **Standing** full or 3/4 body — legs and **bare feet** visible, not bust-only portraits. Bend promos show full legs/feet where composition allows. |
| Background | Dark violet radial field (`#14061C` → `#3B1454`), floating geometric pink hearts — matches the storefront UI. |
| Pairing with Andri | Andri stays header/favicon (`#22C55E` accents). Vesper uses brand magenta/violet only; **updates** variant may show a **green “new” dot** (`#22C55E`) on the notification card. |

**Pre-gate vs post-gate:** This pack is the **default ecchi storefront** look suitable for age-gate companion art, deal rails, and empty states (still clothed). A **spicier post–age-gate** set (same face/hair/outfit lineage, more revealing) is not shipped yet — commission or generate as a gated folder when product asks.

**Superseded art:** Fembot SFW SVG — `archive/fembot-sfw-2026-10-15/`. Violet **jacket bust** ecchi set — `archive/ecchi-jacket-bust-2026-10-15/`. Button-up **with crop top + shorts** — `archive/ecchi-button-up-crop-top-2026-10-15/`. Shirt-only **with black lace-up boots** — `archive/ecchi-button-up-boots-2026-10-15/`. Boots-era **`vesper-updates`** — `archive/updates-pre-phase2-2026-10-15/`.

## Pose pack (phase 1 + phase 2 — complete)

| Slug | File | Intent / use case |
| --- | --- | --- |
| `vesper-chipper` | `vesper-chipper.png` | Default host — cheerful smile, welcoming wave. Onboarding, general empty states. |
| `vesper-wink` | `vesper-wink.png` | Playful promo — one-eye wink, standing. Newsletters and light nudges. |
| `vesper-deals` | `vesper-deals.png` | Sale energy — presenting pose; **DEAL** / **−30%** tags. Deal rails, featured sales (square slot). |
| `vesper-updates` | `vesper-updates.png` | Changelog / update prompts — points at notification card with green “new” dot. |
| `vesper-wave` | `vesper-wave.png` | Friendly standing wave — social tiles, welcome modals. |
| `vesper-point` | `vesper-point.png` | Points at viewer — primary CTA / subscribe buttons. |
| `vesper-shush` | `vesper-shush.png` | Finger-to-lips “secret deal” — limited promos, teaser banners. |
| `vesper-hips` | `vesper-hips.png` | Hand on hip, confident host — subscription upsell, account perks. |
| `vesper-peace-bend` | `vesper-peace-bend.png` | Bend toward viewer, double peace signs — high-energy ad / ExoClick-style units. |
| `vesper-heart-bend` | `vesper-heart-bend.png` | Bend toward viewer, heart eyes — crush / wishlist / favorites promos. |

## Brand anchors

| Token | Hex | Use in mascot art |
| --- | --- | --- |
| Background | `#14061C` | Scene base |
| Surface | `#241033` | Tags, notification panels |
| Primary | `#C026D3` | UI frames, accents on props |
| Hot accent | `#FF4D8D` | Hearts, sale badges, clasp |
| Soft pink | `#F9A8D4` | Secondary hearts |
| Text | `#FFF1F7` | Highlights on UI chrome |
| Muted text | `#E9D5FF` | Notification copy bars |
| Andri pairing | `#22C55E` | “New” / live indicator on update card only |

## Files

### Naming tiers

| Pattern | Contents |
| --- | --- |
| `vesper-<pose>.png` / `@2x` | **Full bleed** — character on brand vignette (`#14061C` → `#3B1454`) with floating pink hearts (default “with bg” deliverable). |
| `vesper-<pose>-bg-plain.png` | Optional: same gradient vignette **without** hearts (generate on demand; not shipped for every pose). |
| `vesper-<pose>-cutout.png` / `-cutout@2x` | **UI composite** — character plus hearts that overlap the figure; **transparent alpha** (no gradient canvas). Served on site from `public/mascot/vesper/`. |
| `vesper-<pose>.svg` | PNG wrapper (`<image href="…">`). |
| `sources/vesper-<pose>-source.jpg` | Full-bleed master before `sharp` resize. |

Regenerate cutouts from repo root (requires `pip install "rembg[cpu,cli]"` and Node `sharp`):

```bash
node scripts/vesper-cutouts.mjs
```

Chat / agent previews: copy key cutouts to `/opt/cursor/artifacts/` (checkerboard in the IDE indicates transparency).

Each pose ships as `vesper-<pose>.png`, `vesper-<pose>@2x.png`, `vesper-<pose>.svg` (PNG wrapper), and `sources/vesper-<pose>-source.jpg`.

| File | Intent |
| --- | --- |
| `vesper-chipper.png` / `.svg` | Default host: cheerful smile, welcoming **standing** wave. |
| `vesper-wink.png` / `.svg` | Promo: one-eye wink, playful **standing** pose. |
| `vesper-deals.png` / `.svg` | Wider square; **DEAL** / **−30%** tags, **standing** presenting pose. |
| `vesper-updates.png` / `.svg` | **Standing**; points at notification card with green “new” dot. |
| `vesper-wave.png` / `.svg` | Friendly **standing** wave. |
| `vesper-point.png` / `.svg` | **Standing**; points at viewer (CTA). |
| `vesper-shush.png` / `.svg` | **Standing**; playful shush / secret promo. |
| `vesper-hips.png` / `.svg` | **Standing**; hand on hip, confident. |
| `vesper-peace-bend.png` / `.svg` | Bend-over promo; both hands peace signs. |
| `vesper-heart-bend.png` / `.svg` | Bend-over promo; heart eyes. |

### Raster sizes

| PNG | Dimensions @1x | @2x |
| --- | --- | --- |
| Portrait poses (`chipper`, `wink`, `updates`, `wave`, `point`, `shush`, `hips`, `peace-bend`, `heart-bend`) | 384×512 | 768×1024 |
| `vesper-deals.png` | 512×512 | `vesper-deals@2x.png` (1024×1024) |

Long edge is **512px** at @1x. Source illustrations are model-generated (Oct 2026), then normalized with `sharp`.

### SVG note

`.svg` files are **wrappers** that reference the matching PNG (`<image href="…">`). Prefer PNG in `<img>` / CMS / social; use SVG when you need a single scalable asset path and accept embedded raster.

**When to use which format**

| Format | Use when |
| --- | --- |
| **PNG** | Primary deliverable: social, Figma, CMS, `<img>`, email where SVG is blocked. |
| **SVG** | React/Next when you want one file path and crisp layout via viewBox (bitmap scales with container). |

### Transparent cutouts (UI overlays)

Full-bleed poses with background removed for modals and layout overlays:

| Files | Use |
| --- | --- |
| `vesper-<pose>-cutout.png` / `@2x` | Same pose as raster pack; alpha channel via `scripts/vesper-cutouts.mjs` (`rembg`). |

Web copy for the post–age-gate welcome modal: `public/mascot/vesper-wave-cutout.png` (+ `@2x`).

Regenerate @1x and @2x PNGs from new source art (from repo root, requires `sharp`):

```bash
node --input-type=module -e "
import sharp from 'sharp';
import path from 'path';
const dir = 'data/mascot/vesper';
const jobs = [
  { src: 'vesper-chipper-source.jpg', out: 'vesper-chipper.png', w: 384, h: 512 },
  { src: 'vesper-wink-source.jpg', out: 'vesper-wink.png', w: 384, h: 512 },
  { src: 'vesper-deals-source.jpg', out: 'vesper-deals.png', w: 512, h: 512 },
  { src: 'vesper-updates-source.jpg', out: 'vesper-updates.png', w: 384, h: 512 },
  { src: 'vesper-wave-source.jpg', out: 'vesper-wave.png', w: 384, h: 512 },
  { src: 'vesper-point-source.jpg', out: 'vesper-point.png', w: 384, h: 512 },
  { src: 'vesper-shush-source.jpg', out: 'vesper-shush.png', w: 384, h: 512 },
  { src: 'vesper-hips-source.jpg', out: 'vesper-hips.png', w: 384, h: 512 },
  { src: 'vesper-peace-bend-source.jpg', out: 'vesper-peace-bend.png', w: 384, h: 512 },
  { src: 'vesper-heart-bend-source.jpg', out: 'vesper-heart-bend.png', w: 384, h: 512 },
];
for (const { src, out, w, h } of jobs) {
  const srcPath = path.join(dir, 'sources', src);
  const outPath = path.join(dir, out);
  const out2x = path.join(dir, out.replace('.png', '@2x.png'));
  await sharp(srcPath).resize(w, h, { fit: 'cover', position: 'centre' }).png().toFile(outPath);
  await sharp(outPath).resize(w * 2, h * 2).png().toFile(out2x);
}
"
```

(Place raw commission exports under `sources/` when re-running the pipeline.)

## Usage notes

- **Do not** swap Vesper into `SiteHeader` or replace `icon.svg` — Andri stays the public mark unless product policy changes.
- **Accessibility:** `role="img"` and `<title>` on SVG wrappers; for decorative corner crops use `aria-hidden` when copy carries the message.
- **Content policy:** Adult character only; no minors; no real-person likeness; no third-party game character cosplay. Explicit variants stay behind the age gate per `docs/design-and-mascot.md`.
- **Future surfaces:** empty library, failed download retry, age-gate framing, receipt/email bust crop, subscription popup decoration.

## Technical

- Normalize layout with a shared max height (e.g. `h-48 w-auto`); **deals** is square — allow slightly wider slot in deal modules.
- Floating hearts are decorative; reduce opacity below ~48px display height.

## Changelog

- **2026-10-15:** **No-building audit** — regenerated `wave`, `point`, `shush`, `hips` (removed storefront/street/room backgrounds); added transparent `vesper-*-cutout.png` pack + `public/mascot/vesper/` copies; welcome card uses `vesper-wave-cutout`. Prior shop backgrounds: `archive/no-building-regen-2026-10-15/`.
- **2026-10-15:** **Phase 2 complete** — refreshed `vesper-updates`; added ad poses `peace-bend`, `heart-bend`, `wave`, `point`, `shush`, `hips`. Locked **lighter skin tone** across pack; archived pre-refresh updates under `archive/updates-pre-phase2-2026-10-15/`.
- **2026-10-15:** Phase 1 **reference trio** (chipper / wink / deals): **longer oversized shirt**, **bare feet**; archived boots set under `archive/ecchi-button-up-boots-2026-10-15/`.
- **2026-10-15:** Outfit tweak: **button-up only** (removed crop top/undershirt and visible shorts); archived prior set under `archive/ecchi-button-up-crop-top-2026-10-15/`.
- **2026-10-15:** Refreshed ecchi pack: **glasses**, **blue button-up** (no jacket), **standing** poses across chipper/wink/deals/updates; archived jacket bust set under `archive/ecchi-jacket-bust-2026-10-15/`. Sources in `sources/`.
- **2026-10-15:** Replaced fembot SFW SVG set with **anime ecchi** illustrated PNGs (+ @2x); SVGs now PNG wrappers; archived previous direction under `archive/fembot-sfw-2026-10-15/`.
- **2026-10-15:** Initial fembot SFW direction (superseded same day).
