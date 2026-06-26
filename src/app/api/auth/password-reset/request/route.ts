import { findUserByEmail } from "@/lib/auth-admin";
import {
  generateOtpCode,
  hashOtpCode,
  normalizeResetEmail,
  OTP_RATE_MAX,
  OTP_RATE_WINDOW_MS,
  otpExpiresAt,
  sendPasswordResetOtpEmail,
} from "@/lib/password-reset";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { validateEmail } from "@/lib/validation";
import { NextResponse } from "next/server";

const GENERIC_MESSAGE =
  "Si el email tiene cuenta registrada, enviamos un código de verificación a tu correo.";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim() ?? "";
    const emailErr = validateEmail(email);
    if (emailErr) {
      return NextResponse.json({ error: emailErr }, { status: 400 });
    }

    const normalized = normalizeResetEmail(email);
    const supabase = createSupabaseAdmin();
    const since = new Date(Date.now() - OTP_RATE_WINDOW_MS).toISOString();

    const { count } = await supabase
      .from("password_reset_otps")
      .select("id", { count: "exact", head: true })
      .eq("email", normalized)
      .gte("created_at", since);

    if ((count ?? 0) >= OTP_RATE_MAX) {
      return NextResponse.json(
        { error: "Demasiados intentos. Espera unos minutos e intenta de nuevo." },
        { status: 429 }
      );
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
    }

    const otp = generateOtpCode();
    const otpHash = hashOtpCode(email, otp);

    const { error: insertErr } = await supabase.from("password_reset_otps").insert({
      email: normalized,
      otp_hash: otpHash,
      expires_at: otpExpiresAt(),
    });

    if (insertErr) {
      console.error("[password-reset] insert failed", insertErr);
      return NextResponse.json({ error: "No se pudo generar el código" }, { status: 500 });
    }

    const fullName = (user.user_metadata?.full_name as string) ?? "Cliente";
    const sent = await sendPasswordResetOtpEmail(email, fullName, otp);

    if (!sent) {
      return NextResponse.json(
        { error: "No se pudo enviar el correo. Intenta más tarde o contacta soporte." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}