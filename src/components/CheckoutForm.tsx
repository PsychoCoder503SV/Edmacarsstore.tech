"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { cartTotal } from "@/lib/cart";
import {
  BANK_DETAILS,
  PAYMENT_LABELS,
  buildMapUrl,
  formatOrderMessage,
  generateOrderNumber,
  getWhatsAppUrl,
  type CheckoutCustomer,
  type PaymentMethod,
} from "@/lib/checkout";
import {
  getPasswordRules,
  hasFieldErrors,
  normalizeSvPhone,
  validateCheckoutFields,
  type FieldErrors,
} from "@/lib/validation";
import { createClient } from "@supabase/supabase-js";

const DeliveryMap = dynamic(() => import("@/components/DeliveryMap"), { ssr: false });

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

function inputClass(hasError?: string) {
  return `checkout-input${hasError ? " checkout-input-error" : ""}`;
}

export function CheckoutForm() {
  const { items, clearCart } = useCart();
  const total = cartTotal(items);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [lat, setLat] = useState(13.798);
  const [lng, setLng] = useState(-88.91);
  const [payment, setPayment] = useState<PaymentMethod>("contra_entrega");
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);

  const passwordRules = getPasswordRules(password);

  const customer = (): CheckoutCustomer => {
    const normalized = normalizeSvPhone(phone.trim());
    return {
      fullName: fullName.trim(),
      phone: normalized ? `+503${normalized}` : phone.trim(),
      email: email.trim(),
      address: address.trim(),
      notes: notes.trim() || undefined,
      lat,
      lng,
    };
  };

  function runValidation(): FieldErrors {
    return validateCheckoutFields({
      fullName,
      phone,
      email,
      address,
      password,
      createAccount,
    });
  }

  async function saveOrder(num: string, userId?: string | null) {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderNumber: num,
        paymentMethod: payment,
        customer: customer(),
        total,
        userId: userId ?? null,
        items: items.map((i) => ({
          productId: i.id,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "No se pudo registrar el pedido");
    return data;
  }

  async function maybeCreateAccount(): Promise<string | null> {
    if (!createAccount) return null;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error: signErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim(), phone: customer().phone } },
    });
    if (signErr) throw new Error(signErr.message);
    return data.user?.id ?? null;
  }

  async function handleConfirm() {
    setError(null);
    const errors = runValidation();
    setFieldErrors(errors);

    if (hasFieldErrors(errors)) {
      setError("Revisa los campos marcados antes de confirmar");
      return;
    }

    if (!PAYMENT_OPTIONS.find((p) => p.id === payment)?.enabled) {
      setError("Método de pago no disponible");
      return;
    }

    setSubmitting(true);
    const orderItems = [...items];
    const orderCustomer = customer();
    const orderTotal = total;

    try {
      const num = generateOrderNumber();
      const userId = await maybeCreateAccount();
      await saveOrder(num, userId);

      clearCart();

      const msg = formatOrderMessage(num, payment, orderCustomer, orderItems, orderTotal);
      window.location.assign(getWhatsAppUrl(msg));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al confirmar");
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Datos de entrega</h2>
          <p className="mt-1 text-xs text-zinc-500">Información para coordinar tu entrega</p>
        </div>

        <div>
          <input
            className={inputClass(fieldErrors.fullName)}
            placeholder="Nombre completo *"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
            }}
            aria-invalid={!!fieldErrors.fullName}
          />
          {fieldErrors.fullName && <p className="mt-1 text-xs text-red-400">{fieldErrors.fullName}</p>}
        </div>

        <div>
          <input
            className={inputClass(fieldErrors.phone)}
            placeholder="Teléfono * (ej. 7123 4567)"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
            }}
            inputMode="tel"
            aria-invalid={!!fieldErrors.phone}
          />
          {fieldErrors.phone && <p className="mt-1 text-xs text-red-400">{fieldErrors.phone}</p>}
        </div>

        <div>
          <input
            className={inputClass(fieldErrors.email)}
            type="email"
            placeholder="Email *"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
            aria-invalid={!!fieldErrors.email}
          />
          {fieldErrors.email && <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>}
        </div>

        <div>
          <textarea
            className={`${inputClass(fieldErrors.address)} min-h-20`}
            placeholder="Dirección completa de entrega * (calle, número, colonia)"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: undefined }));
            }}
            aria-invalid={!!fieldErrors.address}
          />
          {fieldErrors.address && <p className="mt-1 text-xs text-red-400">{fieldErrors.address}</p>}
        </div>

        <textarea
          className="checkout-input min-h-16"
          placeholder="Referencias (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-300">Ubicación en mapa</p>
          <DeliveryMap lat={lat} lng={lng} onChange={(a, b) => { setLat(a); setLng(b); }} />
          <p className="mt-2 text-xs text-zinc-500">
            Coordenadas: {lat.toFixed(5)}, {lng.toFixed(5)} ·{" "}
            <a href={buildMapUrl(lat, lng)} target="_blank" rel="noreferrer" className="text-neon-cyan">
              Ver en mapa
            </a>
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-4">
          <input
            type="checkbox"
            checked={createAccount}
            onChange={(e) => {
              const checked = e.target.checked;
              setCreateAccount(checked);
              if (!checked) {
                setPassword("");
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-medium text-zinc-200">Crear cuenta (opcional)</span>
            <span className="text-xs text-zinc-500">
              Guarda tus datos y consulta el historial y estado de tus pedidos
            </span>
          </span>
        </label>

        {createAccount && (
          <div className="space-y-3 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 p-4">
            <p className="text-sm font-medium text-zinc-200">Contraseña de tu cuenta</p>
            <input
              className={inputClass(fieldErrors.password)}
              type="password"
              placeholder="Contraseña *"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              autoComplete="new-password"
              aria-invalid={!!fieldErrors.password}
            />
            {fieldErrors.password && <p className="text-xs text-red-400">{fieldErrors.password}</p>}
            <ul className="grid gap-1 text-xs sm:grid-cols-2">
              {PASSWORD_RULE_LABELS.map(({ key, label }) => (
                <li
                  key={key}
                  className={passwordRules[key] ? "text-neon-cyan" : "text-zinc-500"}
                >
                  {passwordRules[key] ? "✓" : "○"} {label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Método de pago</h2>
          <p className="mt-1 text-xs text-zinc-500">Elige cómo deseas pagar</p>
        </div>

        <div className="space-y-2">
          {PAYMENT_OPTIONS.map((opt) => (
            <label
              key={opt.id}
              className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
                payment === opt.id
                  ? "border-neon-cyan/40 bg-neon-cyan/5"
                  : "border-white/10 opacity-80"
              } ${!opt.enabled ? "cursor-not-allowed opacity-40" : ""}`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payment"
                  disabled={!opt.enabled}
                  checked={payment === opt.id}
                  onChange={() => setPayment(opt.id)}
                />
                <span className="text-sm text-zinc-200">{PAYMENT_LABELS[opt.id]}</span>
              </div>
              {opt.hint && <span className="text-xs text-zinc-500">{opt.hint}</span>}
            </label>
          ))}
        </div>

        {payment === "transferencia" && (
          <div className="rounded-xl border border-neon-magenta/25 bg-neon-magenta/5 p-5 text-sm">
            <p className="font-semibold text-white">Datos para transferencia</p>
            <ul className="mt-3 space-y-1 text-zinc-300">
              <li>Cliente: {BANK_DETAILS.client}</li>
              <li>Número de cuenta BAC: {BANK_DETAILS.accountNumber}</li>
              <li>Tipo de cuenta: {BANK_DETAILS.accountType}</li>
              <li>Banco: {BANK_DETAILS.bank}</li>
            </ul>
          </div>
        )}

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
          className="btn-neon w-full py-3 text-sm"
          disabled={submitting}
          onClick={handleConfirm}
        >
          {submitting ? "Procesando pedido…" : "Confirmar pedido"}
        </button>
      </div>
    </div>
  );
}