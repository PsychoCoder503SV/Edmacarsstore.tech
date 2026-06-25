import type { CartItem } from "@/lib/cart";

export type PaymentMethod = "contra_entrega" | "transferencia" | "paypal" | "tarjeta";

export const BANK_DETAILS = {
  client: "EDMACARS IMPORT",
  accountNumber: "201562444",
  accountType: "Corriente",
  bank: "BAC Credomatic",
} as const;

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  contra_entrega: "Pago contra entrega (efectivo)",
  transferencia: "Transferencia bancaria",
  paypal: "PayPal",
  tarjeta: "Tarjeta de crédito/débito",
};

export type CheckoutCustomer = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
  lat: number;
  lng: number;
};

export type OrderConfirmationData = {
  orderNumber: string;
  paymentMethod: PaymentMethod;
  customer: CheckoutCustomer;
  items: { name: string; quantity: number; unitPrice: number }[];
  total: number;
  createdAt: string;
  accountWarning?: string;
  accountSuccess?: string;
  trackToken?: string;
};

export const ORDER_CONFIRM_STORAGE_KEY = "edmacars_order_confirm";

export function saveOrderConfirmation(data: OrderConfirmationData): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ORDER_CONFIRM_STORAGE_KEY, JSON.stringify(data));
}

export function loadOrderConfirmation(orderNumber?: string | null): OrderConfirmationData | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(ORDER_CONFIRM_STORAGE_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as OrderConfirmationData;
    if (orderNumber && data.orderNumber !== orderNumber) return null;
    return data;
  } catch {
    return null;
  }
}

export function generateOrderNumber(): string {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `EDMA-${date}-${rand}`;
}

export function buildMapUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}&z=17`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function formatTelegramOrderMessage(
  orderNumber: string,
  payment: PaymentMethod,
  customer: CheckoutCustomer,
  items: CartItem[],
  total: number
): string {
  const lines = items.map(
    (i) =>
      `  • ${escapeHtml(i.name)} ×${i.quantity} — <b>$${(i.price * i.quantity).toFixed(2)}</b>`
  );
  const now = new Date().toLocaleString("es-SV", { dateStyle: "medium", timeStyle: "short" });

  return [
    `<b>🛒 NUEVO PEDIDO — EDMACARS</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `<b>Orden:</b> <code>${escapeHtml(orderNumber)}</code>`,
    `<b>Fecha:</b> ${escapeHtml(now)}`,
    `<b>Pago:</b> ${escapeHtml(PAYMENT_LABELS[payment])}`,
    `<b>Total:</b> $${total.toFixed(2)}`,
    ``,
    `<b>👤 Cliente</b>`,
    escapeHtml(customer.fullName),
    `📱 ${escapeHtml(customer.phone)}`,
    `📧 ${escapeHtml(customer.email)}`,
    ``,
    `<b>📍 Entrega</b>`,
    escapeHtml(customer.address),
    customer.notes ? `📝 ${escapeHtml(customer.notes)}` : "",
    `🗺 <a href="${buildMapUrl(customer.lat, customer.lng)}">Ver ubicación en mapa</a>`,
    ``,
    `<b>🛍 Productos (${items.length})</b>`,
    ...lines,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `<i>Notificación automática — Edmacars Store</i>`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatOrderMessage(
  orderNumber: string,
  payment: PaymentMethod,
  customer: CheckoutCustomer,
  items: CartItem[],
  total: number
): string {
  return formatTelegramOrderMessage(orderNumber, payment, customer, items, total);
}

export function buildShippingRecord(
  orderNumber: string,
  payment: PaymentMethod,
  customer: CheckoutCustomer,
  trackToken?: string
): string {
  return JSON.stringify({
    order_number: orderNumber,
    track_token: trackToken,
    payment_method: payment,
    customer_name: customer.fullName,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    notes: customer.notes ?? "",
    lat: customer.lat,
    lng: customer.lng,
    map_url: buildMapUrl(customer.lat, customer.lng),
  });
}