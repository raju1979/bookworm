/** Matches Firebase Auth password policy for this project. */
export const PASSWORD_POLICY = {
  minLength: 7,
  maxLength: 10,
  requireSpecial: true,
};

const SPECIAL_CHAR_RE = /[^A-Za-z0-9]/;

export function getPasswordPolicyHint() {
  return `Password: ${PASSWORD_POLICY.minLength}–${PASSWORD_POLICY.maxLength} characters, include a special character (!@#$…)`;
}

/**
 * @param {string} password
 * @returns {string|null} Error message, or null if valid
 */
export function validatePassword(password) {
  if (!password) {
    return 'Please enter a password';
  }
  if (password.length < PASSWORD_POLICY.minLength) {
    return `Password must be at least ${PASSWORD_POLICY.minLength} characters`;
  }
  if (password.length > PASSWORD_POLICY.maxLength) {
    return `Password must be at most ${PASSWORD_POLICY.maxLength} characters`;
  }
  if (PASSWORD_POLICY.requireSpecial && !SPECIAL_CHAR_RE.test(password)) {
    return 'Password must include at least one special character (e.g. !@#$%^&*)';
  }
  return null;
}
