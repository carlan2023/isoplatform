// ---------------------------------------------------------------------------
// Password rules shared by registration and password reset.
//
// Kept in one place so the checklist on /login and /reset-password cannot
// drift. Supabase may enforce its own minimum on top of these; the form
// surfaces that error if updateUser / signUp rejects the password.
// ---------------------------------------------------------------------------

export const PASSWORD_RULES: {
  label: string;
  test: (password: string) => boolean;
}[] = [
  { label: "At least 8 characters", test: (password) => password.length >= 8 },
  {
    label: "Upper and lowercase letters",
    test: (password) => /[a-z]/.test(password) && /[A-Z]/.test(password),
  },
  { label: "At least one number", test: (password) => /\d/.test(password) },
];

export function evaluatePassword(
  password: string,
): { label: string; ok: boolean }[] {
  return PASSWORD_RULES.map((rule) => ({
    label: rule.label,
    ok: rule.test(password),
  }));
}

export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

/**
 * Returns the first user-facing problem with a new password, or null when
 * the password meets the rules and matches the confirmation.
 */
export function passwordValidationError(
  password: string,
  confirm: string,
): string | null {
  if (!isPasswordValid(password)) {
    return "Please choose a password that meets all the requirements.";
  }
  if (password !== confirm) {
    return "Passwords do not match.";
  }
  return null;
}
