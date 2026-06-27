"use client";

import Link from "next/link";
import { useState } from "react";
import { PasswordField } from "@/components/PasswordField";
import { useAuth } from "@/lib/auth";
import { registerAndSignIn } from "@/lib/auth-client";
import type { OrderConfirmationData } from "@/lib/checkout";
import { createSupabaseClient } from "@/lib/supabase";
import { getPasswordRules, validatePassword } from "@/lib/validation";

const PASSWORD_RULE_LABELS: { key: keyof ReturnType<typeof getPasswordRules>; label: string }[] = [
  { key: "minLength", label: "Mínimo 8 caracteres" },
  { key: "uppercase", label: "Una mayúscula" },
  { key: "lowercase", label: "Una minúscula" },
  { key: "number", label: "Un número" },
  { key: "special", label: "Un signo (!@#$%…)" },
];

type Props = {
  data: OrderConfirmationData;
  onAccountCreated?: (message: string) => void;
};

export function PostOrderAccountOffer({ data, onAccountCreated }: Props) {
  const { user, refresh } = useAuth();
  const supabase = createSupabaseClient();

  const [expanded, setExpanded] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  if (!data.wasGuest || user) return null;
  if (resultMessage && !failed) {
    return (
      <div className="mt-6 rounded-2xl border border-neon-cyan/30 bg-neon-cyan/10 p-5 text-sm text-neon-cyan">
        {resultMessage}{" "}
        <Link href="/cuenta/pedidos" className="font-medium text-white underline underline-offset-2">
          Ver mis pedidos
        </Link>
      </div>
    );
  }

  const passwordRules = getPasswordRules(password);

  async function handleCreateAccount() {
    setPasswordError(null);
    setFailed(false);

    const err = validatePassword(password, true);
    if (err) {
      setPasswordError(err);
      return;
    }

    setSubmitting(true);

    const result = await registerAndSignIn(supabase, {
      email: data.customer.email,
      password,
      fullName: data.customer.fullName,
      phone: data.customer.phone,
      defaultAddress: data.customer.address,
      defaultLat: data.customer.lat ?? undefined,
      defaultLng: data.customer.lng ?? undefined,
      addressNotes: data.customer.notes,
      preferredPayment: data.paymentMethod,
      orderId: data.orderId,
      trackToken: data.trackToken,
    });

    if (result.signedIn) {
      await refresh();
      const msg = result.message ?? "Cuenta creada — tu pedido ya está en tu historial.";
      setResultMessage(msg);
      onAccountCreated?.(msg);
      setSubmitting(false);
      return;
    }

    setFailed(true);
    setResultMessage(result.message ?? "No se pudo crear la cuenta. Puedes intentarlo en Acceder.");
    setSubmitting(false);
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm font-medium text-zinc-200">¿Quieres guardar tus datos para la próxima vez?</p>
      <p className="mt-1 text-xs text-zinc-500">
        Tu pedido ya está registrado. Solo elige una contraseña y listo — usaremos el email y la dirección de
        esta orden.
      </p>

      {!expanded ? (
        <button
          type="button"
          className="btn-neon-outline mt-4 w-full py-2.5 text-sm"
          onClick={() => setExpanded(true)}
        >
          Crear mi cuenta (opcional)
        </button>
      ) : (
        <div className="mt-4 space-y-3 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 p-4">
          <div>
            <p className="text-xs text-zinc-500">Email de tu cuenta</p>
            <p className="mt-0.5 text-sm font-medium text-white">{data.customer.email}</p>
          </div>

          <div>
            <PasswordField
              placeholder="Elige una contraseña *"
              value={password}
              onChange={(value) => {
                setPassword(value);
                setPasswordError(null);
              }}
              hasError={!!passwordError}
              autoComplete="new-password"
            />
            {passwordError && <p className="mt-1 text-xs text-red-400">{passwordError}</p>}
          </div>

          <ul className="grid gap-1 text-xs sm:grid-cols-2">
            {PASSWORD_RULE_LABELS.map(({ key, label }) => (
              <li key={key} className={passwordRules[key] ? "text-neon-cyan" : "text-zinc-500"}>
                {passwordRules[key] ? "✓" : "○"} {label}
              </li>
            ))}
          </ul>

          {failed && resultMessage && (
            <p className="text-xs text-amber-200">{resultMessage}</p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="btn-neon flex-1 py-2.5 text-sm"
              disabled={submitting}
              onClick={handleCreateAccount}
            >
              {submitting ? "Creando cuenta…" : "Guardar y crear cuenta"}
            </button>
            <button
              type="button"
              className="btn-neon-outline flex-1 py-2.5 text-sm"
              disabled={submitting}
              onClick={() => {
                setExpanded(false);
                setPassword("");
                setPasswordError(null);
                setFailed(false);
                setResultMessage(null);
              }}
            >
              Ahora no
            </button>
          </div>
        </div>
      )}
    </div>
  );
}