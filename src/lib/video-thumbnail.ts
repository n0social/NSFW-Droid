/** SFM Compile RSS: clip `.mp4` and card art `.jpg` share the same basename. */
export function posterUrlFromVideoEnclosure(videoUrl: string): string | null {
  const trimmed = videoUrl
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(parseInt(num, 10)))
    .replace(/&amp;/gi, "&")
    .trim();
  if (!trimmed.startsWith("http")) return null;
  if (!/\.mp4(\?|#|$)/i.test(trimmed)) return null;
  return trimmed.replace(/\.mp4(?=[?#]|$)/i, ".jpg");
}
