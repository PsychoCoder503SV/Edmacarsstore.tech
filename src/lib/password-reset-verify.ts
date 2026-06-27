import { hashOtpCode, normalizeResetEmail, OTP_MAX_ATTEMPTS } from "@/lib/password-reset";
import type { SupabaseClient } from "@supabase/supabase-js";

export type OtpCheckResult =
  | { ok: true; otpId: string }
  | { ok: false; error: string; attemptsExhausted?: boolean };

export async function checkPasswordResetOtp(
  supabase: SupabaseClient,
  email: string,
  otp: string
): Promise<OtpCheckResult> {
  if (!/^\d{6}$/.test(otp)) {
    return { ok: false, error: "El código debe tener 6 dígitos" };
  }

  const normalized = normalizeResetEmail(email);
  const now = new Date().toISOString();

  const { data: pending } = await supabase
    .from("password_reset_otps")
    .select("id, otp_hash, attempts")
    .eq("email", normalized)
    .is("used_at", null)
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!pending) {
    return { ok: false, error: "Código inválido o expirado" };
  }

  const expectedHash = hashOtpCode(email, otp);
  if (pending.otp_hash !== expectedHash) {
    const attempts = (pending.attempts ?? 0) + 1;
    await supabase.from("password_reset_otps").update({ attempts }).eq("id", pending.id);

    if (attempts >= OTP_MAX_ATTEMPTS) {
      await supabase.from("password_reset_otps").update({ used_at: now }).eq("id", pending.id);
      return {
        ok: false,
        error: "Demasiados intentos fallidos. Solicita un código nuevo.",
        attemptsExhausted: true,
      };
    }

    return { ok: false, error: "Código incorrecto" };
  }

  return { ok: true, otpId: pending.id };
}