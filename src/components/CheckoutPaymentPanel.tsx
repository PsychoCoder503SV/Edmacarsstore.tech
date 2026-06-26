"use client";

import { memo, useCallback, useState } from "react";
import type { CartItem } from "@/lib/cart";
import { BANK_DETAILS, PAYMENT_LABELS, type PaymentMethod } from "@/lib/checkout";
import { getPasswordRules } from "@/lib/validation";

const PAYMENT_OPTIONS: { id: PaymentMethod; enabled: boolean; hint?: string }[] = [
  { id: "contra_entrega", enabled: true },
  { id: "transferencia", enabled: true },
  { id: "paypal", enabled: false, hint: "Próximamente" },
  { id: "tarjeta", enabled: false, hint: "Próximamente" },
];

const PASSWORD_RULE_LABELS: { key: keyof ReturnType<typeof getPasswordRules>; label: string }[] = [
  { key: "minLength", label: "Mínimo 8 caracteres" },
  { key: "uppercase", label: "Una mayúscula" },
  { key: "lowercase", label: "Una minúscula" },
  { key: "number", label: "Un número" },
  { key: "special", label: "Un signo (!@#$%…)" },
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
  showCreateAccount?: boolean;
  createAccount?: boolean;
  onCreateAccountChange?: (checked: boolean) => void;
  password?: string;
  onPasswordChange?: (value: string) => void;
  passwordFieldError?: string;
  onClearPasswordError?: () => void;
};

function inputClass(hasError?: string) {
  return `checkout-input${hasError ? " checkout-input-error" : ""}`;
}

function CheckoutPaymentPanelInner({
  items,
  total,
  initialPayment = "contra_entrega",
  error,
  submitting,
  confirmDisabled,
  onConfirm,
  accountGateHint,
  showCreateAccount = false,
  createAccount = false,
  onCreateAccountChange,
  password = "",
  onPasswordChange,
  passwordFieldError,
  onClearPasswordError,
}: Props) {
  const [payment, setPayment] = useState<PaymentMethod>(
    initialPayment === "transferencia" || initialPayment === "contra_entrega"
      ? initialPayment
      : "contra_entrega"
  );

  const passwordRules = getPasswordRules(password);

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

      {showCreateAccount && (
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-4">
            <input
              type="checkbox"
              checked={createAccount}
              onChange={(e) => onCreateAccountChange?.(e.target.checked)}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-200">Crear cuenta al confirmar</span>
              <span className="text-xs text-zinc-500">
                Opcional — guarda tu historial y datos para próximas compras
              </span>
            </span>
          </label>

          {createAccount && (
            <div className="space-y-3 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 p-4">
              <p className="text-sm font-medium text-zinc-200">Contraseña de tu cuenta</p>
              <input
                className={inputClass(passwordFieldError)}
                type="password"
                placeholder="Contraseña *"
                value={password}
                onChange={(e) => {
                  onPasswordChange?.(e.target.value);
                  onClearPasswordError?.();
                }}
                autoComplete="new-password"
                aria-invalid={!!passwordFieldError}
              />
              {passwordFieldError && <p className="text-xs text-red-400">{passwordFieldError}</p>}
              <ul className="grid gap-1 text-xs sm:grid-cols-2">
                {PASSWORD_RULE_LABELS.map(({ key, label }) => (
                  <li key={key} className={passwordRules[key] ? "text-neon-cyan" : "text-zinc-500"}>
                    {passwordRules[key] ? "✓" : "○"} {label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

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