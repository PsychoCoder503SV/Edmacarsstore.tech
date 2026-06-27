import { findUserByEmail } from "@/lib/auth-admin";
import { checkPasswordResetOtp } from "@/lib/password-reset-verify";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { validateEmail, validatePassword, validatePasswordConfirm } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      otp?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    const email = body.email?.trim() ?? "";
    const otp = body.otp?.trim() ?? "";
    const newPassword = body.newPassword ?? "";
    const confirmPassword = body.confirmPassword ?? "";

    const emailErr = validateEmail(email);
    const passErr = validatePassword(newPassword, true);
    const confirmErr = validatePasswordConfirm(newPassword, confirmPassword);

    if (emailErr || passErr || confirmErr) {
      return NextResponse.json(
        { error: emailErr ?? passErr ?? confirmErr ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();
    const now = new Date().toISOString();
    const otpResult = await checkPasswordResetOtp(supabase, email, otp);

    if (!otpResult.ok) {
      return NextResponse.json({ error: otpResult.error }, { status: 400 });
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
      .eq("id", otpResult.otpId);

    return NextResponse.json({
      ok: true,
      message: "Contraseña actualizada. Ya puedes iniciar sesión.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}