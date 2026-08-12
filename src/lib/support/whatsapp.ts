export const SUPPORT_WHATSAPP_MESSAGE =
  "Halo WAIon Support, saya membutuhkan bantuan.";

/**
 * Builds the wa.me deep link from a raw number string.
 * Expected format: international digits only, no "+", spaces, or dashes.
 * Returns null when the number is empty/unset so callers can hide the
 * support button instead of showing a dummy contact.
 */
export function whatsappSupportHref(number: string): string | null {
  const digits = number.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(SUPPORT_WHATSAPP_MESSAGE)}`;
}

/**
 * Reads NEXT_PUBLIC_SUPPORT_WHATSAPP and returns the wa.me deep link,
 * or null when the variable is empty/unset. Safe on server and client.
 */
export function getWhatsAppSupportHref(): string | null {
  return whatsappSupportHref(
    process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "",
  );
}