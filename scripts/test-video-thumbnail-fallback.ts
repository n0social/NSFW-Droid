import assert from "node:assert/strict";
import { posterUrlFromVideoEnclosure } from "../src/lib/video-thumbnail";

assert.equal(
  posterUrlFromVideoEnclosure(
    "https://sfmcompile.club/wp-content/uploads/2026/10/Alyssa-and-Grace-riding-lesson.mp4",
  ),
  "https://sfmcompile.club/wp-content/uploads/2026/10/Alyssa-and-Grace-riding-lesson.jpg",
);

assert.equal(posterUrlFromVideoEnclosure("https://example.com/foo.webm"), null);

console.log("test-video-thumbnail-fallback: ok");
