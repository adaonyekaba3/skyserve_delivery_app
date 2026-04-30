/**
 * Normalises Nigerian phone numbers to canonical +234XXXXXXXXXX (13 chars).
 * Accepts: +234..., 234..., 0XXXXXXXXXX, raw 10-digit local.
 * Returns null if not a valid Nigerian mobile.
 */
export function normalizeNgPhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = String(input).replace(/[^\d]/g, '');
  if (!digits) return null;

  let local: string;
  if (digits.startsWith('234') && digits.length === 13) {
    local = digits.slice(3);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    local = digits.slice(1);
  } else if (digits.length === 10) {
    local = digits;
  } else {
    return null;
  }

  if (!/^[789]\d{9}$/.test(local)) {
    return null;
  }

  return `+234${local}`;
}

export function isValidNgPhone(input: string | null | undefined): boolean {
  return normalizeNgPhone(input) !== null;
}
