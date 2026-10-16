export const AGE_VERIFIED_COOKIE = "age_verified";
export const BLUR_COVERS_COOKIE = "blur_covers";

export function parseAgeVerified(value: string | undefined): boolean {
  return value === "1";
}

/** True only when the visitor opted in via Settings (`blur_covers=1`). Age gate forces blur separately. */
export function parseBlurCovers(value: string | undefined): boolean {
  return value === "1";
}
