/** True when covers should render blurred (age gate forces blur regardless of preference). */
export function effectiveCoverBlur(ageVerified: boolean, blurCovers: boolean): boolean {
  return !ageVerified || blurCovers;
}
