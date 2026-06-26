"use client";

import { memo, useCallback, useState } from "react";
import type { CartItem } from "@/lib/cart";
import { BANK_DETAILS, PAYMENT_LABELS, type PaymentMethod } from "@/lib/checkout";

const PAYMENT_OPTIONS: { id: PaymentMethod; enabled: boolean; hint?: string }[] = [
  { id: "contra_entrega", enabled: true },
  { id: "transferencia", enabled: true },
  { id: "paypal", enabled: false, hint: "Próximamente" },
  { id: "tarjeta", enabled: false, hint: "Próximamente" },
];

type Props = {
  items: CartItem[];
  total: number;
  initialPayment?: PaymentMethod;
  error: string | null;
  submitting: boolean;
  confirmDisabled: boolean;
  onConfirm: (payment: PaymentMethod) => void;
  accountGateHint?: boolean;
};

function CheckoutPaymentPanelInner({
  items,
  total,
  initialPayment = "contra_entrega",
  error,
  submitting,
  confirmDisabled,
  onConfirm,
  accountGateHint,
}: Props) {
  const [payment, setPayment] = useState<PaymentMethod>(
    initialPayment === "transferencia" || initialPayment === "contra_entrega"
      ? initialPayment
      : "contra_entrega"
  );

  const selectPayment = useCallback((id: PaymentMethod) => {
    if (!PAYMENT_OPTIONS.find((p) => p.id === id)?.enabled) return;
    setPayment(id);
  }, []);

  return (
    <div className="checkout-payment-panel space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Método de pago</h2>
        <p className="mt-1 text-xs text-zinc-500">Elige cómo deseas pagar</p>
      </div>

      <div className="space-y-2" role="radiogroup" aria-label="Método de pago">
        {PAYMENT_OPTIONS.map((opt) => {
          const selected = payment === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!opt.enabled}
              onPointerDown={(e) => {
                if (!opt.enabled) return;
                e.preventDefault();
                selectPayment(opt.id);
              }}
              className={`checkout-payment-option flex w-full min-h-[56px] touch-manipulation select-none items-center justify-between rounded-xl border px-4 py-3.5 text-left ${
                selected
                  ? "border-neon-cyan/50 bg-neon-cyan/10"
                  : "border-white/10 bg-white/[0.02]"
              } ${!opt.enabled ? "cursor-not-allowed opacity-40" : ""}`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    selected ? "border-neon-cyan bg-neon-cyan" : "border-zinc-500"
                  }`}
                  aria-hidden
                >
                  {selected && <span className="h-2 w-2 rounded-full bg-surface" />}
                </span>
                <span className="text-sm font-medium text-zinc-100">{PAYMENT_LABELS[opt.id]}</span>
              </span>
              {opt.hint && <span className="text-xs text-zinc-500">{opt.hint}</span>}
            </button>
          );
        })}
      </div>

      <div
        className={`rounded-xl border border-neon-magenta/25 bg-neon-magenta/5 p-5 text-sm ${
          payment === "transferencia" ? "block" : "hidden"
        }`}
        aria-hidden={payment !== "transferencia"}
      >
        <p className="font-semibold text-white">Datos para transferencia</p>
        <ul className="mt-3 space-y-1 text-zinc-300">
          <li>Cliente: {BANK_DETAILS.client}</li>
          <li>Número de cuenta BAC: {BANK_DETAILS.accountNumber}</li>
          <li>Tipo de cuenta: {BANK_DETAILS.accountType}</li>
          <li>Banco: {BANK_DETAILS.bank}</li>
        </ul>
        <p className="mt-3 text-xs text-zinc-500">
          Después de confirmar verás el botón para enviar el comprobante por WhatsApp.
        </p>
      </div>

      <div className="rounded-xl border border-glass glass-surface-elevated p-5">
        <p className="text-sm text-zinc-400">Resumen</p>
        <ul className="mt-3 space-y-2 text-sm text-zinc-300">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-2">
              <span className="truncate">{i.name} x{i.quantity}</span>
              <span>${(i.price * i.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-white/10 pt-4">
          <span className="font-medium text-white">Total</span>
          <span className="text-xl font-bold text-neon-cyan">${total.toFixed(2)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="button"
        className="btn-neon w-full py-3 text-sm touch-manipulation"
        disabled={submitting || confirmDisabled}
        onClick={() => onConfirm(payment)}
      >
        {submitting ? "Procesando pedido…" : "Confirmar pedido"}
      </button>

      {accountGateHint && (
        <p className="text-center text-xs text-zinc-500">Inicia sesión arriba para continuar</p>
      )}
    </div>
  );
}

export const CheckoutPaymentPanel = memo(CheckoutPaymentPanelInner);