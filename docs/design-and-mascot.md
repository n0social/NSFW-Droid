# Design and mascot

**Date:** 10 October 2026  
**Status:** theory only. No logo, icon, or character art is being produced in this pass.  
**Product context:** the adult game catalog described in `docs/nsfw-game-market-analysis.md`, `docs/considerations.md`, and `docs/revenue_streams.md`.

## Look

Modern, dark, and loud. The interface sits on near-black violet. Pink and magenta do the highlighting. Hearts are a system, not a sprinkle: they mark favorites, ratings, loading, empty states, the app icon, and the cursor hover. They should feel glossy and flashy, like a nightclub sign, and they should stay geometric so the UI still reads as a store.

Working palette:

| Role | Color | Use |
| --- | --- | --- |
| Background | `#14061C` | Pages, the Android app shell |
| Surface | `#241033` | Cards, the game row |
| Primary | `#C026D3` | Buttons, links, the main heart |
| Hot accent | `#FF4D8D` | Badges, sale, “featured” |
| Soft pink | `#F9A8D4` | Secondary hearts, captions |
| Text | `#FFF1F7` | Titles |
| Muted text | `#E9D5FF` | Metadata |

Type is a geometric sans. **Weight is part of the brand:** almost everything reads bold. Titles and nav use **800–900**. Buttons and card titles use **700**. Metadata and captions still use **600** on muted color — not regular/light weights. Body stays small in size but not faint in weight so blocks and borders feel as loud as the hearts.

**Borders are thick and intentional**, not hairlines. Cards and panels use **2–3px** solid strokes in `#C026D3` or `#241033` (surface-on-bg). The header rule and primary CTAs can go **3px**. Featured/sponsored frames may use **3px** `#FF4D8D`. Wireframe-style dashed borders are for docs only; the live UI uses solid, high-contrast edges so each tile reads like a nightclub sign frame.

The store icon and the home-screen artwork use the covered mascot. Explicit variants stay behind the age gate. A sideloaded APK whose icon is nude gets treated as a suspicious package by players and by on-device scanners. The brand can be adult without putting that on the launcher.

## Mascot

Working name: **Vesper**. One name, easy to letter on an icon. She is an original character: an adult woman, athletic, long dark hair with a pink streak, violet eyes, and a modern purple-and-pink outfit built around a heart clasp. She is confident, a little smug, and she presents the store. She points at games, holds a stack of heart tokens, and leans on the age-gate card. She is not a fighter from a named series, and she does not wear another character’s costume.

Two approved outfits, both for the same adult:

- **Storefront.** Cropped violet jacket, pink heart hardware, dark shorts or a short skirt, boots. This is the icon, the empty state, the loading loop, and any ad that runs before someone confirms they are 18.
- **After the gate.** A more revealing version of the same outfit, same face, same hair, same colors. Same person. The difference is how much of the outfit is there, not a second character. She still reads as an adult on purpose: face, proportions, and styling all say grown woman.

Personality in one line: she runs the floor. She is the host, not the prize inside a game. That keeps her from competing with the games on the shelf.

### What a later image model should be told

When art is commissioned, the prompt describes Vesper and stops. Useful anchors:

- Original character, adult woman, athletic build
- Long black hair with one vivid pink streak, violet eyes
- Outfit in `#C026D3` and `#FF4D8D`, heart-shaped clasp, glossy nightclub lighting
- Dark background `#14061C`, floating geometric hearts
- Expression: knowing smile, looking at the viewer
- Full body and a separate head-and-shoulders for the app icon

Ask for a turnaround later: front, three-quarter, and a simple bust. Those three are enough for the icon, the age gate, and a featured-row decoration. A large illustration set can wait until the catalog has something to decorate.

### What the prompt leaves out

Vesper is not Tifa Lockhart, and the art brief should say so. Tifa is a Square Enix character. A “Tifa lookalike” copies a protected design: the specific hair shapes, the white top with suspenders, the black miniskirt, the red gloves, the red eyes, the name. Shipping that as the store’s face means the mascot can be taken down, and it undercuts the same rule this store is asking developers to follow in `docs/considerations.md`: you distribute what you have the right to use.

The appeal that suggestion was reaching for still belongs in the brand. Adult, athletic, dark hair, striking, a little dangerous, comfortable being looked at. Vesper keeps that and changes the identifiers: violet eyes instead of red, a pink streak, purple-and-pink heart hardware, no suspenders, no red gloves, no Seventh Heaven, no materia, no Final Fantasy names.

Also leave out of every prompt: minors, “teen,” school uniforms, and any real person’s likeness. The character is an adult in the text that accompanies the image, not only in a caption added later.

## Where she shows up

- App icon: bust, storefront outfit, one heart.
- Age gate: full figure, storefront outfit, hearts around the “I am 18” action.
- Empty library and failed download: a smaller pose, one line of copy, a heart that retries.
- Featured row: a corner crop, so the game’s own art stays primary.
- Receipts, emails, and the Play-less download page: the bust mark plus the wordmark.

Game keys stay the game’s own art. Vesper frames the store. She does not replace a title’s cover.

## Wordmark

Working wordmark: the product name set in the geometric sans, with a single hot-pink heart as the dot or the terminal mark. No character illustration inside the wordmark. The icon carries Vesper. The word carries the name. They sit side by side on the download page and stack on the APK icon only if the name still reads at 48 pixels. If it does not, the icon is Vesper alone.

The product name is still the repository name until a public name is chosen. The mascot name and the store name can differ. Vesper can outlive a rename.

## Later, not in this pass

No images, icon fonts, or UI kit yet. Next art step, when you want it, is three stills of Vesper in the storefront outfit against `#14061C`, plus a sheet of six heart icons (outline, solid, sparkle, broken, favorite, loading). The post-gate outfit is a separate, gated set.
