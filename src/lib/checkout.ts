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

export function generateOrderNumber(): string {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `EDMA-${date}-${rand}`;
}

export function buildMapUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}&z=17`;
}

export function formatOrderMessage(
  orderNumber: string,
  payment: PaymentMethod,
  customer: CheckoutCustomer,
  items: CartItem[],
  total: number,
  options?: { transferProof?: boolean }
): string {
  const lines = items.map((i) => `• ${i.name} x${i.quantity} — $${(i.price * i.quantity).toFixed(2)}`);
  const proof = options?.transferProof ? "\n\n📎 Envío comprobante de transferencia bancaria." : "";

  return [
    `🛒 *PEDIDO EDMACARS*`,
    `Orden: *${orderNumber}*`,
    `Pago: ${PAYMENT_LABELS[payment]}`,
    `Total: *$${total.toFixed(2)}*`,
    ``,
    `👤 ${customer.fullName}`,
    `📱 ${customer.phone}`,
    `📧 ${customer.email}`,
    ``,
    `📍 *Dirección de entrega:*`,
    customer.address,
    customer.notes ? `Notas: ${customer.notes}` : "",
    `🗺 ${buildMapUrl(customer.lat, customer.lng)}`,
    ``,
    `🛍 *Productos:*`,
    ...lines,
    proof,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildShippingRecord(
  orderNumber: string,
  payment: PaymentMethod,
  customer: CheckoutCustomer
): string {
  return JSON.stringify({
    order_number: orderNumber,
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