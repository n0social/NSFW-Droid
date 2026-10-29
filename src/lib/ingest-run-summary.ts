/** Human-readable one-liner for ingest_run.summary JSON (admin dashboard). */
export function formatIngestRunSummary(summary: unknown): string {
  if (!summary || typeof summary !== "object") return "—";
  const s = summary as Record<string, unknown>;
  if (s.job === "recycle_stale" || ("staled" in s && !("checked" in s))) {
    const staled = s.staled ?? s.wouldStale;
    return `recycled ${staled ?? 0} listing(s)`;
  }

  if ("checked" in s && ("wouldOrDidMarkBroken" in s || "restoredOk" in s)) {
    const checked = Number(s.checked ?? 0);
    const broken = Number(s.wouldOrDidMarkBroken ?? 0);
    const restored = Number(s.restoredOk ?? 0);
    const linkParts: string[] = [`links checked ${checked}`, `broken ${broken}`];
    if (restored > 0) linkParts.push(`restored ${restored}`);
    return linkParts.join(" · ");
  }

  const inserted = s.newCandidatesInserted as
    | { total?: number; itch?: number; steam?: number; affiliate?: number }
    | undefined;
  const itch = s.itch as {
    newCandidates?: number;
    affiliateUrlsSet?: number;
    feedErrors?: unknown[];
  } | undefined;
  const steam = s.steam as { newCandidates?: number; inserted?: number } | undefined;
  const affiliate = s.affiliate as {
    skipped?: boolean;
    inserted?: number;
    withAffiliateUrl?: number;
  } | undefined;
  const catalog = s.catalog as
    | {
        listings?: number;
        listings_with_affiliate?: number;
        candidates?: number;
        pending?: number;
      }
    | undefined;
  const autoPublished = s.autoPublished as
    | {
        published?: number;
        publishFailed?: number;
        publishErrors?: { title?: string }[];
      }
    | number
    | undefined;

  const parts: string[] = [];

  if (inserted?.total != null) {
    parts.push(`new candidates +${inserted.total}`);
  } else {
    const itchN = itch?.newCandidates ?? 0;
    const steamN = steam?.newCandidates ?? steam?.inserted ?? 0;
    if (itchN || steamN) parts.push(`itch +${itchN} · steam +${steamN}`);
  }

  if (itch?.affiliateUrlsSet != null && itch.affiliateUrlsSet > 0) {
    parts.push(`itch affiliate URLs ${itch.affiliateUrlsSet}`);
  }
  const feedErrorCount = Array.isArray(itch?.feedErrors) ? itch.feedErrors.length : 0;
  if (feedErrorCount > 0) {
    parts.push(`itch feed errors ${feedErrorCount}`);
  }
  if (typeof s.tagsBackfilled === "number" && s.tagsBackfilled > 0) {
    parts.push(`tags backfilled ${s.tagsBackfilled}`);
  }
  if (affiliate && !affiliate.skipped) {
    parts.push(`affiliate +${affiliate.inserted ?? 0} (${affiliate.withAffiliateUrl ?? 0} w/ URL)`);
  } else if (affiliate?.skipped) {
    parts.push("affiliate skipped");
  }

  if (typeof autoPublished === "number") {
    parts.push(`auto-published ${autoPublished}`);
  } else if (autoPublished && typeof autoPublished === "object" && autoPublished.published != null) {
    parts.push(`auto-published ${autoPublished.published}`);
    if (autoPublished.publishFailed && autoPublished.publishFailed > 0) {
      parts.push(`publish failed ${autoPublished.publishFailed}`);
      const sample = autoPublished.publishErrors?.[0]?.title;
      if (sample) parts.push(`e.g. ${sample}`);
    }
  }

  if (catalog?.listings != null) parts.push(`${catalog.listings} listings`);
  if (catalog?.candidates != null) parts.push(`${catalog.candidates} candidates`);
  if (catalog?.pending != null) parts.push(`${catalog.pending} pending`);
  if (catalog?.listings_with_affiliate != null && catalog.listings_with_affiliate > 0) {
    parts.push(`${catalog.listings_with_affiliate} w/ affiliate`);
  }

  return parts.length ? parts.join(" · ") : JSON.stringify(summary).slice(0, 120);
}

export function ingestRunDurationMs(
  startedAt: string,
  finishedAt: string | null,
): number | null {
  if (!finishedAt) return null;
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  return ms >= 0 ? ms : null;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const sec = Math.round(ms / 1000);
  if (sec < 120) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return rem ? `${min}m ${rem}s` : `${min}m`;
}
