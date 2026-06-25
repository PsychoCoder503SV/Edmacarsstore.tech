"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CheckoutPaymentPanel } from "@/components/CheckoutPaymentPanel";
import { useCart } from "@/components/CartProvider";
import { useAuth } from "@/lib/auth";
import { cartTotal } from "@/lib/cart";
import {
  buildMapUrl,
  generateOrderNumber,
  saveOrderConfirmation,
  type CheckoutCustomer,
  type PaymentMethod,
} from "@/lib/checkout";
import { registerAndSignIn, signInCustomer } from "@/lib/auth-client";
import { createSupabaseClient } from "@/lib/supabase";
import {
  getPasswordRules,
  hasFieldErrors,
  normalizeSvPhone,
  validateCheckoutFields,
  type FieldErrors,
} from "@/lib/validation";

const DeliveryMap = dynamic(() => import("@/components/DeliveryMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-40 items-center justify-center rounded-2xl border border-neon-cyan/20 bg-surface text-xs text-zinc-500">
      Cargando mapa…
    </div>
  ),
});

const PASSWORD_RULE_LABELS: { key: keyof ReturnType<typeof getPasswordRules>; label: string }[] = [
  { key: "minLength", label: "Mínimo 8 caracteres" },
  { key: "uppercase", label: "Una mayúscula" },
  { key: "lowercase", label: "Una minúscula" },
  { key: "number", label: "Un número" },
  { key: "special", label: "Un signo (!@#$%…)" },
];

type CheckoutMode = "guest" | "account";

function inputClass(hasError?: string) {
  return `checkout-input${hasError ? " checkout-input-error" : ""}`;
}

