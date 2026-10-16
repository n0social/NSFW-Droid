/**
 * Generate newsletter star / frame PNGs under public/newsletter/stars/.
 * Usage: npx tsx scripts/generate-newsletter-star-assets.ts
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const OUT_DIR = join(process.cwd(), "public/newsletter/stars");

function starPathSvg(fill: string, stroke: string, size = 64): string {
  const c = size / 2;
  const r = size * 0.38;
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = (Math.PI / 2) * -1 + (i * Math.PI) / 5;
    const radius = i % 2 === 0 ? r : r * 0.42;
    const x = c + Math.cos(rad) * radius;
    const y = c + Math.sin(rad) * radius;
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <polygon points="${points.join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
</svg>`;
}

function frameSvg(stroke: string, glow: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <defs>
    <filter id="g"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect x="8" y="8" width="104" height="104" rx="14" fill="none" stroke="${glow}" stroke-width="6" opacity="0.45"/>
  <rect x="8" y="8" width="104" height="104" rx="14" fill="none" stroke="${stroke}" stroke-width="3"/>
  <text x="14" y="22" font-size="14" fill="${stroke}">★</text>
  <text x="98" y="22" font-size="14" fill="${stroke}">★</text>
  <text x="14" y="112" font-size="14" fill="${stroke}">★</text>
  <text x="98" y="112" font-size="14" fill="${stroke}">★</text>
</svg>`;
}

async function writePng(name: string, svg: string, size?: number) {
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  const path = join(OUT_DIR, name);
  await writeFile(path, buf);
  console.log(`wrote ${path}${size ? ` (${size}px)` : ""}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  await writePng("gold-star.png", starPathSvg("#FBBF24", "#B45309", 72));
  await writePng("silver-star.png", starPathSvg("#F3F4F6", "#6B7280", 72));
  await writePng("bronze-star.png", starPathSvg("#F59E0B", "#92400E", 72));
  await writePng("accent-star.png", starPathSvg("#C4B5FD", "#7C3AED", 48));
  await writePng("frame-gold.png", frameSvg("#FBBF24", "#F59E0B"));
  await writePng("frame-silver.png", frameSvg("#E5E7EB", "#9CA3AF"));
  await writePng("frame-bronze.png", frameSvg("#D97706", "#B45309"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
