import { linkGuestOrdersByEmail } from "@/lib/order-linking";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      return NextResponse.json({ error: "Configuración incompleta" }, { status: 500 });
    }

    const authClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    const user = userData.user;

    if (userErr || !user?.email) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    const admin = createSupabaseAdmin();
    const linked = await linkGuestOrdersByEmail(admin, user.id, user.email);

    return NextResponse.json({ ok: true, linked });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}