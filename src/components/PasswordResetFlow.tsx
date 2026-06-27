"use client";

import { useState } from "react";
import { PasswordField } from "@/components/PasswordField";
import {
  getPasswordRules,
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
} from "@/lib/validation";

const PASSWORD_RULE_LABELS: { key: keyof ReturnType<typeof getPasswordRules>; label: string }[] = [
  { key: "minLength", label: "Mínimo 8 caracteres" },
  { key: "uppercase", label: "Una mayúscula" },
  { key: "lowercase", label: "Una minúscula" },
  { key: "number", label: "Un número" },
  { key: "special", label: "Un signo (!@#$%…)" },
];

type Step = "request" | "verify" | "reset" | "done";

type Props = {
  initialEmail?: string;
  onBack: () => void;
  onSuccess?: (message: string) => void;
};

export function PasswordResetFlow({ initialEmail = "", onBack, onSuccess }: Props) {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const passwordRules = getPasswordRules(newPassword);

  async function handleRequestCode() {
    setError(null);
    setInfo(null);
    const emailErr = validateEmail(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo enviar el código");

      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setInfo(
        (data.message ?? "Revisa tu correo.") +
          " El código dura 15 minutos."
      );
      setStep("verify");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al solicitar código");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp() {
    setError(null);
    const emailErr = validateEmail(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Ingresa el código de 6 dígitos del correo");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/password-reset/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Código inválido");

      setInfo(data.message ?? "Código válido. Define tu nueva contraseña.");
      setStep("reset");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al verificar código");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmReset() {
    setError(null);
    const emailErr = validateEmail(email);
    const passErr = validatePassword(newPassword, true);
    const confirmErr = validatePasswordConfirm(newPassword, confirmPassword);

    if (emailErr) {
      setError(emailErr);
      return;
    }
    if (passErr) {
      setError(passErr);
      return;
    }
    if (confirmErr) {
      setError(confirmErr);
      return;
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("El código expiró o no es válido. Solicita uno nuevo.");
      setStep("verify");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: otp.trim(),
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo actualizar la contraseña");

      const msg = data.message ?? "Contraseña actualizada.";
      setStep("done");
      setInfo(msg);
      onSuccess?.(msg);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al confirmar");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "done") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-neon-cyan">{info}</p>
        <button type="button" className="btn-neon w-full py-2.5 text-sm" onClick={onBack}>
          Volver a iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-zinc-200">Recuperar contraseña</p>
        <p className="mt-1 text-xs text-zinc-500">
          {step === "request" &&
            "Te enviaremos un código de 6 dígitos a tu correo (válido 15 minutos)."}
          {step === "verify" && "Ingresa el código del correo. Si es incorrecto, te avisamos antes de cambiar la contraseña."}
          {step === "reset" && "Código verificado. Escribe tu nueva contraseña dos veces para confirmar."}
        </p>
      </div>

      <input
        className="checkout-input"
        type="email"
        placeholder="Email de tu cuenta"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={step !== "request"}
      />

      {(step === "verify" || step === "reset") && (
        <input
          className="checkout-input text-center font-mono tracking-[0.35em]"
          inputMode="numeric"
          maxLength={6}
          placeholder="Código 6 dígitos"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          disabled={step === "reset"}
          readOnly={step === "reset"}
        />
      )}

      {step === "reset" && (
        <>
          <PasswordField
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
          />
          <PasswordField
            placeholder="Confirmar nueva contraseña"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />
          <ul className="grid gap-1 text-xs sm:grid-cols-2">
            {PASSWORD_RULE_LABELS.map(({ key, label }) => (
              <li key={key} className={passwordRules[key] ? "text-neon-cyan" : "text-zinc-500"}>
                {passwordRules[key] ? "✓" : "○"} {label}
              </li>
            ))}
          </ul>
        </>
      )}

      {info && <p className="text-xs text-zinc-400">{info}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex flex-col gap-2 sm:flex-row">
        {step === "request" && (
          <button
            type="button"
            className="btn-neon flex-1 py-2.5 text-sm"
            disabled={submitting}
            onClick={handleRequestCode}
          >
            {submitting ? "Enviando…" : "Enviar código al correo"}
          </button>
        )}
        {step === "verify" && (
          <button
            type="button"
            className="btn-neon flex-1 py-2.5 text-sm"
            disabled={submitting}
            onClick={handleVerifyOtp}
          >
            {submitting ? "Verificando…" : "Verificar código"}
          </button>
        )}
        {step === "reset" && (
          <button
            type="button"
            className="btn-neon flex-1 py-2.5 text-sm"
            disabled={submitting}
            onClick={handleConfirmReset}
          >
            {submitting ? "Guardando…" : "Cambiar contraseña"}
          </button>
        )}
        <button type="button" className="btn-neon-outline flex-1 py-2.5 text-sm" onClick={onBack}>
          Cancelar
        </button>
      </div>

      {(step === "verify" || step === "reset") && (
        <button
          type="button"
          className="w-full text-center text-xs text-neon-cyan hover:text-white"
          disabled={submitting}
          onClick={() => {
            setStep("verify");
            setOtp("");
            setNewPassword("");
            setConfirmPassword("");
            setError(null);
            void handleRequestCode();
          }}
        >
          Reenviar código
        </button>
      )}

      {step === "reset" && (
        <button
          type="button"
          className="w-full text-center text-xs text-zinc-500 hover:text-white"
          onClick={() => {
            setStep("verify");
            setNewPassword("");
            setConfirmPassword("");
            setError(null);
            setInfo("Vuelve a ingresar el código del correo.");
          }}
        >
          ← Cambiar código
        </button>
      )}
    </div>
  );
}