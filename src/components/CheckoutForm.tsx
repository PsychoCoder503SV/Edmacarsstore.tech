"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckoutPaymentPanel } from "@/components/CheckoutPaymentPanel";
import { PasswordResetFlow } from "@/components/PasswordResetFlow";
import { useCart } from "@/components/CartProvider";
import { useAuth } from "@/lib/auth";
import { cartTotal } from "@/lib/cart";
import {
  generateOrderNumber,
  saveOrderConfirmation,
  type CheckoutCustomer,
  type PaymentMethod,
} from "@/lib/checkout";
import { signInCustomer } from "@/lib/auth-client";
import { createSupabaseClient } from "@/lib/supabase";
import {
  DEFAULT_DELIVERY_LAT,
  DEFAULT_DELIVERY_LNG,
  isDefaultCoords,
  loadDeliveryLocationCache,
  saveDeliveryLocationCache,
} from "@/lib/delivery-location-cache";
import { syncBrowserCacheToProfile } from "@/lib/profile-delivery";
import {
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
  const [lat, setLat] = useState(DEFAULT_DELIVERY_LAT);
  const [lng, setLng] = useState(DEFAULT_DELIVERY_LNG);
  const [preferredPayment, setPreferredPayment] = useState<PaymentMethod>("contra_entrega");
  const [mapOpen, setMapOpen] = useState(false);
  const [locationPinSet, setLocationPinSet] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);
  const profileSyncRef = useRef(false);

  const isLoggedIn = !!user;
  const showCheckoutFlow = isLoggedIn || checkoutMode === "guest";
  const hasSavedAddress = !!(isLoggedIn && profile?.default_address?.trim());
  const savedAddressHasPin =
    profile?.default_lat != null &&
    profile?.default_lng != null &&
    !isDefaultCoords(profile.default_lat, profile.default_lng);
  const showSavedAddressCard = hasSavedAddress && !useNewAddress;
  const guestLocationCache = !isLoggedIn ? loadDeliveryLocationCache() : null;
  const mapPreferSavedLocation =
    !useNewAddress &&
    (savedAddressHasPin ||
      Boolean(
        guestLocationCache?.mapOnboardingDone &&
          !isDefaultCoords(guestLocationCache.lat, guestLocationCache.lng)
      ));

  useEffect(() => {
    if (user) return;
    const cache = loadDeliveryLocationCache();
    if (!cache) return;
    if (cache.mapOnboardingDone && !isDefaultCoords(cache.lat, cache.lng)) {
      setLat(cache.lat);
      setLng(cache.lng);
      setLocationPinSet(true);
    }
    if (cache.address) setAddress(cache.address);
    if (cache.notes) setNotes(cache.notes);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? "");
    setFullName(profile?.full_name ?? (user.user_metadata?.full_name as string) ?? "");
    setPhone((profile?.phone ?? "").replace(/^\+503/, ""));
    setAddress(profile?.default_address ?? "");
    setNotes(profile?.address_notes ?? "");
    if (profile?.default_lat != null) setLat(profile.default_lat);
    if (profile?.default_lng != null) setLng(profile.default_lng);
    if (savedAddressHasPin) setLocationPinSet(true);
    if (profile?.preferred_payment === "transferencia" || profile?.preferred_payment === "contra_entrega") {
      setPreferredPayment(profile.preferred_payment);
    }
    if (profile?.default_address?.trim()) {
      setUseNewAddress(false);
      if (savedAddressHasPin) {
        saveDeliveryLocationCache({
          lat: profile.default_lat!,
          lng: profile.default_lng!,
          address: profile.default_address,
          notes: profile.address_notes ?? undefined,
          mapOnboardingDone: true,
        });
      }
    }
  }, [user, profile, savedAddressHasPin]);

  useEffect(() => {
    if (!user?.id) {
      profileSyncRef.current = false;
      return;
    }
    if (profileSyncRef.current) return;
    profileSyncRef.current = true;

    const normalized = normalizeSvPhone(phone.trim());
    void syncBrowserCacheToProfile(supabase, profile, {
      address,
      notes,
      fullName: fullName.trim() || profile?.full_name || undefined,
      phone: normalized ? `+503${normalized}` : profile?.phone ?? undefined,
      preferredPayment,
    }).then((synced) => {
      if (synced) void refresh();
    });
  }, [user?.id, profile, supabase, refresh, address, notes, fullName, phone, preferredPayment]);

  useEffect(() => {
    if (isLoggedIn || showSavedAddressCard) return;
    const timer = window.setTimeout(() => {
      saveDeliveryLocationCache({
        lat,
        lng,
        address,
        notes,
        mapOnboardingDone:
          loadDeliveryLocationCache()?.mapOnboardingDone ?? locationPinSet,
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [lat, lng, address, notes, isLoggedIn, showSavedAddressCard, locationPinSet]);

  const handleMapChange = useCallback((a: number, b: number) => {
    setLat(a);
    setLng(b);
    setLocationPinSet(true);
  }, []);

  const handleUseNewAddress = useCallback(() => {
    setUseNewAddress(true);
    setAddress("");
    setNotes("");
    setLat(DEFAULT_DELIVERY_LAT);
    setLng(DEFAULT_DELIVERY_LNG);
    setLocationPinSet(false);
    setMapOpen(false);
    setFieldErrors((prev) => ({ ...prev, address: undefined }));
  }, []);

  const handleUseSavedAddress = useCallback(() => {
    if (!profile) return;
    setUseNewAddress(false);
    setAddress(profile.default_address ?? "");
    setNotes(profile.address_notes ?? "");
    if (profile.default_lat != null) setLat(profile.default_lat);
    if (profile.default_lng != null) setLng(profile.default_lng);
    setLocationPinSet(savedAddressHasPin);
    setFieldErrors((prev) => ({ ...prev, address: undefined }));
  }, [profile, savedAddressHasPin]);

  const customer = (): CheckoutCustomer => {
    const normalized = normalizeSvPhone(phone.trim());
    let orderLat: number | null = null;
    let orderLng: number | null = null;

    if (showSavedAddressCard && savedAddressHasPin && profile) {
      orderLat = profile.default_lat;
      orderLng = profile.default_lng;
    } else if (locationPinSet && !isDefaultCoords(lat, lng)) {
      orderLat = lat;
      orderLng = lng;
    }

    return {
      fullName: fullName.trim(),
      phone: normalized ? `+503${normalized}` : phone.trim(),
      email: email.trim(),
      address: address.trim(),
      notes: notes.trim() || undefined,
      lat: orderLat,
      lng: orderLng,
    };
  };

  function runValidation(): FieldErrors {
    return validateCheckoutFields({
      fullName,
      phone,
      email,
      address,
      password: "",
      createAccount: false,
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
    setShowPasswordReset(false);
    setLoginSuccess(null);
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
      const orderRes = await saveOrder(num, payment, isLoggedIn ? user.id : null);

      saveOrderConfirmation({
        orderNumber: num,
        orderId: orderRes.orderId,
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
        wasGuest: !isLoggedIn,
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
              onClick={() => {
                setCheckoutMode("guest");
                setShowPasswordReset(false);
                setError(null);
              }}
              className={`flex-1 rounded-lg py-2 text-sm transition ${
                checkoutMode === "guest" ? "bg-neon-cyan/15 text-neon-cyan" : "text-zinc-400"
              }`}
            >
              Invitado (guest)
            </button>
            <button
              type="button"
              onClick={() => {
                setCheckoutMode("account");
                setShowPasswordReset(false);
                setError(null);
              }}
              className={`flex-1 rounded-lg py-2 text-sm transition ${
                checkoutMode === "account" ? "bg-neon-cyan/15 text-neon-cyan" : "text-zinc-400"
              }`}
            >
              Ya tengo cuenta
            </button>
          </div>
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

      {!showCheckoutFlow ? (
        <div className="mx-auto max-w-lg space-y-6">
          <div className="rounded-2xl border border-glass glass-surface p-6">
            <h2 className="text-lg font-semibold text-white">Inicia sesión para continuar</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Accede con tu cuenta y usaremos tus datos guardados para el pedido.
            </p>

            {showPasswordReset ? (
              <div className="mt-5">
                <PasswordResetFlow
                  initialEmail={loginEmail}
                  onBack={() => {
                    setShowPasswordReset(false);
                    setError(null);
                  }}
                  onSuccess={(message) => {
                    setLoginSuccess(message);
                    setShowPasswordReset(false);
                  }}
                />
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {loginSuccess && <p className="text-sm text-neon-cyan">{loginSuccess}</p>}
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
                  className="btn-neon w-full py-2.5 text-sm"
                  disabled={submitting}
                  onClick={handleQuickLogin}
                >
                  {submitting ? "Ingresando…" : "Iniciar sesión y continuar"}
                </button>
                <button
                  type="button"
                  className="w-full text-center text-xs text-neon-cyan hover:text-white"
                  onClick={() => {
                    setShowPasswordReset(true);
                    setError(null);
                    setLoginSuccess(null);
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
                <p className="text-center text-xs text-zinc-500">
                  ¿No tienes cuenta?{" "}
                  <Link href="/cuenta/acceder" className="text-neon-cyan hover:text-white">
                    Crear una
                  </Link>
                  {" · "}
                  <button
                    type="button"
                    className="text-neon-cyan hover:text-white"
                    onClick={() => {
                      setCheckoutMode("guest");
                      setError(null);
                    }}
                  >
                    Comprar como invitado
                  </button>
                </p>
              </div>
            )}

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          </div>

          <div className="rounded-xl border border-glass glass-surface-elevated p-5">
            <p className="text-sm text-zinc-400">Tu carrito</p>
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
              <span className="text-lg font-bold text-neon-cyan">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      ) : (
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

          {showSavedAddressCard ? (
            <div className="checkout-saved-address-card">
              <div className="flex items-start gap-3">
                <span className="checkout-saved-address-icon" aria-hidden>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"
                      stroke="currentColor"
                      strokeWidth="1.75"
                    />
                    <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.75" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-neon-cyan">
                    Dirección guardada
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">{profile?.default_address}</p>
                  {profile?.address_notes && (
                    <p className="mt-1 text-xs text-zinc-400">{profile.address_notes}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="btn-neon-outline mt-4 w-full py-2.5 text-sm"
                onClick={handleUseNewAddress}
              >
                Enviar a una dirección nueva
              </button>
            </div>
          ) : (
            <>
              {hasSavedAddress && useNewAddress && (
                <button
                  type="button"
                  className="text-xs text-neon-cyan underline decoration-neon-cyan/40 underline-offset-2 hover:text-white"
                  onClick={handleUseSavedAddress}
                >
                  Usar mi dirección guardada
                </button>
              )}

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
                <p className="mb-2 text-sm font-medium text-zinc-300">
                  Ubicación en mapa{" "}
                  <span className="font-normal text-zinc-500">(opcional — para entrega más precisa)</span>
                </p>
                {mapOpen ? (
                  <>
                    <DeliveryMap
                      lat={lat}
                      lng={lng}
                      onChange={handleMapChange}
                      preferSavedLocation={mapPreferSavedLocation}
                    />
                    <button
                      type="button"
                      className="mt-2 text-xs text-zinc-500 underline decoration-zinc-600 underline-offset-2"
                      onClick={() => setMapOpen(false)}
                    >
                      Ocultar mapa
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn-neon-outline w-full py-3 text-sm touch-manipulation"
                    onClick={() => setMapOpen(true)}
                  >
                    Marcar ubicación en mapa (opcional)
                  </button>
                )}
                {locationPinSet && !isDefaultCoords(lat, lng) && !mapOpen && (
                  <p className="mt-2 text-xs text-neon-cyan">Pin de entrega guardado para este pedido.</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="order-1 lg:order-2">
          <CheckoutPaymentPanel
            items={items}
            total={total}
            initialPayment={preferredPayment}
            error={error}
            submitting={submitting}
            confirmDisabled={false}
            onConfirm={handleConfirm}
          />
        </div>
      </div>
      )}
    </div>
  );
}