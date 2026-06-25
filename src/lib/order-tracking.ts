import type { PaymentMethod } from "@/lib/checkout";
import { PAYMENT_LABELS } from "@/lib/checkout";

export type ShippingMeta = {
  order_number: string;
  payment_method?: PaymentMethod;
  customer_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  map_url?: string;
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  processing: "En proceso",
  shipped: "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export const ORDER_STATUS_STEPS = ["pending", "processing", "shipped", "delivered"] as const;

export function parseShippingAddress(raw: string | null): ShippingMeta | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ShippingMeta;
  } catch {
    return null;
  }
}

export function paymentLabel(method?: PaymentMethod): string {
  if (!method || !(method in PAYMENT_LABELS)) return "—";
  return PAYMENT_LABELS[method];
}

export function statusStepIndex(status: string): number {
  const idx = ORDER_STATUS_STEPS.indexOf(status as (typeof ORDER_STATUS_STEPS)[number]);
  return idx >= 0 ? idx : 0;
}

export function normalizeOrderNumber(input: string): string {
  return input.trim().toUpperCase();
}

export const ORDER_NUMBER_RE = /^EDMA-\d{8}-\d{4}$/;