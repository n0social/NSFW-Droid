import type { Listing, Tag } from "../src/db/schema";
import { buildGamePageJsonLd } from "../src/lib/listing-json-ld";

function baseListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "test-game",
    title: "[Demo] Test Game",
    platforms: ["windows", "linux"],
    officialUrl: "https://example.com/game",
    affiliateUrl: null,
    artworkSource: "typographic",
    coverImageUrl: "https://cdn.example/cover.jpg",
    sponsorship: null,
    linkStatus: "ok",
    catalogStale: false,
    firstSeenAt: new Date("2026-01-01"),
    publishedAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-02"),
    chartRank: null,
    chartBucket: null,
    source: "itch",
    externalId: "ext-1",
    storeDescription: null,
    ...overrides,
  };
}

const sampleTags: Tag[] = [
  { id: "1", slug: "visual-novel", label: "Visual novel", kind: "genre" },
  { id: "2", slug: "romance", label: "Romance", kind: "keyword" },
];

let failed = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    failed += 1;
    console.error("FAIL:", msg);
  }
}

const steamDoc = buildGamePageJsonLd(baseListing(), "A mature game.", sampleTags) as {
  "@graph": Record<string, unknown>[];
};
assert(Array.isArray(steamDoc["@graph"]), "@graph present");
assert(steamDoc["@graph"].length === 2, "two graph nodes");
const game = steamDoc["@graph"][0];
assert(game["@type"] === "VideoGame", "VideoGame");
assert(Boolean(game.gamePlatform), "gamePlatform");
assert(game.genre === "Visual novel", "genre");
assert(typeof game.keywords === "string" && game.keywords.includes("Romance"), "keywords");
assert((game.audience as { requiredMinAge?: number })?.requiredMinAge === 18, "audience");
const crumbs = steamDoc["@graph"][1];
assert(crumbs["@type"] === "BreadcrumbList", "breadcrumbs");
const browserGame = (
  buildGamePageJsonLd(baseListing({ platforms: ["browser"] }), "x", []) as {
    "@graph": Record<string, unknown>[];
  }
)["@graph"][0];
assert(browserGame["@type"] === "SoftwareApplication", "browser type");
assert(browserGame.operatingSystem === "Web browser", "operatingSystem");

if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log("ok (listing JSON-LD)");
