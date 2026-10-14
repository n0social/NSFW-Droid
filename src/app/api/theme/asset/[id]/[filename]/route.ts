import fs from "node:fs";
import { themeAssetPath } from "@/lib/themes/registry";

type Params = { params: Promise<{ id: string; filename: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id, filename } = await params;
  const file = themeAssetPath(id, filename);
  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  const svg = fs.readFileSync(file);
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
