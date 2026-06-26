import { findUserByEmail } from "@/lib/auth-admin";
import { hashOtpCode, normalizeResetEmail, OTP_MAX_ATTEMPTS } from "@/lib/password-reset";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { validateEmail, validatePassword } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      otp?: string;
      newPassword?: string;
    };

    const email = body.email?.trim() ?? "";
    const otp = body.otp?.trim() ?? "";
    const newPassword = body.newPassword ?? "";

    const emailErr = validateEmail(email);
    const passErr = validatePassword(newPassword, true);

    if (emailErr || passErr) {
      return NextResponse.json(
        { error: emailErr ?? passErr ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: "El código debe tener 6 dígitos" }, { status: 400 });
    }

    const normalized = normalizeResetEmail(email);
    const supabase = createSupabaseAdmin();
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
      return NextResponse.json({ error: "Código inválido o expirado" }, { status: 400 });
    }

    const expectedHash = hashOtpCode(email, otp);
    if (pending.otp_hash !== expectedHash) {
      const attempts = (pending.attempts ?? 0) + 1;
      await supabase.from("password_reset_otps").update({ attempts }).eq("id", pending.id);

      if (attempts >= OTP_MAX_ATTEMPTS) {
        await supabase
          .from("password_reset_otps")
          .update({ used_at: now })
          .eq("id", pending.id);
        return NextResponse.json(
          { error: "Demasiados intentos fallidos. Solicita un código nuevo." },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: "Código incorrecto" }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "No encontramos una cuenta con ese email" }, { status: 404 });
    }

    const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    await supabase
      .from("password_reset_otps")
      .update({ used_at: now })
      .eq("id", pending.id);

    return NextResponse.json({
      ok: true,
      message: "Contraseña actualizada. Ya puedes iniciar sesión.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}