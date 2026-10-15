"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";

type Candidate = {
  id: string;
  source: string;
  title: string;
  outboundUrl: string;
  firstSeenAt: string;
  rawPayload: unknown;
};

function tosHoldFromPayload(rawPayload: unknown): { summary?: string; matchedRules?: string[] } | null {
  if (!rawPayload || typeof rawPayload !== "object") return null;
  const tos = (rawPayload as { tosScreen?: { hold?: boolean; summary?: string; matchedRules?: string[] } })
    .tosScreen;
  if (!tos?.hold) return null;
  return { summary: tos.summary, matchedRules: tos.matchedRules };
}

export function AdminQueue() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/candidates");
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    if (!res.ok) {
      setError("Failed to load queue");
      setLoading(false);
      return;
    }
    const data = await res.json();
    const rows: Candidate[] = data.candidates ?? [];
    rows.sort((a, b) => {
      const aHold = tosHoldFromPayload(a.rawPayload) ? 1 : 0;
      const bHold = tosHoldFromPayload(b.rawPayload) ? 1 : 0;
      return bHold - aHold;
    });
    setCandidates(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(id: string) {
    const res = await fetch(`/api/admin/candidates/${id}/approve`, { method: "POST" });
    if (res.ok) await load();
  }

  async function reject(id: string) {
    const reason = window.prompt("Reject reason (optional):") ?? "rejected";
    const res = await fetch(`/api/admin/candidates/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (res.ok) await load();
  }

  return (
    <AdminShell title="Review queue">
        <p className="text-xs text-[#E9D5FF]/80">
          Pending items need a decision. With auto-publish on, only TOS-flagged or strict-mode
          candidates appear here; approve to override a hold or reject to block listing.
        </p>

        {loading && <p className="mt-8 text-sm text-[#E9D5FF]">Loading…</p>}
        {error && <p className="mt-8 text-sm text-red-400">{error}</p>}

        {!loading && candidates.length === 0 && (
          <p className="mt-8 rounded-xl border border-dashed border-[#C026D3]/40 p-8 text-center text-sm text-[#E9D5FF]">
            No pending candidates.
          </p>
        )}

        <ul className="mt-6 space-y-4">
          {candidates.map((c) => {
            const tosHold = tosHoldFromPayload(c.rawPayload);
            return (
            <li
              key={c.id}
              className={`rounded-xl border bg-[#241033] p-4 ${
                tosHold ? "border-amber-400/60" : "border-[#C026D3]/30"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-[#FF4D8D]">{c.source}</span>
                    {tosHold && (
                      <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-200">
                        TOS hold
                      </span>
                    )}
                  </div>
                  <h2 className="font-bold">{c.title}</h2>
                  {tosHold && (
                    <p className="mt-2 text-xs text-amber-100/90">
                      {tosHold.summary ??
                        (tosHold.matchedRules?.length
                          ? `Rules: ${tosHold.matchedRules.join(", ")}`
                          : "Flagged for manual TOS review")}
                    </p>
                  )}
                  <a
                    href={c.outboundUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-xs text-[#F9A8D4] underline break-all"
                  >
                    {c.outboundUrl}
                  </a>
                  <p className="mt-1 text-[10px] text-[#E9D5FF]/60">
                    Seen {new Date(c.firstSeenAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => approve(c.id)}
                    className="rounded-lg bg-[#22c55e] px-3 py-1.5 text-xs font-black text-[#14061C]"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => reject(c.id)}
                    className="rounded-lg border border-red-400 px-3 py-1.5 text-xs font-bold text-red-300"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </li>
          );
          })}
        </ul>
    </AdminShell>
  );
}
