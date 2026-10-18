"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  title: string;
  children: React.ReactNode;
};

const NAV: { href: string; label: string; exact?: boolean }[] = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/traffic", label: "Traffic" },
  { href: "/admin/queue", label: "Review queue" },
  { href: "/admin/listings/new", label: "Manual listing" },
];

export function AdminShell({ title, children }: Props) {
  const pathname = usePathname();

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-[#14061C] px-4 py-8 text-[#FFF1F7]">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/" className="text-xs font-bold text-[#FF4D8D]">← Store</Link>
            <h1 className="mt-2 text-xl font-black">{title}</h1>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="rounded-full border border-[#FF4D8D]/60 bg-[#241033] px-4 py-2 text-xs font-bold text-[#FFF1F7] hover:border-[#FF4D8D]"
          >
            Sign out
          </button>
        </div>

        <nav className="mt-4 flex flex-wrap gap-2">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-1.5 text-xs font-bold ${
                  active
                    ? "bg-[#C026D3] text-[#FFF1F7]"
                    : "border border-[#C026D3]/40 text-[#E9D5FF]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
