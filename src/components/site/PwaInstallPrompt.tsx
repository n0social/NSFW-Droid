"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "nsfwdroid_pwa_install_dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

type Props = {
  ageVerified: boolean;
};

export function PwaInstallPrompt({ ageVerified }: Props) {
  const [visible, setVisible] = useState(false);
  const [iosHintOpen, setIosHintOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (!ageVerified || isStandalone()) return;

    try {
      if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }

    const onIos = isIos();
    setIos(onIos);
    if (onIos) {
      setVisible(true);
      return;
    }

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, [ageVerified]);

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (choice.outcome === "accepted") {
      setVisible(false);
    }
  }

  if (!visible) return null;

  return (
    <div
      className="mx-auto max-w-7xl px-4 pb-4 md:px-6 lg:px-8"
      role="region"
      aria-label="Install app"
    >
      <div className="flex flex-col gap-2 rounded-xl border border-[#C026D3]/25 bg-[#14061C]/80 px-4 py-3 text-[11px] text-[#E9D5FF]/90 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-bold text-[#FFF1F7]">Add to Home Screen</span>
          {ios
            ? " for quick access like an app."
            : " — install NSFW Droid on this device."}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {ios ? (
            <button
              type="button"
              onClick={() => setIosHintOpen((open) => !open)}
              className="rounded-full border border-[#C026D3]/50 px-3 py-1.5 font-bold text-[#FFF1F7] hover:bg-[#C026D3]/20"
              aria-expanded={iosHintOpen}
            >
              {iosHintOpen ? "Hide steps" : "How on iPhone"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void install()}
              disabled={!deferredPrompt}
              className="rounded-full bg-[#C026D3] px-3 py-1.5 font-bold text-[#FFF1F7] hover:bg-[#FF4D8D] disabled:opacity-50"
            >
              Install
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full px-2 py-1.5 text-[#E9D5FF]/60 hover:text-[#E9D5FF]"
          >
            Not now
          </button>
        </div>
      </div>
      {ios && iosHintOpen ? (
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[11px] text-[#E9D5FF]/75">
          <li>Open this site in Safari (not an in-app browser).</li>
          <li>Tap the Share button at the bottom of the screen.</li>
          <li>Scroll and tap <strong className="text-[#F9A8D4]">Add to Home Screen</strong>.</li>
          <li>Confirm the name, then tap Add.</li>
        </ol>
      ) : null}
    </div>
  );
}
