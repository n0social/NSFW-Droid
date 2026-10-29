import { getGscAccessToken } from "@/lib/gsc-auth";
import { getGscPropertyUrl } from "@/lib/gsc-config";

export type GscSearchRow = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscSearchAnalyticsResponse = {
  rows?: GscSearchRow[];
  responseAggregationType?: string;
};

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function gscDateRange(windowDays: number): { startDate: string; endDate: string } {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (windowDays - 1));
  return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
}

export async function querySearchAnalytics(input: {
  startDate: string;
  endDate: string;
  dimensions: ("date" | "query" | "page" | "country" | "device")[];
  rowLimit?: number;
}): Promise<GscSearchAnalyticsResponse> {
  const token = await getGscAccessToken();
  if (!token) {
    throw new Error("GSC credentials not configured");
  }

  const siteUrl = encodeURIComponent(getGscPropertyUrl());
  const url = `https://www.googleapis.com/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate: input.startDate,
      endDate: input.endDate,
      dimensions: input.dimensions,
      rowLimit: input.rowLimit ?? 25000,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GSC API ${res.status}: ${text.slice(0, 500)}`);
  }

  return JSON.parse(text) as GscSearchAnalyticsResponse;
}

export function mapGscRows(
  rows: GscSearchRow[] | undefined,
  keyName: "date" | "query",
): {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}[] {
  if (!rows?.length) return [];
  return rows.map((row) => ({
    key: row.keys[0] ?? "",
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0,
  }));
}
