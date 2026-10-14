import fs from "node:fs";
import { themeIconPath } from "@/lib/themes/registry";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const file = themeIconPath(id);
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
