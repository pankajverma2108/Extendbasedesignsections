export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(normalizeEmail(value));
}

export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const startsWithPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/\D/g, "");

  if (!digitsOnly) {
    return "";
  }

  return startsWithPlus ? `+${digitsOnly}` : digitsOnly;
}

export function isValidPhone(value: string, options?: { optional?: boolean }): boolean {
  const normalized = normalizePhone(value);

  if (!normalized) {
    return Boolean(options?.optional);
  }

  const digits = normalized.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}
