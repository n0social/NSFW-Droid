export const AGE_VERIFIED_COOKIE = "age_verified";
export const BLUR_COVERS_COOKIE = "blur_covers";

export function parseAgeVerified(value: string | undefined): boolean {
  return value === "1";
}

/** Default blur on when cookie unset (testing + bypass protection). */
export function parseBlurCovers(value: string | undefined): boolean {
  if (value === undefined || value === "") return true;
  return value !== "0";
}
