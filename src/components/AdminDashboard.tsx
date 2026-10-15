"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import type { AdminDashboardSnapshot } from "@/lib/admin-dashboard";

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
                href={`/api/go/${row.listingId}`}
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

function formatRunSummary(summary: unknown): string {
  if (!summary || typeof summary !== "object") return "—";
  const s = summary as Record<string, unknown>;
  if (s.job === "recycle_stale" || "staled" in s) {
    const staled = s.staled ?? s.wouldStale;
    return `recycled ${staled ?? 0} listing(s)`;
  }
  const itch = s.itch as { newCandidates?: number } | undefined;
  const steam = s.steam as { newCandidates?: number } | undefined;
  const catalog = s.catalog as { listings?: number } | undefined;
  const parts: string[] = [];
  if (itch?.newCandidates != null) parts.push(`itch +${itch.newCandidates}`);
  if (steam?.newCandidates != null) parts.push(`steam +${steam.newCandidates}`);
  if (catalog?.listings != null) parts.push(`${catalog.listings} listings`);
  return parts.length ? parts.join(" · ") : JSON.stringify(summary).slice(0, 120);
}

export function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/dashboard");
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
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <AdminShell title="Admin dashboard">
      <p className="text-xs text-[#E9D5FF]/80">
        Live metrics refresh every 30s on load. Rails blend outbound clicks/views with user favorites
        (weights in <code className="text-[#F9A8D4]">listings-ranking.ts</code>).
      </p>

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
            <StatCard label="Listings" value={data.catalog.listings} hint={`${data.catalog.staleListings} stale`} />
            <StatCard label="Accounts" value={data.users.total} hint={`+${data.users.signups24h} / 24h`} />
            <StatCard
              label="Outbound clicks"
              value={data.analytics.outboundClicks24h}
              hint={`${data.analytics.outboundClicks7d} / 7d · affiliate ${data.analytics.affiliateClicks24h} / official ${data.analytics.officialClicks24h} (24h)`}
            />
            <StatCard
              label="Listing views"
              value={data.analytics.listingViews24h}
              hint={`${data.analytics.pageViews24h} page views / 24h`}
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <StatCard label="Sign-ups (7d)" value={data.users.signups7d} />
            <StatCard label="Total favorites" value={data.users.favoritesTotal} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <TopList title="Top clicks (7d)" rows={data.top.clicks7d} emptyLabel="No clicks yet." />
            <TopList title="Top views (48h)" rows={data.top.views48h} emptyLabel="No views yet." />
            <TopList title="Most favorited" rows={data.top.favorites} emptyLabel="No favorites yet." />
          </div>

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
            <h2 className="text-sm font-black">Recent ingest / maintenance</h2>
            <ul className="mt-3 space-y-2">
              {data.recentIngestRuns.length === 0 && (
                <li className="text-xs text-[#E9D5FF]/60">No jobs logged in ingest_run yet.</li>
              )}
              {data.recentIngestRuns.map((run) => (
                <li
                  key={run.id}
                  className="rounded-lg border border-[#C026D3]/25 bg-[#241033] px-3 py-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-[#FF4D8D]">{run.job}</span>
                    <span
                      className={
                        run.status === "ok" ? "text-emerald-300" : "font-bold text-red-300"
                      }
                    >
                      {run.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[#E9D5FF]/80">
                    {new Date(run.startedAt).toLocaleString()} — {formatRunSummary(run.summary)}
                  </p>
                  {run.errorMessage && (
                    <p className="mt-1 text-red-300">{run.errorMessage}</p>
                  )}
                </li>
              ))}
            </ul>
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
