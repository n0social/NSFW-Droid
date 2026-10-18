/**
 * Find SmutBase-hosted project IDs for curated characters (no redirect to sfmlab).
 */
import { chromium } from "playwright";

const QUERIES = [
  ["tifa-lockhart", "Tifa Lockhart FF7R SFM"],
  ["widowmaker", "Widowmaker nude SFM"],
  ["d-va", "D.Va NSFW SFM"],
  ["2b", "2B NieR SFM2"],
  ["tracer", "Tracer SFM2 Overwatch"],
  ["mercy", "Lewd Mercy Overwatch SFM"],
  ["lady-dimitrescu", "Alcina Dimitrescu RE8 SFM"],
  ["jill-valentine", "Jill Valentine RE3 remake LordAardvark"],
  ["lara-croft", "Lara Croft Tomb Raider 2013 SFM"],
  ["juno", "Juno Overwatch 2 SFM"],
];

async function searchSite(page, base, query) {
  const url = `${base}/?search=${encodeURIComponent(query)}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(12000);
  const projects = await page.evaluate(() => {
    const out = [];
    for (const a of document.querySelectorAll('a[href*="/project/"]')) {
      const m = a.href.match(/project\/([0-9a-f-]{36})/);
      if (!m) continue;
      const title = (a.textContent || "").replace(/\s+/g, " ").trim();
      if (title.length < 3) continue;
      out.push({ id: m[1], href: a.href, title });
    }
    const seen = new Set();
    return out.filter((x) => {
      if (seen.has(x.id)) return false;
      seen.add(x.id);
      return true;
    });
  });
  return projects.slice(0, 8);
}

async function staysOnSmutbase(id) {
  const res = await fetch(`https://smutba.se/project/${id}/`, {
    headers: { "User-Agent": "NSFW-Droid-Catalog/0.1" },
    redirect: "follow",
  });
  return { final: res.url, onSmut: res.url.includes("smutba.se") };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  for (const [id, query] of QUERIES) {
    console.log(`\n=== ${id} : ${query} ===`);
    for (const base of ["https://smutba.se", "https://sfmlab.com"]) {
      try {
        const hits = await searchSite(page, base, query);
        console.log(`  ${base} -> ${hits.length} hits`);
        for (const h of hits.slice(0, 5)) {
          const stay = await staysOnSmutbase(h.id);
          console.log(`    ${stay.onSmut ? "SMUT" : "sfm "} ${h.id} ${h.title.slice(0, 70)}`);
        }
      } catch (e) {
        console.log(`  ${base} FAIL`, e.message);
      }
    }
  }
  await browser.close();
}

main();
