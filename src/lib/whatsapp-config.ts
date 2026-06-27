/** Número WhatsApp para wa.me (comprobantes / confirmación del cliente). */

export function resolveWhatsAppDigits(): string | null {
  const candidates = [
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    process.env.NEXT_PUBLIC_WHATSAPP_PROOF_NUMBER,
    process.env.WHATSAPP_NOTIFY_NUMBER,
    process.env.WHATSAPP_NUMBER,
  ];

  for (const raw of candidates) {
    if (!raw?.trim()) continue;
    const digits = raw.replace(/\D/g, "");
    if (digits.length >= 8) return digits;
  }

  return null;
}

export function formatWhatsAppDisplay(digits: string): string {
  if (digits.startsWith("503") && digits.length === 11) {
    return `+503 ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }
  return `+${digits}`;
}

export function buildWhatsAppMeUrl(digits: string, message: string): string {
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}