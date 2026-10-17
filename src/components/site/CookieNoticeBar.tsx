"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const DISMISS_KEY = "nsfwdroid_cookie_notice_dismissed";

export function CookieNoticeBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
      setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-[#C026D3]/40 bg-[#14061Cee] px-4 py-3 text-center backdrop-blur-sm sm:text-left"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-4">
        <p className="text-[11px] leading-relaxed text-[#E9D5FF]/90">
          We use essential cookies for age verification (<code className="text-[#F9A8D4]">age_verified</code>
          ), a per-browser analytics id (<code className="text-[#F9A8D4]">analytics_sid</code>
          ), optional cover blur, and signed-in sessions (
          <code className="text-[#F9A8D4]">USER_SESSION</code>). Analytics and ad partners may set
          additional cookies when enabled — see our{" "}
          <Link href="/privacy" className="font-bold text-[#FF4D8D] underline">
            Privacy notice
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-full border border-[#C026D3]/50 px-4 py-2 text-[11px] font-bold text-[#FFF1F7] hover:bg-[#C026D3]/30"
        >
          OK
        </button>
      </div>
    </div>
  );
}
