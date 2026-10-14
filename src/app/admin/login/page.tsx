"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(false);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: form.get("password") }),
    });
    if (!res.ok) {
      setError(true);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#14061C] px-4">
      <div className="w-full max-w-sm rounded-2xl border-2 border-[#C026D3]/40 bg-[#241033] p-8">
        <Link href="/" className="text-xs font-bold text-[#FF4D8D]">← Store</Link>
        <h1 className="mt-3 text-lg font-black text-[#FFF1F7]">Admin</h1>
        <p className="mt-1 text-xs text-[#E9D5FF]/80">Review queue and curated links.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="ADMIN_PASSWORD"
            className="w-full rounded-xl border-2 border-[#C026D3]/40 bg-[#14061C] px-3 py-2 text-sm text-[#FFF1F7]"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-[#C026D3] py-2.5 text-sm font-black text-[#FFF1F7]"
          >
            Sign in
          </button>
        </form>
        {error && <p className="mt-3 text-xs font-bold text-red-400">Invalid password.</p>}
      </div>
    </div>
  );
}
