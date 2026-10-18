import { chromium } from "playwright";

const LIST = "https://sfmlab.com/list/dfc94c95-fad1-40f1-8f63-8c20f636a33b/";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(LIST, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(10000);
  const items = await page.evaluate(() => {
    const out = [];
    for (const a of document.querySelectorAll('a[href*="/project/"]')) {
      const href = a.href;
      const m = href.match(/project\/([0-9a-f-]{36})/);
      if (!m) continue;
      const card = a.closest(".item, .project, article, li, .card") ?? a.parentElement;
      const text = (card?.textContent ?? a.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
      out.push({ id: m[1], href, text });
    }
    const seen = new Set();
    return out.filter((x) => {
      if (seen.has(x.id)) return false;
      seen.add(x.id);
      return true;
    });
  });
  console.log(JSON.stringify(items, null, 2));
  await browser.close();
}

main();
