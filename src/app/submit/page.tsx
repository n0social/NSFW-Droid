"use client";

import Link from "next/link";
import { useState } from "react";

const PLATFORM_OPTIONS = ["browser", "windows", "mac", "linux", "android"];

export default function SubmitPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const form = new FormData(e.currentTarget);
    const platforms = PLATFORM_OPTIONS.filter((p) => form.get(`platform_${p}`) === "on");
    const body = {
      title: form.get("title"),
      official_url: form.get("official_url"),
      contact_email: form.get("contact_email"),
      message: form.get("message"),
      platforms: platforms.length ? platforms : ["browser"],
    };

    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setMessage(data.error ?? "Something went wrong.");
      return;
    }
    setStatus("ok");
    setMessage(data.message ?? "Queued for review.");
    e.currentTarget.reset();
  }

  return (
    <div className="min-h-screen bg-[#14061C] px-4 py-10 text-[#FFF1F7]">
      <div className="mx-auto max-w-lg">
        <Link href="/" className="text-xs font-bold text-[#FF4D8D]">
          ← Back to store
        </Link>
        <h1 className="mt-4 text-2xl font-black">Submit your game</h1>
        <p className="mt-2 text-sm text-[#E9D5FF]/90">
          18+ titles only. We review every submission before it appears on the storefront. No
          automatic publishing.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-xs font-bold text-[#E9D5FF]">Title</span>
            <input
              name="title"
              required
              maxLength={200}
              className="mt-1 w-full rounded-xl border-2 border-[#C026D3]/40 bg-[#241033] px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#E9D5FF]">Official store or project URL</span>
            <input
              name="official_url"
              type="url"
              required
              placeholder="https://"
              className="mt-1 w-full rounded-xl border-2 border-[#C026D3]/40 bg-[#241033] px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#E9D5FF]">Contact email</span>
            <input
              name="contact_email"
              type="email"
              required
              className="mt-1 w-full rounded-xl border-2 border-[#C026D3]/40 bg-[#241033] px-3 py-2 text-sm"
            />
          </label>
          <fieldset>
            <span className="text-xs font-bold text-[#E9D5FF]">Platforms</span>
            <div className="mt-2 flex flex-wrap gap-3">
              {PLATFORM_OPTIONS.map((p) => (
                <label key={p} className="flex items-center gap-2 text-xs font-semibold capitalize">
                  <input type="checkbox" name={`platform_${p}`} className="accent-[#FF4D8D]" />
                  {p}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block">
            <span className="text-xs font-bold text-[#E9D5FF]">Notes (optional)</span>
            <textarea
              name="message"
              rows={4}
              maxLength={2000}
              className="mt-1 w-full rounded-xl border-2 border-[#C026D3]/40 bg-[#241033] px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-xl bg-[#FF4D8D] py-3 text-sm font-black disabled:opacity-60"
          >
            {status === "loading" ? "Sending…" : "Send for review"}
          </button>
        </form>

        {status === "ok" && (
          <p className="mt-4 rounded-xl border border-[#C026D3]/50 bg-[#241033] p-4 text-sm text-[#F9A8D4]">
            {message}
          </p>
        )}
        {status === "error" && (
          <p className="mt-4 text-sm font-bold text-red-400">{message}</p>
        )}
      </div>
    </div>
  );
}
