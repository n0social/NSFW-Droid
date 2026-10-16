#!/usr/bin/env node
/**
 * Generate transparent vesper-*-cutout.png from full-bleed PNGs via rembg.
 * Run from repo root: node scripts/vesper-cutouts.mjs [pose ...]
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const REMBG = process.env.REMBG_BIN ?? "/home/ubuntu/.local/bin/rembg";
const dir = path.join("data", "mascot", "vesper");

const defaultPoses = [
  "chipper",
  "wink",
  "deals",
  "updates",
  "wave",
  "point",
  "shush",
  "hips",
  "peace-bend",
  "heart-bend",
];

const poses = process.argv.length > 2 ? process.argv.slice(2) : defaultPoses;

function rembg(inPath, outPath) {
  const r = spawnSync(REMBG, ["i", inPath, outPath], { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(`rembg failed for ${inPath}: ${r.stderr || r.stdout}`);
  }
}

for (const pose of poses) {
  const base = `vesper-${pose}`;
  const src1x = path.join(dir, `${base}.png`);
  const src2x = path.join(dir, `${base}@2x.png`);
  const out1x = path.join(dir, `${base}-cutout.png`);
  const out2x = path.join(dir, `${base}-cutout@2x.png`);

  if (!fs.existsSync(src1x)) {
    console.warn("skip missing", src1x);
    continue;
  }

  const tmp1x = path.join(dir, `.tmp-${base}-cutout.png`);
  rembg(src1x, tmp1x);
  await sharp(tmp1x).png().toFile(out1x);
  fs.unlinkSync(tmp1x);

  if (fs.existsSync(src2x)) {
    const tmp2x = path.join(dir, `.tmp-${base}-cutout@2x.png`);
    rembg(src2x, tmp2x);
    await sharp(tmp2x).png().toFile(out2x);
    fs.unlinkSync(tmp2x);
  } else {
    await sharp(out1x).resize(null, 1024, { fit: "inside" }).png().toFile(out2x);
  }

  console.log("cutout", base);
}
