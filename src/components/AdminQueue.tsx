"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Candidate = {
  id: string;
  source: string;
  title: string;
  outboundUrl: string;
  firstSeenAt: string;
  rawPayload: unknown;
};

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
    setCandidates(data.candidates ?? []);
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

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <div className="min-h-screen bg-[#14061C] px-4 py-8 text-[#FFF1F7]">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/" className="text-xs font-bold text-[#FF4D8D]">← Store</Link>
            <h1 className="mt-2 text-xl font-black">Review queue</h1>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/listings/new"
              className="rounded-full border border-[#C026D3] px-4 py-2 text-xs font-bold"
            >
              Manual listing
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-[#C026D3]/50 px-4 py-2 text-xs font-bold text-[#E9D5FF]"
            >
              Log out
            </button>
          </div>
        </div>

        <p className="mt-2 text-xs text-[#E9D5FF]/80">
          itch.io and Steam ingest stay pending until you approve. Developer submissions land here
          too.
        </p>

        {loading && <p className="mt-8 text-sm text-[#E9D5FF]">Loading…</p>}
        {error && <p className="mt-8 text-sm text-red-400">{error}</p>}

        {!loading && candidates.length === 0 && (
          <p className="mt-8 rounded-xl border border-dashed border-[#C026D3]/40 p-8 text-center text-sm text-[#E9D5FF]">
            No pending candidates.
          </p>
        )}

        <ul className="mt-6 space-y-4">
          {candidates.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-[#C026D3]/30 bg-[#241033] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#FF4D8D]">{c.source}</span>
                  <h2 className="font-bold">{c.title}</h2>
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
          ))}
        </ul>
      </div>
    </div>
  );
}
