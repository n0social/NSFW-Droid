"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { AdminAudienceToggle } from "@/components/AdminAudienceToggle";
import type { AdminDashboardSnapshot } from "@/lib/admin-dashboard";
import type { AnalyticsAudience } from "@/lib/analytics-quality";
import {
  formatDuration,
  formatIngestRunSummary,
  ingestRunDurationMs,
} from "@/lib/ingest-run-summary";

const POLL_MS = 30_000;

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-[#C026D3]/30 bg-[#241033] p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#E9D5FF]/70">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums text-[#FFF1F7]">{value}</p>
      {hint && <p className="mt-1 text-[10px] text-[#E9D5FF]/60">{hint}</p>}
    </div>
  );
}

function TopList({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: { listingId: string; title: string; slug: string; count: number }[];
  emptyLabel: string;
}) {
  return (
    <div className="rounded-xl border border-[#C026D3]/30 bg-[#241033] p-4">
      <h2 className="text-sm font-black">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-xs text-[#E9D5FF]/70">{emptyLabel}</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {rows.map((row, i) => (
            <li key={row.listingId} className="flex items-baseline justify-between gap-2 text-xs">
              <span className="font-bold text-[#FF4D8D] tabular-nums">{i + 1}.</span>
              <Link
                href={`/game/${row.slug}`}
                className="min-w-0 flex-1 truncate font-semibold text-[#F9A8D4] hover:underline"
              >
                {row.title}
              </Link>
              <span className="shrink-0 tabular-nums text-[#E9D5FF]">{row.count}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audience, setAudience] = useState<AnalyticsAudience>("visitors");

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/dashboard?audience=${audience}`);
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    if (!res.ok) {
      setError("Failed to load dashboard");
      setLoading(false);
      return;
    }
    const json = (await res.json()) as AdminDashboardSnapshot;
    setData(json);
    setError(null);
    setLoading(false);
  }, [audience]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <AdminShell title="Admin dashboard">
      <p className="text-xs text-[#E9D5FF]/80">
        Live metrics refresh every 30s. Play clicks are age-verified visits to a store link.
        Each browser gets its own session cookie, so unique browsers are not the shared age-gate
        value. Card impressions count when a card is half on screen, once per browser per day.
        Ingest does not write either number. Rails still blend raw events with favorites
        (weights in <code className="text-[#F9A8D4]">listings-ranking.ts</code>). Daily chart:{" "}
        <Link href="/admin/traffic" className="text-[#FF4D8D] underline">Traffic marker</Link> ·{" "}
        <Link href="/admin/search" className="text-[#FF4D8D] underline">Search (GSC)</Link>.
      </p>
      <AdminAudienceToggle value={audience} onChange={setAudience} />

      {loading && !data && <p className="mt-6 text-sm text-[#E9D5FF]">Loading…</p>}
      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

      {data && (
        <>
          <p className="mt-2 text-[10px] text-[#E9D5FF]/50">
            Updated {new Date(data.generatedAt).toLocaleString()}
            {data.catalog.pendingCandidates > 0 && (
              <>
                {" · "}
                <Link href="/admin/queue" className="text-[#FF4D8D] underline">
                  {data.catalog.pendingCandidates} pending review
                </Link>
              </>
            )}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Listings"
              value={data.catalog.listings}
              hint={
                data.catalog.softCap
                  ? `${data.catalog.staleListings} stale · +${data.catalog.addedLast7d} / 7d · soft cap ${data.catalog.softCap}`
                  : `${data.catalog.staleListings} stale · +${data.catalog.addedLast7d} / 7d`
              }
            />
            <StatCard label="Accounts" value={data.users.total} hint={`+${data.users.signups24h} / 24h`} />
            <StatCard
              label={audience === "all" ? "Outbound clicks (raw)" : "Play clicks"}
              value={
                audience === "all"
                  ? data.analytics.outboundClicks24h
                  : data.analytics.playClicks24h
              }
              hint={
                audience === "all"
                  ? `${data.analytics.outboundClicks7d} / 7d raw · ${data.analytics.playClicks24h} verified plays / 24h · ${data.analytics.unverifiedGoHits24h} unverified /api/go / 24h`
                  : `${data.analytics.playClicks7d} / 7d · ${data.analytics.uniquePlayBrowsers24h} unique browsers / 24h · ${data.analytics.unverifiedGoHits24h} unverified /api/go hits excluded · affiliate ${data.analytics.affiliateClicks24h} / official ${data.analytics.officialClicks24h}`
              }
            />
            <StatCard
              label="Card impressions"
              value={data.analytics.cardImpressions24h}
              hint={`${data.analytics.cardImpressions7d} / 7d · ${data.analytics.uniqueImpressionBrowsers24h} unique browsers / 24h · ${data.analytics.detailViews24h} game-page opens / 24h. A card counts once it is half on screen, once per browser per day.`}
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Sign-ups (7d)" value={data.users.signups7d} />
            <StatCard label="Total favorites" value={data.users.favoritesTotal} />
            <StatCard
              label="Ads enabled"
              value={data.revenue.adsEnabled ? "Yes" : "No"}
              hint="NEXT_PUBLIC_ADS_ENABLED at last build"
            />
          </div>

          {data.catalog.listingsBySource.length > 0 && (
            <section className="mt-6">
              <h2 className="text-sm font-black">Listings by source</h2>
              <p className="mt-1 text-[10px] text-[#E9D5FF]/60">
                Curate by unpublishing low-quality rows in the queue — set{" "}
                <code className="text-[#F9A8D4]">CATALOG_SOFT_CAP</code> as an editorial target (not
                auto-deleted).
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {data.catalog.listingsBySource.map((row) => (
                  <li
                    key={row.source}
                    className="rounded-full border border-[#C026D3]/35 bg-[#241033] px-3 py-1.5 text-xs font-semibold text-[#FFF1F7]"
                  >
                    {row.source}: <span className="tabular-nums text-[#FF4D8D]">{row.count}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <TopList
              title={audience === "all" ? "Top outbound clicks (7d, raw)" : "Top play clicks (7d)"}
              rows={data.top.clicks7d}
              emptyLabel="No clicks yet."
            />
            <TopList title="Top card impressions (48h)" rows={data.top.views48h} emptyLabel="No card impressions yet." />
            <TopList title="Most favorited" rows={data.top.favorites} emptyLabel="No favorites yet." />
          </div>

          <section className="mt-8">
            <h2 className="text-sm font-black">Added last 7 days</h2>
            <p className="mt-1 text-[10px] text-[#E9D5FF]/60">
              Live listings where <code className="text-[#F9A8D4]">first_seen_at</code> (or{" "}
              <code className="text-[#F9A8D4]">published_at</code> fallback) is within 7 days — same
              window as <code className="text-[#F9A8D4]">catalog-new-arrivals-report.ts</code>.
            </p>
            <div className="mt-3 overflow-x-auto rounded-xl border border-[#C026D3]/30">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="bg-[#241033] text-[#E9D5FF]/70">
                  <tr>
                    <th className="px-3 py-2 font-bold">Title</th>
                    <th className="px-3 py-2 font-bold">Source</th>
                    <th className="px-3 py-2 font-bold">First seen</th>
                    <th className="px-3 py-2 font-bold">External ID</th>
                  </tr>
                </thead>
                <tbody>
                  {data.newArrivals7d.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-[#E9D5FF]/60">
                        No new live listings in the last 7 days.
                      </td>
                    </tr>
                  )}
                  {data.newArrivals7d.map((row) => (
                    <tr key={row.id} className="border-t border-[#C026D3]/20">
                      <td className="px-3 py-2">
                        <Link
                          href={`/game/${row.slug}`}
                          className="font-semibold text-[#F9A8D4] hover:underline"
                        >
                          {row.title}
                        </Link>
                        {row.publishedBumped && (
                          <span className="ml-2 text-[10px] text-amber-300/90">recycled bump</span>
                        )}
                      </td>
                      <td className="px-3 py-2">{row.source ?? "—"}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {new Date(row.firstSeenAt).toLocaleString()}
                      </td>
                      <td className="max-w-[140px] truncate px-3 py-2 font-mono text-[10px] text-[#E9D5FF]/80">
                        {row.externalId ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-black">Ingest sources</h2>
            <div className="mt-3 overflow-x-auto rounded-xl border border-[#C026D3]/30">
              <table className="w-full min-w-[480px] text-left text-xs">
                <thead className="bg-[#241033] text-[#E9D5FF]/70">
                  <tr>
                    <th className="px-3 py-2 font-bold">Source</th>
                    <th className="px-3 py-2 font-bold">Last run</th>
                    <th className="px-3 py-2 font-bold">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ingestSources.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-[#E9D5FF]/60">No ingest runs recorded yet.</td>
                    </tr>
                  )}
                  {data.ingestSources.map((s) => (
                    <tr key={s.name} className="border-t border-[#C026D3]/20">
                      <td className="px-3 py-2 font-semibold">{s.name}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {s.lastRunAt ? new Date(s.lastRunAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-3 py-2 text-red-300">{s.lastError ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-black">Ingest runs (last 20)</h2>
            <p className="mt-1 text-[10px] text-[#E9D5FF]/60">
              Rows from <code className="text-[#F9A8D4]">ingest_run</code> — cron{" "}
              <code className="text-[#F9A8D4]">ingest_all</code> and maintenance jobs.
            </p>
            <div className="mt-3 overflow-x-auto rounded-xl border border-[#C026D3]/30">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="bg-[#241033] text-[#E9D5FF]/70">
                  <tr>
                    <th className="px-3 py-2 font-bold">Job</th>
                    <th className="px-3 py-2 font-bold">Status</th>
                    <th className="px-3 py-2 font-bold">Started</th>
                    <th className="px-3 py-2 font-bold">Finished</th>
                    <th className="px-3 py-2 font-bold">Duration</th>
                    <th className="px-3 py-2 font-bold">Summary</th>
                    <th className="px-3 py-2 font-bold">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentIngestRuns.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-4 text-[#E9D5FF]/60">
                        No jobs logged in ingest_run yet.
                      </td>
                    </tr>
                  )}
                  {data.recentIngestRuns.map((run) => {
                    const durationMs = ingestRunDurationMs(run.startedAt, run.finishedAt);
                    return (
                      <tr key={run.id} className="border-t border-[#C026D3]/20 align-top">
                        <td className="px-3 py-2 font-semibold text-[#FF4D8D]">{run.job}</td>
                        <td
                          className={
                            run.status === "ok"
                              ? "px-3 py-2 text-emerald-300"
                              : "px-3 py-2 font-bold text-red-300"
                          }
                        >
                          {run.status}
                        </td>
                        <td className="px-3 py-2 tabular-nums whitespace-nowrap">
                          {new Date(run.startedAt).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 tabular-nums whitespace-nowrap">
                          {run.finishedAt ? new Date(run.finishedAt).toLocaleString() : "—"}
                        </td>
                        <td className="px-3 py-2 tabular-nums">
                          {durationMs != null ? formatDuration(durationMs) : "—"}
                        </td>
                        <td className="px-3 py-2 text-[#E9D5FF]/85">
                          {formatIngestRunSummary(run.summary)}
                        </td>
                        <td className="px-3 py-2 break-all text-red-300">
                          {run.errorMessage ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-black">Listing reports (last 50)</h2>
            <div className="mt-3 overflow-x-auto rounded-xl border border-[#C026D3]/30">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="bg-[#241033] text-[#E9D5FF]/70">
                  <tr>
                    <th className="px-3 py-2 font-bold">When</th>
                    <th className="px-3 py-2 font-bold">Listing</th>
                    <th className="px-3 py-2 font-bold">Reason</th>
                    <th className="px-3 py-2 font-bold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentListingReports.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-[#E9D5FF]/60">No reports yet.</td>
                    </tr>
                  )}
                  {data.recentListingReports.map((r) => (
                    <tr key={r.id} className="border-t border-[#C026D3]/20 align-top">
                      <td className="px-3 py-2 tabular-nums whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <Link href={`/game/${r.listingSlug}`} className="font-semibold text-[#F9A8D4] hover:underline">
                          {r.listingTitle}
                        </Link>
                      </td>
                      <td className="px-3 py-2 font-mono text-[10px]">{r.reason}</td>
                      <td className="max-w-[280px] px-3 py-2">{r.details?.trim() || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-black">Moderation audit</h2>
            <ul className="mt-3 space-y-2">
              {data.recentAudit.length === 0 && (
                <li className="text-xs text-[#E9D5FF]/60">No audit entries yet.</li>
              )}
              {data.recentAudit.map((a) => (
                <li
                  key={a.id}
                  className="rounded-lg border border-[#C026D3]/20 px-3 py-2 text-xs text-[#E9D5FF]"
                >
                  <span className="font-bold text-[#FFF1F7]">{a.action}</span>
                  <span className="text-[#E9D5FF]/60"> · {a.actor}</span>
                  <span className="text-[#E9D5FF]/50"> · {new Date(a.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </AdminShell>
  );
}
