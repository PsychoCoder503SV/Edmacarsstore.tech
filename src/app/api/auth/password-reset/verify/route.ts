import { checkPasswordResetOtp } from "@/lib/password-reset-verify";
import { OTP_TTL_MS } from "@/lib/password-reset";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { validateEmail } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; otp?: string };
    const email = body.email?.trim() ?? "";
    const otp = body.otp?.trim() ?? "";

    const emailErr = validateEmail(email);
    if (emailErr) {
      return NextResponse.json({ error: emailErr }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const result = await checkPasswordResetOtp(supabase, email, otp);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const minutes = Math.round(OTP_TTL_MS / 60_000);

    return NextResponse.json({
      ok: true,
      message: `Código válido. Define tu nueva contraseña (el código sigue activo ${minutes} min).`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}