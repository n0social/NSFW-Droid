"use client";

import { useState } from "react";
import type { ListingReportReason } from "@/db/schema";
import {
  LISTING_REPORT_REASONS,
  listingReportMailtoUrl,
} from "@/lib/listing-report";

type Props = {
  listingId: string;
  listingTitle: string;
  listingSlug: string;
};

export function ListingReportPanel({ listingId, listingTitle, listingSlug }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ListingReportReason>("broken_link");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/listings/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          reason,
          details: details.trim() || undefined,
        }),
      });
      if (res.ok) {
        setStatus("sent");
        setDetails("");
        return;
      }
      setStatus("error");
      if (res.status === 429) {
        setError("Too many reports from this connection. Try again later or email support.");
      } else {
        setError("Could not save report. Use email instead.");
      }
    } catch {
      setStatus("error");
      setError("Network error. Use email instead.");
    }
  }

  const mailto = listingReportMailtoUrl(
    listingTitle,
    listingSlug,
    reason,
    details.trim() || "(no details provided)",
  );

  return (
    <div className="border-t border-[#C026D3]/20 pt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[11px] font-bold text-[#E9D5FF]/70 underline decoration-[#C026D3]/50 hover:text-[#FF4D8D]"
      >
        {open ? "Hide report form" : "Report this listing"}
      </button>

      {open && (
        <form onSubmit={submit} className="mt-3 space-y-3 rounded-xl border border-[#C026D3]/25 bg-[#14061C]/50 p-4">
          <p className="text-[11px] leading-relaxed text-[#E9D5FF]/75">
            Flag policy issues, broken store links, or spam. Reports are reviewed by staff; we do not
            guarantee removal.
          </p>

          <label className="block text-[11px] font-bold text-[#E9D5FF]">
            Reason
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ListingReportReason)}
              className="mt-1 w-full rounded-lg border border-[#C026D3]/40 bg-[#241033] px-3 py-2 text-xs font-semibold text-[#FFF1F7]"
            >
              {LISTING_REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-[11px] font-bold text-[#E9D5FF]">
            Details (optional)
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="What is wrong with this listing?"
              className="mt-1 w-full rounded-lg border border-[#C026D3]/40 bg-[#241033] px-3 py-2 text-xs font-medium text-[#FFF1F7] placeholder:text-[#E9D5FF]/40"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={status === "sending" || status === "sent"}
              className="min-h-[40px] rounded-full bg-[#C026D3]/90 px-4 py-2 text-xs font-black text-[#FFF1F7] disabled:opacity-50"
            >
              {status === "sending" ? "Sending…" : status === "sent" ? "Report received" : "Submit report"}
            </button>
            <a href={mailto} className="text-[11px] font-bold text-[#FF4D8D] underline">
              Email support instead
            </a>
          </div>

          {error && <p className="text-[11px] text-red-300">{error}</p>}
          {status === "sent" && (
            <p className="text-[11px] text-emerald-300">Thanks — we logged your report.</p>
          )}
        </form>
      )}
    </div>
  );
}
