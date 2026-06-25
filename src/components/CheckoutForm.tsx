"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
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
import { createClient } from "@supabase/supabase-js";

const DeliveryMap = dynamic(() => import("@/components/DeliveryMap"), { ssr: false });

const PAYMENT_OPTIONS: { id: PaymentMethod; enabled: boolean; hint?: string }[] = [
  { id: "contra_entrega", enabled: true },
  { id: "transferencia", enabled: true },
  { id: "paypal", enabled: false, hint: "Próximamente" },
  { id: "tarjeta", enabled: false, hint: "Próximamente" },
];

export function CheckoutForm() {
  const router = useRouter();
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
  const [confirmed, setConfirmed] = useState<{
    orderNumber: string;
    payment: PaymentMethod;
    customer: CheckoutCustomer;
    items: typeof items;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const customer = (): CheckoutCustomer => ({
    fullName: fullName.trim(),
    phone: phone.trim(),
    email: email.trim(),
    address: address.trim(),
    notes: notes.trim() || undefined,
    lat,
    lng,
  });

  function validate(): string | null {
    if (!fullName.trim()) return "Nombre completo requerido";
    if (!phone.trim()) return "Teléfono requerido";
    if (!email.trim()) return "Email requerido";
    if (!address.trim()) return "Dirección de entrega requerida";
    if (createAccount && password.length < 6) return "La contraseña debe tener al menos 6 caracteres";
    if (!PAYMENT_OPTIONS.find((p) => p.id === payment)?.enabled) return "Método de pago no disponible";
    return null;
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
      options: { data: { full_name: fullName.trim(), phone: phone.trim() } },
    });
    if (signErr) throw new Error(signErr.message);
    return data.user?.id ?? null;
  }

  async function handleConfirm() {
    setError(null);
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    setSubmitting(true);
    try {
      const num = generateOrderNumber();
      const userId = await maybeCreateAccount();
      await saveOrder(num, userId);

      const msg = formatOrderMessage(num, payment, customer(), items, total);
      window.open(getWhatsAppUrl(msg), "_blank", "noopener,noreferrer");

      setConfirmed({
        orderNumber: num,
        payment,
        customer: customer(),
        items: [...items],
        total,
      });
      clearCart();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al confirmar");
    } finally {
      setSubmitting(false);
    }
  }

  function handleTransferProof() {
    if (!confirmed) return;
    const msg = formatOrderMessage(
      confirmed.orderNumber,
      "transferencia",
      confirmed.customer,
      confirmed.items,
      confirmed.total,
      { transferProof: true }
    );
    window.open(getWhatsAppUrl(msg), "_blank", "noopener,noreferrer");
  }

  if (confirmed) {
    return (
      <div className="mt-8 rounded-2xl border border-neon-cyan/30 bg-neon-cyan/5 p-8 text-center">
        <p className="text-sm text-neon-cyan">¡Pedido registrado!</p>
        <p className="mt-2 font-brand text-3xl text-white">{confirmed.orderNumber}</p>
        <p className="mt-4 text-sm text-zinc-400">
          Te redirigimos a WhatsApp para coordinar la entrega.
          {confirmed.payment === "transferencia" && " Realiza la transferencia y envía tu comprobante."}
        </p>
        {confirmed.payment === "transferencia" && (
          <button type="button" className="btn-neon mt-6 px-6 py-2.5 text-sm" onClick={handleTransferProof}>
            Enviar comprobante de pago
          </button>
        )}
        <button
          type="button"
          className="btn-neon-outline mt-4 block w-full py-2.5 text-sm"
          onClick={() => router.push("/")}
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Datos de entrega</h2>
          <p className="mt-1 text-xs text-zinc-500">Se envían con tu pedido por WhatsApp</p>
        </div>

        <input
          className="checkout-input"
          placeholder="Nombre completo *"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <input
          className="checkout-input"
          placeholder="Teléfono / WhatsApp *"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          className="checkout-input"
          type="email"
          placeholder="Email *"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <textarea
          className="checkout-input min-h-20"
          placeholder="Dirección completa de entrega *"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
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
            onChange={(e) => setCreateAccount(e.target.checked)}
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
          <input
            className="checkout-input"
            type="password"
            placeholder="Contraseña (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
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
            <p className="mt-3 text-xs text-zinc-500">
              Al confirmar, recibirás el número de orden por WhatsApp. Luego envía tu comprobante.
            </p>
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
          {submitting
            ? "Procesando..."
            : payment === "contra_entrega"
              ? "Confirmar pedido y enviar a WhatsApp"
              : payment === "transferencia"
                ? "Confirmar pedido y abrir WhatsApp"
                : "Confirmar pedido"}
        </button>
      </div>
    </div>
  );
}