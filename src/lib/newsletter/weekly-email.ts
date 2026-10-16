import { newsletterPublicBaseUrl } from "@/lib/newsletter/config";
import type { WeeklyPick } from "@/lib/newsletter/picks";

const STAR_BASE = "https://www.nsfwdroid.com/newsletter/stars";

type Tier = "gold" | "silver" | "bronze" | "default";

const STAR_IMG: Record<"gold" | "silver" | "bronze", string> = {
  gold: `${STAR_BASE}/gold-star.png`,
  silver: `${STAR_BASE}/silver-star.png`,
  bronze: `${STAR_BASE}/bronze-star.png`,
};

const TIER_STYLES: Record<
  Tier,
  {
    frameShadow: string;
    cardBg: string;
    accent: string;
    borderImg: string | null;
    starRow: string;
  }
> = {
  gold: {
    frameShadow:
      "box-shadow:0 0 0 3px #FBBF24,0 0 0 6px #F59E0B66,0 0 28px #FBBF2488;",
    cardBg:
      "background:linear-gradient(90deg,#3B0764 0%,#581C87 55%,#92400E33 100%);",
    accent: "#FBBF24",
    borderImg: `${STAR_BASE}/frame-gold.png`,
    starRow: `${STAR_IMG.gold} ${STAR_IMG.gold} ${STAR_IMG.gold}`,
  },
  silver: {
    frameShadow:
      "box-shadow:0 0 0 2px #E5E7EB,0 0 0 4px #9CA3AF55,0 0 18px #D1D5DB99;",
    cardBg: "background:linear-gradient(90deg,#2E1065 0%,#3B0764 100%);",
    accent: "#E5E7EB",
    borderImg: `${STAR_BASE}/frame-silver.png`,
    starRow: `${STAR_IMG.silver} ${STAR_IMG.silver}`,
  },
  bronze: {
    frameShadow:
      "box-shadow:0 0 0 2px #D97706,0 0 0 4px #B4530955,0 0 16px #D9770688;",
    cardBg: "background:linear-gradient(90deg,#2E1065 0%,#43140744 100%);",
    accent: "#F59E0B",
    borderImg: `${STAR_BASE}/frame-bronze.png`,
    starRow: `${STAR_IMG.bronze} ${STAR_IMG.bronze}`,
  },
  default: {
    frameShadow: "box-shadow:0 0 0 1px #A78BFA44,0 0 6px #7C3AED33;",
    cardBg: "background:#2E106566;",
    accent: "#C4B5FD",
    borderImg: null,
    starRow: `${STAR_BASE}/accent-star.png`,
  },
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function gameUrl(slug: string, base: string): string {
  return `${base}/game/${encodeURIComponent(slug)}`;
}

function tierForRank(rank: number): Tier {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "default";
}

function starIconsHtml(tier: Tier): string {
  if (tier === "gold") {
    return [STAR_IMG.gold, STAR_IMG.gold, STAR_IMG.gold]
      .map(
        (src) =>
          `<img src="${src}" alt="" width="18" height="18" style="display:inline-block;vertical-align:middle;margin:0 2px;border:0;" />`,
      )
      .join("");
  }
  if (tier === "silver" || tier === "bronze") {
    const src = tier === "silver" ? STAR_IMG.silver : STAR_IMG.bronze;
    return [src, src]
      .map(
        (s) =>
          `<img src="${s}" alt="" width="16" height="16" style="display:inline-block;vertical-align:middle;margin:0 2px;border:0;" />`,
      )
      .join("");
  }
  return `<img src="${STAR_BASE}/accent-star.png" alt="" width="12" height="12" style="display:inline-block;vertical-align:middle;border:0;opacity:0.85;" />`;
}

function coverImage(pick: WeeklyPick, maxWidth: number, height: number): string {
  const title = escapeHtml(pick.title);
  if (pick.coverImageUrl) {
    return `<img src="${escapeHtml(pick.coverImageUrl)}" alt="" width="${maxWidth}" height="${height}" style="display:block;width:100%;max-width:${maxWidth}px;height:auto;border-radius:8px;border:0;" />`;
  }
  return `<div style="width:100%;max-width:${maxWidth}px;min-height:${height}px;border-radius:8px;background:linear-gradient(135deg,#3B0764,#831843);display:flex;align-items:center;justify-content:center;color:#F9A8D4;font:bold 14px/1.3 system-ui,sans-serif;padding:12px;text-align:center;">${title}</div>`;
}

function listPickRow(pick: WeeklyPick, base: string): string {
  const tier = tierForRank(pick.rank);
  const style = TIER_STYLES[tier];
  const href = gameUrl(pick.slug, base);
  const title = escapeHtml(pick.title);
  const imgW = tier === "gold" ? 200 : 168;
  const imgH = tier === "gold" ? 112 : 94;
  const pad = tier === "default" ? "10px 12px" : "14px 14px 14px 12px";
  const cornerStars =
    tier !== "default"
      ? `<td class="pick-corner-star" style="width:28px;vertical-align:top;padding-top:4px;">${starIconsHtml(tier)}</td>`
      : `<td class="pick-corner-star" style="width:20px;vertical-align:middle;">${starIconsHtml(tier)}</td>`;

  const frameWrap = `
    <div class="pick-frame-wrap" style="${style.frameShadow}border-radius:10px;display:inline-block;overflow:hidden;width:100%;max-width:${imgW}px;position:relative;">
      ${coverImage(pick, imgW, imgH)}
    </div>`;

  return `
    <tr class="pick-row">
      <td class="pick-row-gap" style="padding:0 0 14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            ${cornerStars}
            <td class="pick-card-outer" style="vertical-align:middle;">
              <div class="pick-card" style="${style.cardBg}border-radius:12px;padding:${pad};border:1px solid ${style.accent}55;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td class="pick-img-cell stack-column" style="vertical-align:middle;width:${imgW + 16}px;padding-right:12px;">
                      <a href="${href}" style="text-decoration:none;color:#FDF4FF;">${frameWrap}</a>
                    </td>
                    <td class="pick-text-cell stack-column" style="vertical-align:middle;">
                      <a href="${href}" style="text-decoration:none;color:#FDF4FF;">
                        <p class="pick-star-line" style="margin:0 0 6px;text-align:left;line-height:1;">${starIconsHtml(tier)}</p>
                        <p class="pick-title" style="margin:0;font:bold ${tier === "gold" ? "17px" : "15px"}/1.35 system-ui,sans-serif;color:#FDF4FF;">${title}</p>
                      </a>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function sectionDivider(): string {
  const src = `${STAR_BASE}/accent-star.png`;
  const stars = [src, src, src, src, src]
    .map(
      (s) =>
        `<img src="${s}" alt="" width="10" height="10" style="display:inline-block;margin:0 3px;border:0;opacity:0.75;" />`,
    )
    .join("");
  return `<tr><td style="padding:8px 0 16px;text-align:center;line-height:1;">${stars}</td></tr>`;
}

export function renderWeeklyNewsletterHtml(opts: {
  picks: WeeklyPick[];
  unsubscribeUrl: string;
}): string {
  const base = newsletterPublicBaseUrl();
  const byRank = [...opts.picks].sort((a, b) => a.rank - b.rank);
  const gold = byRank.find((p) => p.rank === 1);
  const heroTitle = gold ? escapeHtml(gold.title) : "This week's picks";
  const heroHref = gold ? gameUrl(gold.slug, base) : base;

  const listRows = byRank.map((p) => listPickRow(p, base)).join("");

  const headerStars = [STAR_IMG.gold, STAR_IMG.silver, STAR_IMG.bronze, STAR_IMG.gold]
    .map(
      (src) =>
        `<img src="${src}" alt="" width="14" height="14" style="display:inline-block;margin:0 4px;border:0;" />`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>NSFW Droid — weekly picks</title>
  <style type="text/css">
    .email-container { width: 100% !important; max-width: 600px !important; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    @media only screen and (max-width: 480px) {
      .outer-pad { padding: 20px 12px !important; }
      .hero-block { padding: 0 0 16px !important; }
      .hero-subcopy { margin: 10px 0 0 !important; font-size: 14px !important; }
      .hero-title { font-size: 22px !important; line-height: 1.25 !important; }
      .pick-row-gap { padding: 0 0 16px !important; }
      .pick-card { padding: 12px !important; }
      .pick-corner-star { display: none !important; width: 0 !important; max-height: 0 !important; overflow: hidden !important; }
      .stack-column,
      .pick-img-cell,
      .pick-text-cell {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      .pick-img-cell { padding: 0 0 10px !important; text-align: center !important; }
      .pick-text-cell { padding: 0 !important; text-align: left !important; }
      .pick-frame-wrap { max-width: 100% !important; display: block !important; margin: 0 auto !important; }
      .pick-frame-wrap img,
      .pick-frame-wrap div { max-width: 100% !important; width: 100% !important; height: auto !important; }
      .pick-star-line { text-align: left !important; }
      .footer-block { padding: 20px 0 0 !important; font-size: 11px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#14061C;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(165deg,#14061C 0%,#2E1065 45%,#831843 100%);min-height:100%;">
    <tr>
      <td align="center" class="outer-pad" style="padding:32px 16px;">
        <table role="presentation" class="email-container" width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:0 0 12px;text-align:center;line-height:1;">${headerStars}</td>
          </tr>
          <tr>
            <td class="hero-block" style="padding:0 0 20px;">
              <p style="margin:0 0 8px;font:600 12px/1.4 system-ui,sans-serif;color:#E879F9;text-transform:uppercase;letter-spacing:0.08em;text-align:center;">Members' favorites</p>
              <h1 class="hero-title" style="margin:0;font:800 26px/1.2 system-ui,sans-serif;color:#FDF4FF;text-align:center;">
                <img src="${STAR_IMG.gold}" alt="" width="20" height="20" style="vertical-align:middle;border:0;margin-right:6px;" />
                <a href="${heroHref}" style="color:#FF4D8D;text-decoration:none;">${heroTitle}</a>
                <img src="${STAR_IMG.gold}" alt="" width="20" height="20" style="vertical-align:middle;border:0;margin-left:6px;" />
              </h1>
              <p class="hero-subcopy" style="margin:12px 16px 0;font:15px/1.5 system-ui,sans-serif;color:#E9D5FF;text-align:center;">Six games the community loved this week — top rows shine with gold, silver, and bronze star frames.</p>
            </td>
          </tr>

          ${sectionDivider()}

          ${listRows}

          ${sectionDivider()}

          <tr>
            <td class="footer-block" style="padding:28px 0 0;font:12px/1.6 system-ui,sans-serif;color:#C4B5FD;text-align:center;">
              <p style="margin:0 0 8px;">18+ only. Catalog links only — purchases happen on partner stores.</p>
              <p style="margin:0 0 8px;"><a href="${base}/affiliate" style="color:#FF4D8D;">Affiliate disclosure</a> · <a href="${base}" style="color:#FF4D8D;">nsfwdroid.com</a></p>
              <p style="margin:0;"><a href="${escapeHtml(opts.unsubscribeUrl)}" style="color:#A78BFA;">Unsubscribe</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderWeeklyNewsletterText(opts: {
  picks: WeeklyPick[];
  unsubscribeUrl: string;
}): string {
  const base = newsletterPublicBaseUrl();
  const lines = [...opts.picks]
    .sort((a, b) => a.rank - b.rank)
    .map((p) => `${p.title} — ${gameUrl(p.slug, base)}`);
  return `NSFW Droid — weekly favorites\n\n${lines.join("\n")}\n\n18+ only.\nAffiliate disclosure: ${base}/affiliate\nUnsubscribe: ${opts.unsubscribeUrl}`;
}

export function renderConfirmSubscriptionHtml(opts: { confirmUrl: string }): string {
  return `<!DOCTYPE html>
<html lang="en"><body style="font-family:system-ui,sans-serif;background:#14061C;color:#FDF4FF;padding:24px;">
  <p style="color:#E9D5FF;">Confirm your subscription to NSFW Droid's weekly favorite games list (18+).</p>
  <p><a href="${escapeHtml(opts.confirmUrl)}" style="display:inline-block;background:linear-gradient(90deg,#C026D3,#FF4D8D);color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700;">Confirm subscription</a></p>
  <p style="font-size:12px;color:#A78BFA;">If you didn't request this, ignore this email.</p>
</body></html>`;
}
