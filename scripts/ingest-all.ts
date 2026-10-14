import "dotenv/config";
import { autoPublishDemo } from "./lib/ingest-common";
import { runItchIngest } from "./ingest-itch";
import { runSteamIngest } from "./ingest-steam";
import { runAffiliateIngest } from "./ingest-affiliate";

async function main() {
  const itch = await runItchIngest();
  const steam = await runSteamIngest();
  const affiliate = await runAffiliateIngest();
  const autoPublished = await autoPublishDemo(100);

  console.log(JSON.stringify({ itch, steam, affiliate, autoPublished }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
