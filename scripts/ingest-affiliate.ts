import "dotenv/config";
import { readFile } from "fs/promises";
import { upsertCandidate, touchIngestSource } from "./lib/ingest-common";

type AffiliateRow = {
  external_id: string;
  title: string;
  outbound_url: string;
  affiliate_url?: string;
};

export async function runAffiliateIngest() {
  const path = process.env.AFFILIATE_EXPORT_PATH ?? "data/affiliate-export.json";
  let rows: AffiliateRow[] = [];
  try {
    const raw = await readFile(path, "utf8");
    rows = JSON.parse(raw) as AffiliateRow[];
  } catch {
    await touchIngestSource("affiliate_export", {
      skipped: true,
      reason: "no file",
      path,
    });
    return { source: "affiliate", skipped: true, inserted: 0 };
  }

  let inserted = 0;
  for (const row of rows) {
    if (!row.external_id || !row.title || !row.outbound_url) continue;
    const ok = await upsertCandidate({
      source: "affiliate_export",
      externalId: row.external_id,
      title: row.title,
      outboundUrl: row.outbound_url,
      rawPayload: { affiliate_url: row.affiliate_url },
    });
    if (ok) inserted += 1;
  }

  await touchIngestSource("affiliate_export", { rows: rows.length, inserted });
  return { source: "affiliate", skipped: false, inserted, rows: rows.length };
}

async function main() {
  const result = await runAffiliateIngest();
  console.log(JSON.stringify(result));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
