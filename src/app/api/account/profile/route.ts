import { NextResponse } from "next/server";
import { requireSessionUserId } from "@/lib/account-auth";
import {
  getUserProfile,
  parseUserPreferences,
  updateUserProfileFields,
} from "@/lib/user-profile";
import type { UserPreferences } from "@/db/schema";

export async function GET() {
  const uidOrRes = await requireSessionUserId();
  if (uidOrRes instanceof NextResponse) return uidOrRes;

  const profile = await getUserProfile(uidOrRes);
  if (!profile) {
    return NextResponse.json({ ok: false, error: "profile_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    profile: {
      firebase_uid: profile.firebaseUid,
      email: profile.email,
      display_name: profile.displayName,
      newsletter_opt_in: profile.newsletterOptIn,
      preferences: parseUserPreferences(profile.preferences),
    },
  });
}

export async function PATCH(request: Request) {
  const uidOrRes = await requireSessionUserId();
  if (uidOrRes instanceof NextResponse) return uidOrRes;

  const body = await request.json().catch(() => ({}));

  const preferences: UserPreferences | undefined =
    body.preferences !== undefined ? {} : undefined;
  if (body.preferences !== undefined && typeof body.preferences === "object") {
    const p = body.preferences as Record<string, unknown>;
    if (p.theme_preference === "default" || p.theme_preference === "auto") {
      preferences!.theme_preference = p.theme_preference;
    }
    if (typeof p.blur_covers === "boolean") {
      preferences!.blur_covers = p.blur_covers;
    }
  }

  let displayName: string | null | undefined;
  if (body.display_name !== undefined) {
    const raw = body.display_name;
    if (raw === null || raw === "") {
      displayName = null;
    } else {
      displayName = String(raw).trim().slice(0, 80);
    }
  }

  const newsletterOptIn =
    body.newsletter_opt_in !== undefined ? Boolean(body.newsletter_opt_in) : undefined;

  const updated = await updateUserProfileFields(uidOrRes, {
    displayName,
    newsletterOptIn,
    preferences,
  });

  if (!updated) {
    return NextResponse.json({ ok: false, error: "profile_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    profile: {
      firebase_uid: updated.firebaseUid,
      email: updated.email,
      display_name: updated.displayName,
      newsletter_opt_in: updated.newsletterOptIn,
      preferences: parseUserPreferences(updated.preferences),
    },
  });
}
