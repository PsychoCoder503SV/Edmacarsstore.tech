import { isDefaultCoords } from "@/lib/delivery-location-cache";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type Body = {
  address?: string;
  notes?: string;
  lat?: number;
  lng?: number;
  fullName?: string;
  phone?: string;
  preferredPayment?: string;
};

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

    if (userErr || !user) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    const body = (await request.json()) as Body;
    const lat = typeof body.lat === "number" ? body.lat : null;
    const lng = typeof body.lng === "number" ? body.lng : null;
    const address = body.address?.trim() ?? "";

    if (!address) {
      return NextResponse.json({ error: "Escribe la dirección antes de guardar." }, { status: 400 });
    }

    const hasCoords = lat != null && lng != null && !isDefaultCoords(lat, lng);

    const admin = createSupabaseAdmin();
    const { error } = await admin.from("profiles").upsert(
      {
        id: user.id,
        full_name: body.fullName?.trim() || user.user_metadata?.full_name || null,
        phone: body.phone?.trim() || null,
        default_address: address,
        default_lat: hasCoords ? lat : null,
        default_lng: hasCoords ? lng : null,
        address_notes: body.notes?.trim() || null,
        preferred_payment: body.preferredPayment?.trim() || null,
        role: "customer",
      },
      { onConflict: "id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}