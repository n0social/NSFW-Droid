/**
 * One-off demo weekly newsletter: render HTML artifact + send to test inboxes.
 * Does not require NEWSLETTER_ENABLED=1.
 */
import "dotenv/config";
import { spawn } from "node:child_process";
import { access, mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closeCatalogDb, getDb } from "../src/db";
import { listings } from "../src/db/schema";
import {
  WEEKLY_NEWSLETTER_SUBJECT,
  newsletterFromAddress,
} from "../src/lib/newsletter/config";
import { assessNewsletterPickEligibility, loadNewsletterPickEligibilityContext } from "../src/lib/newsletter/pick-eligibility";
import { fetchWeeklyNewsletterPicks, type WeeklyPick } from "../src/lib/newsletter/picks";
import { sendNewsletterEmail } from "../src/lib/newsletter/send";
import {
  renderWeeklyNewsletterHtml,
  renderWeeklyNewsletterText,
} from "../src/lib/newsletter/weekly-email";
import { and, desc, eq, isNotNull, ne } from "drizzle-orm";

const ARTIFACT_DIR = "/opt/cursor/artifacts";
const DEMO_RECIPIENTS = ["donavansky@gmail.com"];
const DEMO_SUBJECT = `[DEMO] ${WEEKLY_NEWSLETTER_SUBJECT}`;

async function resolveChromeBin(): Promise<string | null> {
  const candidates = [
    process.env.CHROME_BIN?.trim(),
    "/usr/local/bin/google-chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean) as string[];
  for (const bin of candidates) {
    try {
      await access(bin, constants.X_OK);
      return bin;
    } catch {
      /* try next */
    }
  }
  return null;
}

async function renderNewsletterDemoPng(htmlPath: string, pngPath: string): Promise<boolean> {
  const chrome = await resolveChromeBin();
  if (!chrome) {
    console.warn("[demo] chrome not found — skipping PNG artifact");
    return false;
  }
  const userDataDir = await mkdtemp(join(tmpdir(), "newsletter-demo-chrome-"));
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      chrome,
      [
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--hide-scrollbars",
        "--no-first-run",
        "--remote-debugging-port=0",
        `--user-data-dir=${userDataDir}`,
        "--window-size=390,2400",
        `--screenshot=${pngPath}`,
        `file://${htmlPath}`,
      ],
      { stdio: "inherit" },
    );
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      resolve();
    }, 20_000);
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0 || code === null) resolve();
      else reject(new Error(`chrome screenshot exited ${code}`));
    });
  });
  return true;
}

async function buildFallbackDemoPicks(db: Awaited<ReturnType<typeof getDb>>): Promise<WeeklyPick[]> {
  const rows = await db
    .select({
      listingId: listings.id,
      slug: listings.slug,
      title: listings.title,
      coverImageUrl: listings.coverImageUrl,
    })
    .from(listings)
    .where(
      and(
        isNotNull(listings.publishedAt),
        eq(listings.catalogStale, false),
        eq(listings.linkStatus, "ok"),
        isNotNull(listings.coverImageUrl),
        ne(listings.coverImageUrl, ""),
      ),
    )
    .orderBy(desc(listings.publishedAt))
    .limit(40);

  const ids = rows.map((r) => r.listingId);
  const ctx = await loadNewsletterPickEligibilityContext(db, ids);
  const eligible: WeeklyPick[] = [];

  for (const row of rows) {
    const meta = ctx.get(row.listingId);
    const assessment = assessNewsletterPickEligibility({
      listingId: row.listingId,
      title: row.title,
      slug: row.slug,
      source: meta?.source ?? null,
      externalId: meta?.externalId ?? null,
      tagSlugs: meta?.tagSlugs ?? [],
      candidateReviewStatus: meta?.candidateReviewStatus ?? null,
      candidateRawPayload: meta?.candidateRawPayload ?? null,
    });
    if (!assessment.eligible) continue;
    eligible.push({
      rank: eligible.length + 1,
      listingId: row.listingId,
      slug: row.slug,
      title: row.title,
      coverImageUrl: row.coverImageUrl,
      views: 0,
      clicks: 0,
      score: 0,
    });
    if (eligible.length >= 6) break;
  }

  return eligible;
}

async function main() {
  const db = await getDb();
  let picks = (await fetchWeeklyNewsletterPicks(db)).picks;
  if (picks.length < 6) {
    picks = await buildFallbackDemoPicks(db);
  }
  await closeCatalogDb();

  if (picks.length < 6) {
    console.error(`[demo] expected 6 picks, got ${picks.length}`);
    process.exit(1);
  }

  const unsubscribeUrl = "https://www.nsfwdroid.com/api/newsletter/unsubscribe?token=demo-preview";
  const html = renderWeeklyNewsletterHtml({ picks, unsubscribeUrl });
  const text = renderWeeklyNewsletterText({ picks, unsubscribeUrl });

  await mkdir(ARTIFACT_DIR, { recursive: true });
  const htmlPath = join(ARTIFACT_DIR, "newsletter-weekly-demo.html");
  const pngPath = join(ARTIFACT_DIR, "newsletter-weekly-demo.png");
  await writeFile(htmlPath, html, "utf8");
  let artifactPng: string | null = null;
  try {
    if (await renderNewsletterDemoPng(htmlPath, pngPath)) artifactPng = pngPath;
  } catch (e) {
    console.warn("[demo] PNG render failed:", e);
  }

  const from = newsletterFromAddress();
  const results: { to: string; ok: boolean; error?: string }[] = [];

  for (const to of DEMO_RECIPIENTS) {
    const result = await sendNewsletterEmail({
      to,
      subject: DEMO_SUBJECT,
      html,
      text,
    });
    results.push({ to, ok: result.ok, error: result.ok ? undefined : result.error });
  }

  console.log(
    JSON.stringify(
      {
        artifactHtml: htmlPath,
        artifactPng,
        subject: DEMO_SUBJECT,
        from,
        picks: picks.map((p) => ({ rank: p.rank, title: p.title, slug: p.slug })),
        sends: results,
      },
      null,
      2,
    ),
  );

  if (results.some((r) => !r.ok)) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
