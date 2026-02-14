interface ValidationResult {
  readonly valid: boolean;
  readonly error?: string;
}

const PASSWORD_MIN_LENGTH = 8;

export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, error: "Password is required" };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    };
  }
  return { valid: true };
}

export function validatePasswordMatch(
  password: string,
  confirm: string
): ValidationResult {
  if (password !== confirm) {
    return { valid: false, error: "Passwords do not match" };
  }
  return { valid: true };
}

export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { valid: false, error: "Email is required" };
  }
  // Basic format check — real validation happens server-side
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Please enter a valid email address" };
  }
  return { valid: true };
}

export function validateSignupForm(fields: {
  readonly email: string;
  readonly fullName: string;
  readonly password: string;
  readonly confirmPassword: string;
}): ValidationResult {
  if (!fields.fullName.trim()) {
    return { valid: false, error: "Full name is required" };
  }

  const emailResult = validateEmail(fields.email);
  if (!emailResult.valid) return emailResult;

  const passwordResult = validatePassword(fields.password);
  if (!passwordResult.valid) return passwordResult;

  const matchResult = validatePasswordMatch(
    fields.password,
    fields.confirmPassword
  );
  if (!matchResult.valid) return matchResult;

  return { valid: true };
}
