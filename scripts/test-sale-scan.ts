import assert from "node:assert/strict";
import { activeSalePercent } from "../src/lib/sale-badge";
import {
  itchSaleFromItem,
  normalizeStoreUrl,
  parseItchSaleFeed,
  planSaleWrites,
  steamSaleFromDetails,
  type ListingSaleRow,
} from "../src/lib/sale-offer";

const now = Date.parse("2026-11-12T15:00:00Z");

assert.equal(
  normalizeStoreUrl("https://www.Example.itch.io/My-Game/?ac=partner"),
  "example.itch.io/my-game",
);

const discounted = itchSaleFromItem(
  {
    guid: "https://maker.itch.io/imperial-grace",
    discountpercent: "10",
    saleends: "Wed, 18 Nov 2026 18:00:00 GMT",
    price: "$17.91",
  },
  now,
);
assert.equal(discounted?.sale.percent, 10);
assert.equal(discounted?.key, "maker.itch.io/imperial-grace");

assert.equal(
  itchSaleFromItem(
    {
      guid: "https://puppetcombo.itch.io/nun-massacre",
      discountpercent: "0",
      saleends: "Mon, 16 Nov 2026 18:00:00 GMT",
    },
    now,
  ),
  null,
);

assert.equal(
  itchSaleFromItem(
    {
      guid: "https://maker.itch.io/ended",
      discountpercent: 40,
      saleends: "Wed, 11 Nov 2026 18:00:00 GMT",
    },
    now,
  ),
  null,
);

const feed = parseItchSaleFeed(
  `<?xml version="1.0"?><rss version="2.0"><channel><item>
    <guid>https://maker.itch.io/on-sale</guid>
    <discountpercent>25</discountpercent>
    <saleends>Wed, 18 Nov 2026 18:00:00 GMT</saleends>
  </item><item>
    <guid>https://maker.itch.io/full-price</guid>
    <discountpercent>0</discountpercent>
  </item></channel></rss>`,
  now,
);
assert.equal(feed.itemCount, 2);
assert.equal(feed.sales.size, 1);
assert.equal(feed.sales.get("maker.itch.io/on-sale")?.percent, 25);

assert.deepEqual(steamSaleFromDetails({ price_overview: { discount_percent: 50 } }), {
  percent: 50,
  endsAt: null,
});
assert.equal(steamSaleFromDetails({ price_overview: { discount_percent: 0 } }), null);
assert.equal(steamSaleFromDetails({}), null);

assert.equal(activeSalePercent({ salePercent: 15, saleEndsAt: "2026-11-18T18:00:00Z" }, now), 15);
assert.equal(activeSalePercent({ salePercent: 15, saleEndsAt: "2026-11-11T18:00:00Z" }, now), null);
assert.equal(activeSalePercent({ salePercent: 20, saleEndsAt: null }, now), 20);

const itchRow: ListingSaleRow = {
  id: "itch-1",
  source: "itch",
  officialUrl: "https://maker.itch.io/on-sale/",
  externalId: "https://maker.itch.io/on-sale",
  salePercent: null,
  saleEndsAt: null,
};
const steamOn: ListingSaleRow = {
  id: "steam-1",
  source: "steam",
  officialUrl: "https://store.steampowered.com/app/10",
  externalId: "10",
  salePercent: 10,
  saleEndsAt: null,
};
const steamMissed: ListingSaleRow = {
  id: "steam-2",
  source: "steam",
  officialUrl: "https://store.steampowered.com/app/11",
  externalId: "11",
  salePercent: 30,
  saleEndsAt: null,
};
const manual: ListingSaleRow = {
  id: "manual-1",
  source: "manual",
  officialUrl: "https://example.com/game",
  externalId: null,
  salePercent: null,
  saleEndsAt: null,
};

const writes = planSaleWrites(
  [itchRow, steamOn, steamMissed, manual],
  feed.sales,
  new Map([
    ["10", null],
  ]),
);
assert.deepEqual(
  writes.map((write) => ({ id: write.id, salePercent: write.salePercent, changed: write.changed })),
  [
    { id: "itch-1", salePercent: 25, changed: true },
    { id: "steam-1", salePercent: null, changed: true },
  ],
);

const kept = planSaleWrites([steamMissed], null, new Map());
assert.equal(kept.length, 0);

console.log("test-sale-scan: ok");
