export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, "");

  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
  }

  if (!cleaned.startsWith("+")) {
    if (cleaned.length === 10) {
      cleaned = "+91" + cleaned;
    } else if (cleaned.length === 12 && cleaned.startsWith("91")) {
      cleaned = "+" + cleaned;
    } else if (cleaned.length === 13 && cleaned.startsWith("+91")) {
      cleaned = cleaned;
    } else {
      cleaned = "+91" + cleaned;
    }
  }

  return cleaned;
}

export function isValidPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^\+\d{10,15}$/.test(normalized);
}
