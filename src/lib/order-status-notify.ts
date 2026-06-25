import type { PaymentMethod } from "@/lib/checkout";
import { PAYMENT_LABELS } from "@/lib/checkout";
import { sendOrderStatusEmail } from "@/lib/order-email";
import { parseShippingAddress, ORDER_STATUS_LABELS } from "@/lib/order-tracking";
import { notifyStoreTelegram } from "@/lib/telegram-server";
import { buildOrderTrackUrl } from "@/lib/site-url";

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

const STATUS_EMAIL_COPY: Partial<
  Record<OrderStatus, { headline: string; body: string; subjectSuffix: string }>
> = {
  processing: {
    headline: "Tu orden está siendo procesada",
    body: "Su orden ha sido recibida y en estos momentos está siendo procesada. Te avisaremos cuando salga hacia tu dirección.",
    subjectSuffix: "en proceso",
  },
  shipped: {
    headline: "Tu orden va en camino",
    body: "Tu orden ha sido despachada. Estate pendiente a tu medio de contacto para la entrega; le estaremos comunicando cualquier actualización.",
    subjectSuffix: "en camino",
  },
  delivered: {
    headline: "¡Pedido entregado!",
    body: "Tu orden ha sido entregada correctamente. ¡Gracias por comprar en Edmacars Store!",
    subjectSuffix: "entregado",
  },
  cancelled: {
    headline: "Pedido cancelado",
    body: "Tu orden fue cancelada. Si tienes dudas o necesitas ayuda, contáctanos por WhatsApp o email.",
    subjectSuffix: "cancelado",
  },
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatOrderStatusTelegramMessage(params: {
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  phone?: string;
  email?: string;
  total: number;
  paymentMethod?: PaymentMethod;
}): string {
  const label = ORDER_STATUS_LABELS[params.status] ?? params.status;
  const payment = params.paymentMethod ? PAYMENT_LABELS[params.paymentMethod] : "—";
  const now = new Date().toLocaleString("es-SV", { dateStyle: "medium", timeStyle: "short" });

  return [
    `<b>📦 ACTUALIZACIÓN DE PEDIDO — EDMACARS</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `<b>Orden:</b> <code>${escapeHtml(params.orderNumber)}</code>`,
    `<b>Estado:</b> <b>${escapeHtml(label)}</b>`,
    `<b>Fecha:</b> ${escapeHtml(now)}`,
    `<b>Total:</b> $${params.total.toFixed(2)}`,
    `<b>Pago:</b> ${escapeHtml(payment)}`,
    ``,
    `<b>👤 Cliente</b>`,
    escapeHtml(params.customerName),
    params.phone ? `📱 ${escapeHtml(params.phone)}` : "",
    params.email ? `📧 ${escapeHtml(params.email)}` : "",
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `<i>Notificación automática — Edmacars Store</i>`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function notifyOrderStatusChange(params: {
  orderNumber: string;
  status: OrderStatus;
  shippingAddressRaw: string | null;
  total: number;
  trackToken?: string;
}): Promise<void> {
  const meta = parseShippingAddress(params.shippingAddressRaw);
  if (!meta?.email || !meta.customer_name) return;

  const copy = STATUS_EMAIL_COPY[params.status];
  if (!copy) return;

  const customer = {
    fullName: meta.customer_name,
    phone: meta.phone ?? "",
    email: meta.email,
    address: meta.address ?? "",
    notes: meta.notes,
    lat: 0,
    lng: 0,
  };

  const trackUrl = buildOrderTrackUrl(params.orderNumber, params.trackToken ?? meta.track_token);

  await Promise.allSettled([
    sendOrderStatusEmail({
      orderNumber: params.orderNumber,
      status: params.status,
      customer,
      total: params.total,
      payment: meta.payment_method,
      trackUrl,
      headline: copy.headline,
      body: copy.body,
      subjectSuffix: copy.subjectSuffix,
    }),
    notifyStoreTelegram(
      formatOrderStatusTelegramMessage({
        orderNumber: params.orderNumber,
        status: params.status,
        customerName: meta.customer_name,
        phone: meta.phone,
        email: meta.email,
        total: params.total,
        paymentMethod: meta.payment_method,
      })
    ),
  ]);
}