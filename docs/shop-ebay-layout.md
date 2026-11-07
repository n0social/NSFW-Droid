# What to copy from eBay’s shop layout

**Date:** 7 November 2026  
**For:** a small apparel catalog (tees and hoodies) with square art and a left sidebar.  
**Not a build spec.** No routes, components, or prices change because of this note.

eBay’s public site blocked this environment (search returned 403), so this is not a pixel trace of one live session. It follows the layout eBay documents as current, plus the search and item-page redesigns that are the live desktop pattern:

- [Item tile](https://playbook.ebay.com/design-system/components/item-tile) (Playbook, current)
- [Image ratio](https://playbook.ebay.com/foundations/layout-in-product/image-ratio) (Playbook, current)
- [Filtering](https://playbook.ebay.com/design-system/patterns/filtering-patterns) (Playbook, current)
- [Search redesign, Aug 2024](https://innovation.ebayinc.com/stories/ebay-introduces-intuitive-search-redesign-to-elevate-shopper-experience/) and the [2024 design review](https://playbook.ebay.com/articles/ebay-design-2024-in-review) (Jan 2025)
- [Variations on one fixed-price listing](https://www.ebay.com/help/selling/listings/creating-managing-listings/multiquantity-listings-listings-variations?id=4150)
- Seller reports of an item-page image test, Aug 2026 ([Value Added Resource](https://www.valueaddedresource.net/magical-listing-ai-expansion-item-image-test/))

## Search results

Desktop search is a filter column on the left and a field of item tiles on the right. Clothing uses the larger-image treatment from the 2024 redesign (eBay calls the full-width version Shopping view). There is no slogan banner above the tiles.

### Left category rail

The left column is how you move through the catalog and then narrow it. Category is a short list of text links (All, then the branch you are in, then nearby categories). Filters sit in the same column under that list: price, buying format, shipping, and, for clothes, size and color. Picking a category changes which items you are looking at. Picking a filter only shrinks that set.

eBay’s own rule is to keep those jobs apart. Filters refine the current view. They are not a second way to jump to an unrelated page. Applied filters stay visible, and a selected control does not jump to a new position.

On a wide screen the rail costs a column of tiles. eBay’s tile spec drops one tile from the row once the left navigation is open (from 1024px up). The art stays large enough to compare. The rail does not collapse into a row of promo chips.

For this shop the rail is three links: **All**, **Tees**, **Hoodies**. That is the whole category job. Size, if it is filtered at all, is a filter under those links, not a fourth department.

### Listing density

A tile is an image plus a few lines, not a poster. Two arrangements exist:

- **Gallery:** square image on top, text under it. Fewer items on screen, easier to compare art. This is the one that fits square garment art.
- **List:** image on the left, text on the right. More rows on screen, less emphasis on the picture.

With the left rail open, a gallery row is about four tiles on a typical laptop (1280–1440px wide) and five only when the rail is absent. Gaps are small (16px between tiles on that width). Several products are visible without scrolling past a header.

Prices in a gallery row share one horizontal line, and the lines under them share one too. A missing badge on one card does not push that card’s price down. eBay states this directly: do not let prices jump around.

### Image shape

Search tiles are **square (1:1)**. Corners are slightly rounded (16px once the image is 80px or larger). The image is not stretched to fill the box. Square is the standard wherever different items sit side by side, including search and carousels. Other ratios (3:4 for some fashion photography, 16:9 for video) are exceptions, not the results grid.

Each card uses the listing’s first image. A heart sits on the corner of the photo. eBay’s guidance is at most two icons on the image, so the art stays readable.

### Title

The title is the listing title, nothing else. On a desktop tile it wraps to **two lines**, then an ellipsis. It sits under the image (or beside it in list view). There is no tagline, collection name, or mascot caption on the card.

### Price

The price is required, on **its own line**, and bold. If sizes or colors have different prices, the tile shows a range. A discounted price can show the old amount with a strikethrough, on that same price line or the next line if the tile is narrow. The price is not mixed with shipping.

### Shipping line

Delivery cost is the next line under the price, in ordinary body text: “Free delivery” or a delivery amount. It is one line, the same height as the other short facts under the price (eBay aligns those facts to a single-line rhythm). It is not a second headline and not a chip.

Other facts (condition, one short aspect such as “Hoodie”) can sit between title and price. They stay to one or two words. Sponsored, when present, is a small caption at the bottom of the tile.

## Item page

A Buy It Now clothing page is two columns. The picture is on the left. The shopping column is on the right: who is selling, the price, how it ships, the choices, then the buttons. eBay’s 2024 item-page rewrite made that column match the app: larger photo, seller easier to see, one obvious buy action. Detail text (specifics, description) comes **under** that pair of columns, not in the buy column.

### Gallery

The main photo is large. For a product photo, eBay keeps the picture’s real shape on this page; a square artwork file simply stays square. It is not cropped into a wide banner.

The stable gallery keeps a **thumbnail strip** so every photo (and each color’s photo) is one click away. In August 2026 some buyers saw a test that hid the strip and showed two extra frames under the main photo, with the rest behind “See all photos.” Sellers who use variations said buyers could no longer tell the listing had more options. A small catalog should keep the strip.

### Title

The title is the same product name as the card, set larger, and allowed to wrap. It is still a product name, not a slogan.

### Price

The price is the largest text in the right column. Changing size or color updates it when that combination has its own price. The delivery line sits **under the price** (“Free delivery”, or the cost, often with an estimated arrival). Shipping is decided before the buyer hits the button, and it is not repeated as a banner.

### Variation selectors (size)

Size and color are choices on **one** fixed-price listing. eBay does not make a new listing page per size. The control is single-select: a row of buttons when the list is short (S through 3XL fits), or a menu when it is long. One size is selected at a time. A size that is not in stock is not offered. The label is the word “Size”, then the values. Nothing else is styled like a campaign.

Color, when a design has more than one, uses the same listing. Swatches come from each color’s photo. On a results tile, eBay shows a handful of chips (about five), not a new card per color.

### Buy box

The buy box is the right column from the price through the buttons, in this order:

1. Price
2. Delivery line
3. Size (and color, if any)
4. One primary button: **Buy It Now**
5. A quieter second action: **Add to cart**

Watching the item is a small control, not a third button of equal weight. Returns and payment notes are short lines under the buttons. They do not compete with Buy It Now.

## What eBay deliberately does not do

These are choices on the results grid and the Buy It Now page, not a claim that eBay never markets. The fashion hub, Shop the Look, and the homepage are separate surfaces. Search and the item page stay plain.

- **No hero slogan on the results.** The page opens on the rail and the tiles. There is no 16:9 banner, mascot, or tagline above the grid.
- **No promo chips on the cards.** A standout label (“signal”) is used on one or two visible items, not on every tile. One program badge at a time. eBay’s tile rules say not to stack badges and not to cover the photo with buttons. “New”, “Limited”, “Clearance”, and a percent-off chip are not part of the card.
- **No separate visual campaign per colorway.** A black hoodie and a heather hoodie of the same design are variations (or color chips) on one title, one price block, and one gallery. They are not six posters with their own slogans.

## Layout choices that fit this catalog

Square art cards, a left sidebar, and only tees and hoodies:

1. Keep a left text rail with three links: All, Tees, Hoodies. The selected link stays put. Do not replace the rail with chips under a hero.
2. Fill the rest of the page with a gallery of equal square cards. On a laptop with the rail open, aim for about four across so several designs show at once and the art stays large.
3. Under each square, use only a two-line title, a bold price on its own line, and one shipping line. Line the prices up across the row.
4. Put size on the item page as a single row of buttons (S–3XL), under the price and the shipping line, then one Buy It Now button and a quieter Add to cart.
5. Keep each design on one item page. Color, if a design has more than one, is a swatch on that page (and at most a few chips on the card), using the same square art. Do not give each color its own banner, chip, or campaign row.
