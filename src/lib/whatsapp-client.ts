import type { CheckoutCustomer, PaymentMethod } from "@/lib/checkout";
import { BANK_DETAILS, PAYMENT_LABELS, buildMapUrl, hasDeliveryCoordinates } from "@/lib/checkout";

export function whatsAppNumber(): string | null {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
}

type ProofItem = { name: string; quantity: number; unitPrice: number };

export function formatWhatsAppProofMessage(
  orderNumber: string,
  payment: PaymentMethod,
  customer: CheckoutCustomer,
  items: ProofItem[],
  total: number
): string {
  const lines = items.map(
    (i) => `• ${i.name} ×${i.quantity} — $${(i.unitPrice * i.quantity).toFixed(2)}`
  );
  const now = new Date().toLocaleString("es-SV", { dateStyle: "medium", timeStyle: "short" });

  const proofBlock =
    payment === "transferencia"
      ? [
          "",
          "📎 *COMPROBANTE DE PAGO*",
          "Adjunto captura de la transferencia realizada.",
          `Cuenta: ${BANK_DETAILS.bank} — ${BANK_DETAILS.accountNumber}`,
          `Titular: ${BANK_DETAILS.client}`,
        ]
      : payment === "contra_entrega"
        ? ["", "✅ *CONFIRMACIÓN DE PEDIDO*", "Pago en efectivo al recibir el pedido."]
        : ["", "📎 *COMPROBANTE / CONFIRMACIÓN DE PAGO*"];

  return [
    "🛒 *EDMACARS STORE*",
    "━━━━━━━━━━━━━━━━━━━━",
    `📋 Orden: *${orderNumber}*`,
    `🕐 Fecha: ${now}`,
    `💳 Método: ${PAYMENT_LABELS[payment]}`,
    `💰 Total: *$${total.toFixed(2)}*`,
    "",
    "👤 *CLIENTE*",
    customer.fullName,
    customer.phone,
    customer.email,
    "",
    "📍 *ENTREGA*",
    customer.address,
    customer.notes ? `Ref: ${customer.notes}` : "",
    hasDeliveryCoordinates(customer.lat, customer.lng)
      ? `🗺 ${buildMapUrl(customer.lat!, customer.lng!)}`
      : "",
    "",
    "🛍 *PRODUCTOS*",
    ...lines,
    ...proofBlock,
    "",
    "Gracias por tu compra en Edmacars Store.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildWhatsAppProofUrl(message: string): string | null {
  const number = whatsAppNumber();
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}