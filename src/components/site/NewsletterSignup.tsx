"use client";

import Link from "next/link";
import { useState } from "react";

type FormState = "idle" | "loading" | "success" | "error";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    setMessage("");

    const form = e.currentTarget;
    const website = (form.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState("error");
        setMessage(
          data.error === "rate_limited"
            ? "Too many attempts — try again in a few minutes."
            : "Something went wrong. Please try again.",
        );
        return;
      }
      setState("success");
      setMessage(
        typeof data.message === "string"
          ? data.message
          : "Check your inbox to confirm your subscription.",
      );
      setEmail("");
    } catch {
      setState("error");
      setMessage("Network error — please try again.");
    }
  }

  return (
    <section
      className="mb-6 rounded-2xl border border-[#C026D3]/30 bg-gradient-to-br from-[#14061C] via-[#2E1065]/80 to-[#831843]/60 px-4 py-6 shadow-[0_0_32px_rgba(192,38,211,0.15)] sm:px-6"
      aria-labelledby="newsletter-signup-heading"
    >
      <div className="mx-auto max-w-xl text-center">
        <h2
          id="newsletter-signup-heading"
          className="text-lg font-extrabold tracking-tight text-[#FDF4FF] sm:text-xl"
        >
          Sign up for our favorite games list
        </h2>
        <p className="mt-2 text-sm font-medium text-[#E9D5FF]/90">
          Weekly top picks from the catalog — free for members. 18+ only. We&apos;ll email a
          confirmation link before the first send.
        </p>
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-center">
          <label className="sr-only" htmlFor="newsletter-email">Email</label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            placeholder="you@example.com"
            className="min-h-[44px] w-full flex-1 rounded-xl border border-[#C026D3]/40 bg-[#14061C]/90 px-4 py-2.5 text-sm text-[#FDF4FF] placeholder:text-[#E9D5FF]/40 focus:border-[#FF4D8D] focus:outline-none focus:ring-2 focus:ring-[#FF4D8D]/40 sm:max-w-xs"
            disabled={state === "loading"}
          />
          <button
            type="submit"
            disabled={state === "loading"}
            className="min-h-[44px] shrink-0 rounded-xl bg-gradient-to-r from-[#C026D3] to-[#FF4D8D] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#C026D3]/25 transition hover:brightness-110 disabled:opacity-60"
          >
            {state === "loading" ? "Sending…" : "Subscribe"}
          </button>
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />
        </form>
        {message ? (
          <p
            className={`mt-3 text-sm font-semibold ${
              state === "error" ? "text-[#FCA5A5]" : "text-[#A7F3D0]"
            }`}
            role="status"
          >
            {message}
          </p>
        ) : null}
        <p className="mt-3 text-[10px] leading-relaxed text-[#E9D5FF]/50">
          By subscribing you agree we may email you weekly picks. See our{" "}
          <Link href="/privacy" className="text-[#FF4D8D] hover:underline">
            Privacy Policy
          </Link>
          . Unsubscribe anytime from any email.
        </p>
      </div>
    </section>
  );
}
