/**
 * Normalises Nigerian phone numbers to canonical +234XXXXXXXXXX (13 chars).
 * Returns null when input is not a valid Nigerian mobile.
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

export function formatNgDisplay(phone: string | null | undefined): string {
  const normalized = normalizeNgPhone(phone);
  if (!normalized) return phone ?? '';
  // +234 XXX XXX XXXX
  const local = normalized.slice(4);
  return `+234 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}
