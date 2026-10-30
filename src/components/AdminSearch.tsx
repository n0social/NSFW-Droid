"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminAudienceToggle } from "@/components/AdminAudienceToggle";
import { AdminShell } from "@/components/AdminShell";
import type { AdminSearchSnapshot } from "@/lib/admin-search-analytics";
import type { AnalyticsAudience } from "@/lib/analytics-quality";

const POLL_MS = 120_000;

function pct(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

function formatDay(isoDay: string): string {
  return new Date(`${isoDay}T12:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function GscDailyChart({ daily }: { daily: NonNullable<AdminSearchSnapshot["gsc"]["cache"]>["daily"] }) {
  const max = useMemo(() => Math.max(1, ...daily.map((d) => d.clicks)), [daily]);
  const height = 120;

  if (daily.length === 0) {
    return <p className="mt-3 text-xs text-[#E9D5FF]/70">No daily rows in cache yet.</p>;
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="flex min-w-[480px] items-end gap-1" style={{ height: height + 28 }}>
        {daily.map((row) => {
          const bar = row.clicks > 0 ? Math.max(4, Math.round((row.clicks / max) * height)) : 0;
          return (
            <div
              key={row.date}
              className="flex min-w-0 flex-1 flex-col items-center justify-end"
              title={`${row.date}: ${row.clicks} clicks · ${row.impressions} impressions · avg pos ${row.position.toFixed(1)}`}
            >
              <div
                className="w-full max-w-[24px] rounded-t bg-gradient-to-t from-[#2563EB] to-[#60A5FA]"
                style={{ height: bar }}
              />
              <span className="mt-1 text-[8px] text-[#E9D5FF]/50">{formatDay(row.date)}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-[#E9D5FF]/60">Bar height = Google Search clicks per day (GSC).</p>
    </div>
  );
}

export function AdminSearch() {
  const [data, setData] = useState<AdminSearchSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audience, setAudience] = useState<AnalyticsAudience>("visitors");
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/search?audience=${audience}`);
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    if (!res.ok) {
      setError("Failed to load search analytics");
      setLoading(false);
      return;
    }
    const json = (await res.json()) as AdminSearchSnapshot;
    setData(json);
    setError(null);
    setLoading(false);
  }, [audience]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  async function syncNow() {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/search", { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Sync failed");
      } else {
        await load();
      }
    } finally {
      setSyncing(false);
    }
  }

  const cache = data?.gsc.cache;
  const configured = data?.gsc.configured;

  return (
    <AdminShell title="Search (GSC)">
      <p className="text-xs text-[#E9D5FF]/80">
        Google Search Console Performance metrics (queries, clicks, impressions, CTR, average position)
        require the Search Console API and a service account added to your property. First-party analytics
        cannot reconstruct search queries or SERP impressions — see{" "}
        <Link href="/admin/traffic" className="text-[#FF4D8D] underline">
          Traffic
        </Link>{" "}
        for on-site play clicks.
      </p>

      <AdminAudienceToggle value={audience} onChange={setAudience} />

      {loading && !data && <p className="mt-6 text-sm text-[#E9D5FF]">Loading…</p>}
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {data && (
        <>
          <p className="mt-2 text-[10px] text-[#E9D5FF]/50">
            Updated {new Date(data.generatedAt).toLocaleString()} · window {data.gsc.windowDays} days
          </p>

          {!configured && (
            <section className="mt-6 rounded-xl border border-amber-500/40 bg-[#241033] p-4">
              <h2 className="text-sm font-black text-amber-200">GSC API not configured</h2>
              <p className="mt-2 text-xs text-[#E9D5FF]/85">
                Set these on the droplet in <code className="text-[#F9A8D4]">/etc/nsfwdroid.env</code>{" "}
                (never commit):
              </p>
              <ul className="mt-2 list-inside list-disc text-xs text-[#E9D5FF]/85">
                <li>
                  <code className="text-[#F9A8D4]">GSC_SERVICE_ACCOUNT_JSON</code> — minified service account
                  key JSON (Search Console API enabled)
                </li>
                <li>
                  <code className="text-[#F9A8D4]">GSC_PROPERTY_URL</code> — optional; default matches{" "}
                  <code className="text-[#F9A8D4]">NEXT_PUBLIC_SITE_URL</code> with trailing slash (e.g.{" "}
                  <code className="text-[#F9A8D4]">https://www.nsfwdroid.com/</code>)
                </li>
              </ul>
              <p className="mt-3 text-xs text-[#E9D5FF]/70">
                In Search Console → Settings → Users and permissions, add the service account email as{" "}
                <strong>Full</strong> or <strong>Restricted</strong> with Performance read access. Full setup:
                repo <code className="text-[#F9A8D4]">docs/search-console-api.md</code>.
              </p>
              {data.gsc.missingEnv.length > 0 && (
                <p className="mt-2 text-xs text-amber-200/90">
                  Missing: {data.gsc.missingEnv.join(", ")}
                </p>
              )}
            </section>
          )}

          {configured && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={syncing}
                onClick={() => void syncNow()}
                className="rounded-full border border-[#60A5FA]/60 bg-[#241033] px-4 py-2 text-xs font-bold text-[#FFF1F7] hover:border-[#60A5FA] disabled:opacity-50"
              >
                {syncing ? "Syncing…" : "Sync GSC now"}
              </button>
              {cache?.syncedAt && (
                <span className="text-[10px] text-[#E9D5FF]/60">
                  Cache synced {new Date(cache.syncedAt).toLocaleString()}
                  {cache.propertyUrl ? ` · ${cache.propertyUrl}` : ""}
                </span>
              )}
            </div>
          )}

          {cache && (
            <>
              {cache.syncError && (
                <p className="mt-4 text-xs text-red-400">Last sync error: {cache.syncError}</p>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-[#2563EB]/40 bg-[#241033] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#E9D5FF]/70">
                    GSC clicks
                  </p>
                  <p className="mt-1 text-2xl font-black tabular-nums">{cache.totals.clicks}</p>
                  <p className="mt-1 text-[10px] text-[#E9D5FF]/60">
                    {cache.startDate} → {cache.endDate}
                  </p>
                </div>
                <div className="rounded-xl border border-[#2563EB]/40 bg-[#241033] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#E9D5FF]/70">
                    Impressions
                  </p>
                  <p className="mt-1 text-2xl font-black tabular-nums">{cache.totals.impressions}</p>
                </div>
                <div className="rounded-xl border border-[#2563EB]/40 bg-[#241033] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#E9D5FF]/70">CTR</p>
                  <p className="mt-1 text-2xl font-black tabular-nums">{pct(cache.totals.ctr)}</p>
                </div>
                <div className="rounded-xl border border-[#2563EB]/40 bg-[#241033] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#E9D5FF]/70">
                    Avg position
                  </p>
                  <p className="mt-1 text-2xl font-black tabular-nums">
                    {cache.totals.position.toFixed(1)}
                  </p>
                </div>
              </div>

              <section className="mt-6 rounded-xl border border-[#2563EB]/30 bg-[#241033] p-4">
                <h2 className="text-sm font-black">Daily search clicks (GSC)</h2>
                <GscDailyChart daily={cache.daily} />
              </section>

              <section className="mt-6 rounded-xl border border-[#2563EB]/30 bg-[#241033] p-4">
                <h2 className="text-sm font-black">Top queries (GSC)</h2>
                {cache.topQueries.length === 0 ? (
                  <p className="mt-3 text-xs text-[#E9D5FF]/70">No query rows in cache.</p>
                ) : (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left text-xs">
                      <thead className="text-[#E9D5FF]/70">
                        <tr>
                          <th className="px-2 py-1.5 font-bold">Query</th>
                          <th className="px-2 py-1.5 font-bold text-right">Clicks</th>
                          <th className="px-2 py-1.5 font-bold text-right">Impr.</th>
                          <th className="px-2 py-1.5 font-bold text-right">CTR</th>
                          <th className="px-2 py-1.5 font-bold text-right">Pos.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cache.topQueries.slice(0, 25).map((row) => (
                          <tr key={row.query} className="border-t border-[#2563EB]/15">
                            <td className="max-w-[240px] truncate px-2 py-1.5 font-semibold text-[#FFF1F7]">
                              {row.query}
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{row.clicks}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{row.impressions}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{pct(row.ctr)}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">
                              {row.position.toFixed(1)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          <section className="mt-6 rounded-xl border border-[#C026D3]/30 bg-[#241033] p-4">
            <h2 className="text-sm font-black">First-party (not GSC)</h2>
            <p className="mt-2 text-xs text-[#E9D5FF]/80">{data.firstParty.note}</p>
            <p className="mt-3 text-xs text-[#E9D5FF]/85">
              Visitor play clicks ({data.firstParty.windowDays}d):{" "}
              <span className="font-bold tabular-nums text-[#FFF1F7]">
                {data.firstParty.visitorPlayClicks}
              </span>
            </p>
            {data.firstParty.googleReferrerEvents.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs">
                {data.firstParty.googleReferrerEvents.map((row) => (
                  <li key={row.eventType} className="tabular-nums text-[#E9D5FF]">
                    {row.eventType}: {row.count} events with Google Referer
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-[#E9D5FF]/60">
                No analytics rows with a google.com Referer in this window (expected for /api/go play
                clicks).
              </p>
            )}
          </section>
        </>
      )}
    </AdminShell>
  );
}
