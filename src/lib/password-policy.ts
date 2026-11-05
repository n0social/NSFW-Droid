/** Customer email/password sign-up rules. Sign-in and admin auth do not use this. */

export const SIGNUP_PASSWORD_RULE =
  "At least 10 characters, including one letter and one number.";

const HAS_LETTER = /\p{L}/u;
const HAS_NUMBER = /[0-9]/;

export class SignupPasswordPolicyError extends Error {
  constructor() {
    super(SIGNUP_PASSWORD_RULE);
    this.name = "SignupPasswordPolicyError";
  }
}

export function signupPasswordMeetsPolicy(password: string): boolean {
  return (
    password.length >= 10 && HAS_LETTER.test(password) && HAS_NUMBER.test(password)
  );
}

/** User-facing rejection copy, or null when the password is allowed. */
export function signupPasswordPolicyMessage(password: string): string | null {
  return signupPasswordMeetsPolicy(password) ? null : SIGNUP_PASSWORD_RULE;
}
