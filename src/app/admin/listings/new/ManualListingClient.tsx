"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminShell } from "@/components/AdminShell";

export function ManualListingClient() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/listings/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        official_url: form.get("official_url"),
        platforms: String(form.get("platforms") ?? "browser")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    });
    if (!res.ok) {
      setStatus("error");
      return;
    }
    router.push("/admin");
  }

  return (
    <AdminShell title="Manual listing">
      <p className="text-sm text-[#E9D5FF]/90">
        DLsite, JAST, or other partner pages until you have automated feeds. Publishes
        immediately (no candidate row).
      </p>
      <form onSubmit={onSubmit} className="mt-8 max-w-lg space-y-4">
        <label className="block">
          <span className="text-xs font-bold text-[#E9D5FF]">Title</span>
          <input
            name="title"
            required
            className="mt-1 w-full rounded-xl border-2 border-[#C026D3]/40 bg-[#241033] px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-[#E9D5FF]">URL</span>
          <input
            name="official_url"
            type="url"
            required
            className="mt-1 w-full rounded-xl border-2 border-[#C026D3]/40 bg-[#241033] px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-[#E9D5FF]">Platforms (comma-separated)</span>
          <input
            name="platforms"
            defaultValue="browser, windows"
            className="mt-1 w-full rounded-xl border-2 border-[#C026D3]/40 bg-[#241033] px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-xl bg-[#FF4D8D] py-3 text-sm font-black disabled:opacity-60"
        >
          Publish listing
        </button>
      </form>
      {status === "error" && (
        <p className="mt-4 text-sm text-red-400">Unauthorized or invalid — sign in again.</p>
      )}
    </AdminShell>
  );
}
