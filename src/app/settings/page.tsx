import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CoverBlurPreference } from "@/components/settings/CoverBlurPreference";
import { ResetAgeGateControl } from "@/components/settings/ResetAgeGateControl";
import { SiteFooter } from "@/components/site/SiteFooter";
import { isAgeVerifiedRequest } from "@/lib/age-verified-server";
import { BLUR_COVERS_COOKIE, parseBlurCovers } from "@/lib/cookies";
import { isSignedIn } from "@/lib/user-session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!(await isSignedIn())) {
    redirect("/sign-in");
  }

  const jar = await cookies();
  const ageVerified = await isAgeVerifiedRequest();
  const blurCovers = parseBlurCovers(jar.get(BLUR_COVERS_COOKIE)?.value);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12 md:px-6">
        <Link href="/" className="text-xs font-bold text-[var(--theme-accent)]">← Store</Link>
        <h1 className="mt-4 text-2xl font-black">Settings</h1>
        <p className="mt-2 text-sm text-[var(--theme-text-muted)]">
          Site preferences stored on this device. Signed-in users also sync cover blur to their account.
        </p>

        <section className="mt-6 rounded-2xl border-2 border-[var(--theme-primary)]/25 bg-[var(--theme-surface)]/60 p-5">
          <h2 className="text-xs font-black uppercase tracking-wide text-[var(--theme-text-muted)]">
            Privacy &amp; display
          </h2>
          <div className="mt-3">
            <CoverBlurPreference ageVerified={ageVerified} blurCovers={blurCovers} />
            <ResetAgeGateControl />
          </div>
        </section>

        <p className="mt-6 text-xs text-[var(--theme-text-muted)]">
          <Link href="/account" className="font-bold text-[var(--theme-accent)] hover:underline">
            Account
          </Link>{" "}
          — profile, favorites, and holiday theme.
        </p>
      </div>
      <SiteFooter ageVerified={ageVerified} showFooterAds={false} />
    </div>
  );
}
