"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { AdminAudienceToggle } from "@/components/AdminAudienceToggle";
import type { AdminTrafficSnapshot } from "@/lib/admin-traffic";
import type { AnalyticsAudience } from "@/lib/analytics-quality";

const POLL_MS = 60_000;

function formatDayLabel(isoDay: string): string {
  const d = new Date(`${isoDay}T12:00:00Z`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function TrafficBarChart({ daily }: { daily: AdminTrafficSnapshot["daily"] }) {
  const maxClicks = useMemo(
    () => Math.max(1, ...daily.map((d) => d.outboundClicks)),
    [daily],
  );

  if (daily.every((d) => d.outboundClicks === 0 && d.listingViews === 0)) {
    return (
      <p className="mt-4 text-xs text-[#E9D5FF]/70">
        No play clicks or card impressions in this window yet. Play clicks are age-verified
        visits to <code className="text-[#F9A8D4]">/api/go/[listingId]</code>. Card impressions
        are recorded when a homepage card is painted.
      </p>
    );
  }

  const chartHeightPx = 140;

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="flex min-w-[480px] items-end gap-1 sm:gap-1.5" style={{ height: chartHeightPx + 36 }}>
        {daily.map((row) => {
          const barPx =
            row.outboundClicks > 0
              ? Math.max(4, Math.round((row.outboundClicks / maxClicks) * chartHeightPx))
              : 0;
          return (
            <div
              key={row.day}
              className="group flex min-w-0 flex-1 flex-col items-center justify-end"
              title={`${row.day}: ${row.outboundClicks} play clicks · ${row.listingViews} card impressions`}
            >
              <span className="mb-1 text-[9px] tabular-nums text-[#E9D5FF]/80">
                {row.outboundClicks > 0 ? row.outboundClicks : ""}
              </span>
              <div
                className="w-full max-w-[28px] rounded-t bg-gradient-to-t from-[#C026D3] to-[#FF4D8D]"
                style={{ height: barPx }}
              />
              <span className="mt-1 text-[9px] text-[#E9D5FF]/50">{formatDayLabel(row.day)}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] text-[#E9D5FF]/60">
        Bar height = play clicks per UTC day (last {daily.length} days). Hover a bar for card impressions.
      </p>
    </div>
  );
}

function TopList({
  rows,
}: {
  rows: AdminTrafficSnapshot["topClicks7d"];
}) {
  if (rows.length === 0) {
    return <p className="mt-3 text-xs text-[#E9D5FF]/70">No play clicks in the last 7 days.</p>;
  }
  return (
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
  );
}

export function AdminTraffic() {
  const [data, setData] = useState<AdminTrafficSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audience, setAudience] = useState<AnalyticsAudience>("visitors");

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/traffic?audience=${audience}`);
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    if (!res.ok) {
      setError("Failed to load traffic data");
      setLoading(false);
      return;
    }
    const json = (await res.json()) as AdminTrafficSnapshot;
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
    <AdminShell title="Traffic marker">
      <p className="text-xs text-[#E9D5FF]/80">
        Play clicks are age-verified visits from a public page to{" "}
        <code className="text-[#F9A8D4]">/api/go</code>. Requests with no age cookie, no referrer, or
        an admin referrer stay out of these totals
        {data ? ` (${data.totals.unverifiedGoHits} excluded all time)` : ""}. Card impressions are{" "}
        <code className="text-[#F9A8D4]">listing_view</code> rows with path <code className="text-[#F9A8D4]">/</code>{" "}
        — one per card painted, not a game-page open. Ingest does not write these rows.{" "}
        <Link href="/admin" className="text-[#FF4D8D] underline">Dashboard</Link>.
      </p>
      <AdminAudienceToggle value={audience} onChange={setAudience} />

      {loading && !data && <p className="mt-6 text-sm text-[#E9D5FF]">Loading…</p>}
      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

      {data && (
        <>
          <p className="mt-2 text-[10px] text-[#E9D5FF]/50">
            Updated {new Date(data.generatedAt).toLocaleString()}
            {data.trafficMarkerBaselineAt && (
              <>
                {" · "}
                Baseline recorded {new Date(data.trafficMarkerBaselineAt).toLocaleString()}
              </>
            )}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[#C026D3]/30 bg-[#241033] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#E9D5FF]/70">
                {audience === "all" ? "Outbound clicks (all time, raw)" : "Play clicks (all time)"}
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-[#FFF1F7]">
                {data.totals.outboundClicks}
              </p>
            </div>
            <div className="rounded-xl border border-[#C026D3]/30 bg-[#241033] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#E9D5FF]/70">
                Card impressions (all time)
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-[#FFF1F7]">
                {data.totals.listingViews}
              </p>
            </div>
            <div className="rounded-xl border border-[#C026D3]/30 bg-[#241033] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#E9D5FF]/70">
                Today (UTC)
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-[#FFF1F7]">
                {data.dailySummary.today.outboundClicks}
              </p>
              <p className="mt-1 text-[10px] text-[#E9D5FF]/60">
                {data.dailySummary.today.listingViews} card impressions
              </p>
            </div>
            <div className="rounded-xl border border-[#C026D3]/30 bg-[#241033] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#E9D5FF]/70">
                Yesterday (UTC)
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-[#FFF1F7]">
                {data.dailySummary.yesterday.outboundClicks}
              </p>
              <p className="mt-1 text-[10px] text-[#E9D5FF]/60">
                {data.dailySummary.yesterday.listingViews} card impressions
              </p>
            </div>
          </div>

          <p className="mt-2 text-[10px] text-[#E9D5FF]/50">
            Last 7 UTC days: {data.dailySummary.last7d.outboundClicks} play clicks ·{" "}
            {data.dailySummary.last7d.listingViews} card impressions
          </p>

          <section className="mt-6 rounded-xl border border-[#C026D3]/30 bg-[#241033] p-4">
            <h2 className="text-sm font-black">Daily play clicks</h2>
            <TrafficBarChart daily={data.daily} />
          </section>

          <section className="mt-6 rounded-xl border border-[#C026D3]/30 bg-[#241033] p-4">
            <h2 className="text-sm font-black">Daily traffic (UTC)</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[320px] text-left text-xs">
                <thead className="text-[#E9D5FF]/70">
                  <tr>
                    <th className="px-2 py-1.5 font-bold">Day</th>
                    <th className="px-2 py-1.5 font-bold text-right">Play clicks</th>
                    <th className="px-2 py-1.5 font-bold text-right">Card impressions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.daily].reverse().map((row) => (
                    <tr key={row.day} className="border-t border-[#C026D3]/15">
                      <td className="px-2 py-1.5 font-semibold text-[#FFF1F7]">{row.day}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{row.outboundClicks}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{row.listingViews}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-6 rounded-xl border border-[#C026D3]/30 bg-[#241033] p-4">
            <h2 className="text-sm font-black">Top listings by play clicks (7d)</h2>
            <TopList rows={data.topClicks7d} />
          </section>
        </>
      )}
    </AdminShell>
  );
}
