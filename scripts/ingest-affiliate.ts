import "dotenv/config";
import { readFile } from "fs/promises";
import { upsertCandidate, touchIngestSource } from "./lib/ingest-common";
import { resolveAffiliateExportPath } from "./lib/affiliate-export";

type AffiliateRow = {
  external_id: string;
  title: string;
  outbound_url: string;
  affiliate_url?: string;
};

export async function runAffiliateIngest() {
  const path = await resolveAffiliateExportPath();
  if (!path) {
    return {
      source: "affiliate",
      skipped: true,
      reason: "no export configured",
      inserted: 0,
      rows: 0,
      withAffiliateUrl: 0,
    };
  }

  let rows: AffiliateRow[] = [];
  try {
    const raw = await readFile(path, "utf8");
    rows = JSON.parse(raw) as AffiliateRow[];
    if (!Array.isArray(rows)) {
      throw new Error("export must be a JSON array");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await touchIngestSource("affiliate_export", {
      skipped: true,
      reason: "read failed",
      path,
      error: message,
    });
    return {
      source: "affiliate",
      skipped: true,
      reason: "read failed",
      path,
      inserted: 0,
      rows: 0,
      withAffiliateUrl: 0,
    };
  }

  let inserted = 0;
  let withAffiliateUrl = 0;
  for (const row of rows) {
    if (!row.external_id || !row.title || !row.outbound_url) continue;
    const affiliateUrl = row.affiliate_url?.trim() || row.outbound_url.trim();
    if (affiliateUrl) withAffiliateUrl += 1;
    const ok = await upsertCandidate({
      source: "affiliate_export",
      externalId: row.external_id,
      title: row.title,
      outboundUrl: row.outbound_url,
      rawPayload: { affiliate_url: affiliateUrl },
    });
    if (ok) inserted += 1;
  }

  await touchIngestSource("affiliate_export", {
    path,
    rows: rows.length,
    inserted,
    withAffiliateUrl,
  });
  return {
    source: "affiliate",
    skipped: false,
    path,
    inserted,
    rows: rows.length,
    withAffiliateUrl,
  };
}

async function main() {
  const result = await runAffiliateIngest();
  console.log(JSON.stringify(result));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
