import { siteName } from "@/lib/site";

/** Short crawlable copy for `/browse?tag=` hub pages (SSR). */
export function browseTagHubIntro(label: string, total: number): string {
  const trimmed = label.trim();
  const display = trimmed || "this tag";
  const count = Math.max(0, Math.floor(total));
  const countPhrase =
    count === 0
      ? "No catalog titles"
      : count === 1
        ? "1 catalog title"
        : `${count.toLocaleString("en-US")} catalog titles`;

  return `${countPhrase} tagged “${display}” on ${siteName}. Browse curated 18+ games and tools from itch.io and Steam.`;
}
