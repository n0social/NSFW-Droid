# How standard shops lay out a product catalog

**Date:** 7 November 2026  
**Status:** Research notes only. No storefront build in this doc.  
**Audience:** Owner / product, while the hoodie preview is still a layout.

These notes describe what shoppers already expect from Shopify-style stores, Amazon, Etsy, Printful-powered apparel shops, and small direct-to-consumer clothing brands. They are about the **catalog** (the page of products), not the campaign homepage some brands put in front of it.

Sources worth keeping: [Shopify’s storefront filtering guidelines](https://shopify.dev/docs/storefronts/themes/navigation-search/filtering/storefront-filtering/storefront-filtering-ux), [Shopify on ecommerce filters](https://www.shopify.com/blog/ecommerce-filters), Baymard’s product-list research (a listing page can change whether people find a product at all), and Etsy’s public filter work (color swatches and a clear filter panel). Printful does not impose one consumer theme; shops that sell Printful blanks usually sit on Shopify or a similar grid, with size and color chosen on the product page.

---

## Catalog home

The catalog home is a **list of products you can buy**, with a short way to narrow that list. Shoppers should see merchandise in the first screen.

A typical page, top to bottom:

1. **Site header** with the shop name, a small category menu, search if the catalog is large, and the cart.
2. **Where you are.** A breadcrumb (`Shop / Hoodies`) or a plain page title. A one-line description is enough. A long brand story belongs on an About page.
3. **Controls in one strip:** result count (“4 hoodies”), sort (Featured, Price, Newest), and filters.
4. **The grid.** This is the page. Everything else is chrome around it.
5. **A quiet footer.** Shipping, returns, and size-chart links can sit under the grid. They do not replace it.

### Sidebar or top filters

Both patterns are normal. The choice follows how many real choices the shopper has.

| Pattern | Where it shows up | When it fits |
| --- | --- | --- |
| **Left sidebar** | Amazon on every department; large fashion catalogs; Shopify themes aimed at big collections | Many filter groups at once: size, color, price, brand, material, rating. People can scan them without opening a menu. The rail is usually about 240–300px and stays on screen while the grid scrolls. |
| **Top bar** | Shopify’s default for smaller collections; a lot of apparel DTC themes | Fewer than about five filter groups. Sort and filters share one row above a full-width grid. Active filters show as removable chips (`Size: L` ×). |
| **Button that opens a panel** | Etsy’s filter panel; almost every store on a phone | Same filters as desktop, in a sheet the thumb can reach. The button shows how many filters are on (`Filters (2)`). |

Shopify’s own guidance matches that split: a horizontal toolbar when the store needs fewer than five filters, a vertical sidebar when it needs more. On a phone, a sidebar that was fine on desktop becomes a panel or a bottom sheet. Filters should be multi-select where it makes sense (black **or** heather, M **or** L), and each value can show a count so a dead end is visible before the click.

A store with four products does not need Amazon’s rail. An empty sidebar makes the shop look unfinished. A top strip with sort, and filters only after they change the grid, is the usual small-catalog pattern.

### Grid density

Apparel is scanned by picture, so the grid is image-led and even.

- **Desktop:** four columns is the common Shopify / fashion default. Three columns when each photo needs to be larger. Two columns starts to feel like a lookbook.
- **Phone:** two columns, so two designs can be compared without scrolling past a poster. One column is for spec-heavy goods, not shirts.
- **One crop for every card.** Portrait (about 3:4 or 4:5) for a garment on a body or mannequin; square when every shot is a flat mockup. Mixed heights make the page look like a collage.
- **Spacing** is even and small. The photo is the product, not a card floating in a marketing section.
- **Four items** are one row at four-up, or a 2×2 if the photos need room. No pagination, no “load more,” no infinite scroll.

Denser marketplaces (Amazon, parts of Etsy search) pack more text into each tile because the shopper is comparing strangers’ listings. A single-brand clothing grid stays closer to 70–80% image and puts the decision detail (size, color) on the product page.

### What surrounds the cards

- **Sort** is always available. “Featured” is a manual order. “Best selling” waits until there are real orders.
- **Result count** sits next to sort.
- **Applied filters** stay visible and can be cleared one by one.
- **Badges** are rare: Sale, New, Low stock. One per card. A badge on every tile means none of them mean anything.
- **Hover** on desktop can swap to a second photo (back print, flat lay). Price, title, and the link to the product stay visible without hover. Phones have no hover, so the first image has to carry the design.

---

## What an apparel card usually shows

The card answers “which design is this, and what does it cost?” Size and color are variant choices. Marketplaces put them on the card only when they help someone pick a tile.

| Piece | Usual treatment |
| --- | --- |
| **Image** | One main photo, same angle and background as the other cards. The print or the garment is recognizable at thumbnail size. A second photo on hover is a bonus, not a requirement. Text baked into the photo fights the title underneath. |
| **Title** | Short product name: design plus garment (“Orange stripe hoodie”). Not a slogan, not a paragraph. |
| **Price** | Always visible. Currency included. If a larger size costs more, the card shows the base price or “From $28” and the product page shows the price for the size you pick. A crossed-out compare-at price appears only for a real markdown. |
| **Color** | Small round swatches under the price when the same design comes in more than one color. Clicking a swatch often swaps the photo. One color means no swatches. |
| **Sizes** | Usually **not** a row of buttons on the card. Fashion grids either omit sizes or add one quiet line (“Sizes S–3XL”). The size run is chosen on the product page, next to a size chart. A quick-add control that skips size selection causes wrong orders; if quick-add exists, it asks for a size first. |
| **Extras** | Star ratings on Amazon and Etsy, because the seller is unknown. A single-brand shop can skip stars until reviews exist. Shipping speed and “Prime” are marketplace signals, not something a four-item hoodie grid needs. |

Printful-style product pages follow the same split. The catalog tile is the mockup, the name, and the price. Color dots and the size dropdown (S through 3XL, or whatever the blank allows) live on the product page, because every design shares the same size run.

---

## Category navigation

People need a stable way to move between departments, and a way back.

- **Header links** for the real departments: Hoodies, Tees, All. A shop menu with a handful of text links is what small apparel brands use. A mega-menu (Amazon’s “All”, large fashion sites) is for dozens of departments.
- **The current department is obvious.** The page title matches the link they clicked. Breadcrumbs do the same job one level deeper (`Shop / Hoodies`).
- **Collection chips** (All / Tees / Hoodies) work when there are two or three departments. They sit above the grid and behave like navigation, not like a second hero.
- **Filters are not categories.** Size, color, and price narrow a department. “Hoodies” is the department. Mixing those two jobs makes the menu lie.
- **Empty departments** are left out until they have products. A Tees link that opens a blank grid feels broken.
- **Search** matters on Amazon and Etsy because the catalog is huge. A shop of four designs can rely on the grid. A search box that returns nothing is worse than no search box.
- **URLs** should reflect the department (`/shop` or `/shop/hoodies`) so a shared link opens the same grid. Filter state can live in the query string once filters do something.

Etsy is search-first: category is a taxonomy on the results, and the filter panel is how you narrow a huge mixed catalog. Amazon keeps the department in the left rail and in the breadcrumb, then adds size, color, brand, price, and reviews for apparel. A direct-to-consumer hoodie shop is closer to a Shopify collection: one department, one grid, a short menu.

---

## What makes a shop look like a marketing landing page

These are the patterns that stop the page from reading as a store:

- **A full-screen hero** with a slogan and one button, and no products until you scroll.
- **A long brand essay**, founder story, press logos, “how it’s made,” or a newsletter block **before** the grid. Those sections can follow the products.
- **The same design repeated** as a hero, a feature banner, a testimonial, and a card. The grid should add designs, not echo the banner.
- **Cards that are posters.** Big type on the image, no price, or a price that only appears on hover.
- **Uneven crops and backgrounds**, so the grid looks like a moodboard.
- **Fake departments** (Drop, Vibe, World, Limited) that all show the same four items.
- **A filter sidebar with nothing useful in it**, or size and color controls that do not change the products.
- **A badge on every card** (New, Sale, Hot, Limited) when nothing is actually on sale.
- **Countdown timers, waitlists, and “notify me”** as the main action on a page that is supposed to be a catalog.
- **One giant product** and a story column beside it. That is a product page, or a landing page. A catalog shows the set.

Campaign homepages exist (streetwear themes often open on a full-bleed photo). The shop or collection link behind them is still a plain grid with prices. The catalog itself stays a catalog.

---

## A small hoodie catalog

Scope this note is written for: **four hoodie designs**, sizes **S–3XL**, **no variants live yet**. The preview names in the repo are Vesper panda, Engraved pyramid, White triangle, and Orange stripe. Prices on that preview are stand-ins.

What to do while the catalog is this small:

- **Show all four designs immediately.** One desktop row, or a 2×2. Same mockup angle, same crop, same background, so the prints are what change.
- **Each card:** photo, design name, price. Under the price, one line of copy: **Sizes S–3XL**. That line is information, not a control.
- **Skip color swatches** until a second wearable color exists. A single swatch does not help anyone choose.
- **Skip size buttons** on the card and in a filter. With no live variants, a size control either does nothing or hides products for no reason. The size run belongs on the product page later: S, M, L, XL, 2XL, 3XL, plus a size chart. If 2XL or 3XL costs more at the printer, switch the card to “From $…” at that point and show the size price on the product page.
- **Skip the left sidebar.** Sort is optional when there are four items; a manual order (the order you want people to see) is enough. A top label “Hoodies” and a count (“4”) is the whole chrome.
- **Categories stay honest.** If the shop is hoodies only, the nav item is Hoodies (or Shop). Add Tees when tees are actually in the grid. Do not add Digital, Bundles, Sale, or New until those collections have different products.
- **One price per design** until variants exist. Do not show a price range, a color name, or a selected size that the page cannot apply.
- **Keep marketing art off the card.** A character standee or a “NEW” banner on every hoodie turns the grid back into a poster set. The print on the garment is the image.

When variants go live, the catalog page can stay this simple. Add a color swatch on the card if colors multiply, and add a size filter only when choosing a size actually changes which designs you see (it usually will not, if every design is cut in S–3XL). The product page is where size and color become controls.
