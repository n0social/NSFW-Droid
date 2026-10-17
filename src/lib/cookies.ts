export const AGE_VERIFIED_COOKIE = "age_verified";
export const BLUR_COVERS_COOKIE = "blur_covers";

/** Matches POST /api/age-gate and admin/member session bootstrap. */
export const AGE_VERIFIED_MAX_AGE_SEC = 60 * 60 * 24 * 30;

export function ageVerifiedCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: AGE_VERIFIED_MAX_AGE_SEC,
  };
}

export function parseAgeVerified(value: string | undefined): boolean {
  return value === "1";
}

/** True only when the visitor opted in via Settings (`blur_covers=1`). Age gate forces blur separately. */
export function parseBlurCovers(value: string | undefined): boolean {
  return value === "1";
}
