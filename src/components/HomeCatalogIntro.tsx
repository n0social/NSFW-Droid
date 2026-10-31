import Link from "next/link";
import { browseCatalogPath } from "@/lib/browse-catalog-path";
import { BROWSE_PLATFORM_HUBS } from "@/lib/browse-platforms";

/** Crawlable discovery copy on the home page (SSR). */
export function HomeCatalogIntro() {
  return (
    <section
      className="pointer-events-auto mb-6 max-w-3xl text-sm leading-relaxed text-[#E9D5FF]/90"
      aria-label="About this catalog"
    >
      <p>
        {`NSFW Droid is a curated 18+ game catalog — browse NSFW games for PC, Android, Mac, Linux, and browser, with outbound links to official itch.io and Steam storefronts.`}
      </p>
      <p className="mt-2 text-xs font-semibold text-[#F9A8D4]">
        Browse by platform:{" "}
        {BROWSE_PLATFORM_HUBS.map((hub, i) => (
          <span key={hub.slug}>
            {i > 0 ? " · " : null}
            <Link
              href={browseCatalogPath({ platform: hub.slug })}
              className="text-[#FF4D8D] underline-offset-2 hover:underline"
            >
              {hub.label}
            </Link>
          </span>
        ))}
      </p>
    </section>
  );
}