export function CheckoutForm() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const { user, profile, refresh } = useAuth();
  const total = cartTotal(items);
  const supabase = createSupabaseClient();

  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>("guest");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [lat, setLat] = useState(13.798);
  const [lng, setLng] = useState(-88.91);
  const [preferredPayment, setPreferredPayment] = useState<PaymentMethod>("contra_entrega");
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);

  const passwordRules = getPasswordRules(password);
  const isLoggedIn = !!user;

  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? "");
    setFullName(profile?.full_name ?? (user.user_metadata?.full_name as string) ?? "");
    setPhone((profile?.phone ?? "").replace(/^\+503/, ""));
    setAddress(profile?.default_address ?? "");
    setNotes(profile?.address_notes ?? "");
    if (profile?.default_lat != null) setLat(profile.default_lat);
    if (profile?.default_lng != null) setLng(profile.default_lng);
    if (profile?.preferred_payment === "transferencia" || profile?.preferred_payment === "contra_entrega") {
      setPreferredPayment(profile.preferred_payment);
    }
  }, [user, profile]);

  const handleMapChange = useCallback((a: number, b: number) => {
    setLat(a);
    setLng(b);
  }, []);

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
      createAccount: !isLoggedIn && checkoutMode === "guest" && createAccount,
    });
  }

  async function saveOrder(num: string, paymentMethod: PaymentMethod, userId?: string | null) {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderNumber: num,
        paymentMethod,
        customer: customer(),
        total,
        userId: userId ?? null,
        items: items.map((i) => ({
          productId: i.id,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "No se pudo registrar el pedido");
    return data;
  }

  async function maybeCreateAccount(): Promise<{
    userId: string | null;
    accountWarning: string | null;
    accountSuccess: string | null;
  }> {
    if (isLoggedIn) return { userId: user.id, accountWarning: null, accountSuccess: null };
    if (checkoutMode !== "guest" || !createAccount) {
      return { userId: null, accountWarning: null, accountSuccess: null };
    }

    const result = await registerAndSignIn(supabase, {
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      phone: customer().phone,
    });

    if (result.signedIn) {
      await refresh();
      return {
        userId: result.userId,
        accountWarning: null,
        accountSuccess: result.message ?? "Cuenta activa — ya iniciaste sesión.",
      };
    }

    return {
      userId: null,
      accountWarning:
        result.message ??
        "Tu pedido se guardará como invitado. Puedes crear tu cuenta después en Acceder.",
      accountSuccess: null,
    };
  }

  async function handleQuickLogin() {
    setError(null);
    if (!loginEmail || !loginPassword) {
      setError("Ingresa email y contraseña");
      return;
    }
    setSubmitting(true);
    const { ok, message } = await signInCustomer(supabase, loginEmail, loginPassword);
    if (!ok) {
      setError(message ?? "No se pudo iniciar sesión");
      setSubmitting(false);
      return;
    }
    await refresh();
    setSubmitting(false);
    setCheckoutMode("guest");
  }

  async function handleConfirm(payment: PaymentMethod) {
    setError(null);
    const errors = runValidation();
    setFieldErrors(errors);

    if (hasFieldErrors(errors)) {
      setError("Revisa los campos marcados antes de confirmar");
      return;
    }

    if (payment !== "contra_entrega" && payment !== "transferencia") {
      setError("Método de pago no disponible");
      return;
    }

    setSubmitting(true);

    try {
      const num = generateOrderNumber();
      const { userId, accountWarning, accountSuccess } = await maybeCreateAccount();
      const orderRes = await saveOrder(num, payment, userId);

      saveOrderConfirmation({
        orderNumber: num,
        trackToken: orderRes.trackToken,
        paymentMethod: payment,
        customer: customer(),
        items: items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
        total,
        createdAt: new Date().toISOString(),
        accountWarning: accountWarning ?? undefined,
        accountSuccess: accountSuccess ?? undefined,
      });

      clearCart();
      router.replace(`/pedido/confirmado?orden=${encodeURIComponent(num)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al confirmar");
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      {!isLoggedIn ? (
        <div className="rounded-2xl border border-glass glass-surface p-4">
          <p className="text-sm font-medium text-zinc-200">¿Cómo deseas continuar?</p>
          <div className="mt-3 flex rounded-xl border border-white/10 p-1">
            <button
              type="button"
              onClick={() => setCheckoutMode("guest")}
              className={`flex-1 rounded-lg py-2 text-sm transition ${
                checkoutMode === "guest" ? "bg-neon-cyan/15 text-neon-cyan" : "text-zinc-400"
              }`}
            >
              Invitado (guest)
            </button>
            <button
              type="button"
              onClick={() => setCheckoutMode("account")}
              className={`flex-1 rounded-lg py-2 text-sm transition ${
                checkoutMode === "account" ? "bg-neon-cyan/15 text-neon-cyan" : "text-zinc-400"
              }`}
            >
              Ya tengo cuenta
            </button>
          </div>
          {checkoutMode === "account" && (
            <div className="mt-4 space-y-3">
              <input
                className="checkout-input"
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
              <input
                className="checkout-input"
                type="password"
                placeholder="Contraseña"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
              <button
                type="button"
                className="btn-neon-outline w-full py-2.5 text-sm"
                disabled={submitting}
                onClick={handleQuickLogin}
              >
                Iniciar sesión y continuar
              </button>
              <p className="text-center text-xs text-zinc-500">
                ¿No tienes cuenta?{" "}
                <Link href="/cuenta/acceder" className="text-neon-cyan hover:text-white">
                  Crear una
                </Link>
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-neon-cyan/25 bg-neon-cyan/5 px-4 py-3 text-sm text-zinc-300">
          Comprando como <span className="font-medium text-white">{profile?.full_name ?? user.email}</span>
          {" · "}
          <Link href="/cuenta" className="text-neon-cyan hover:text-white">
            Mi cuenta
          </Link>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="order-2 space-y-6 lg:order-1">
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
              disabled={isLoggedIn}
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
            <div className="hidden lg:block">
              <DeliveryMap lat={lat} lng={lng} onChange={handleMapChange} />
            </div>
            <div className="lg:hidden">
              {mobileMapOpen ? (
                <>
                  <DeliveryMap lat={lat} lng={lng} onChange={handleMapChange} />
                  <button
                    type="button"
                    className="mt-2 text-xs text-zinc-500 underline decoration-zinc-600 underline-offset-2"
                    onClick={() => setMobileMapOpen(false)}
                  >
                    Ocultar mapa
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn-neon-outline w-full py-3 text-sm touch-manipulation"
                  onClick={() => setMobileMapOpen(true)}
                >
                  Abrir mapa de entrega (opcional)
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Coordenadas: {lat.toFixed(5)}, {lng.toFixed(5)} ·{" "}
              <a href={buildMapUrl(lat, lng)} target="_blank" rel="noreferrer" className="text-neon-cyan">
                Ver en mapa
              </a>
            </p>
          </div>

          {!isLoggedIn && checkoutMode === "guest" && (
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
                <span className="block text-sm font-medium text-zinc-200">Crear cuenta al confirmar</span>
                <span className="text-xs text-zinc-500">
                  Opcional — guarda tu historial y datos para próximas compras
                </span>
              </span>
            </label>
          )}

          {!isLoggedIn && checkoutMode === "guest" && createAccount && (
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
                  <li key={key} className={passwordRules[key] ? "text-neon-cyan" : "text-zinc-500"}>
                    {passwordRules[key] ? "✓" : "○"} {label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="order-1 lg:order-2">
          <CheckoutPaymentPanel
            items={items}
            total={total}
            initialPayment={preferredPayment}
            error={error}
            submitting={submitting}
            confirmDisabled={!isLoggedIn && checkoutMode === "account"}
            onConfirm={handleConfirm}
            accountGateHint={!isLoggedIn && checkoutMode === "account"}
          />
        </div>
      </div>
    </div>
  );
}