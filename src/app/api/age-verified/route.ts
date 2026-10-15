import { NextResponse } from "next/server";
import { isAgeVerifiedRequest } from "@/lib/age-verified-server";

export async function GET() {
  const ok = await isAgeVerifiedRequest();
  return NextResponse.json({ ok });
}
