import { findUserByEmail } from "@/lib/auth-admin";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { validateEmail, validateFullName, validatePassword } from "@/lib/validation";
import { NextResponse } from "next/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RegisterBody = {
  email?: string;
  password?: string;
  fullName?: string;
  phone?: string;
  defaultAddress?: string;
  defaultLat?: number;
  defaultLng?: number;
  addressNotes?: string;
  preferredPayment?: string;
  orderId?: string;
  trackToken?: string;
};

type ShippingRecord = {
  order_number?: string;
  track_token?: string;
};

function buildProfilePayload(userId: string, body: RegisterBody) {
  return {
    id: userId,
    full_name: body.fullName?.trim() ?? "",
    phone: body.phone?.trim() || null,
    default_address: body.defaultAddress?.trim() || null,
    default_lat: typeof body.defaultLat === "number" ? body.defaultLat : null,
    default_lng: typeof body.defaultLng === "number" ? body.defaultLng : null,
    address_notes: body.addressNotes?.trim() || null,
    preferred_payment: body.preferredPayment?.trim() || null,
    role: "customer" as const,
  };
}

async function linkOrderToUser(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  userId: string,
  orderId: string,
  trackToken: string
) {
  if (!UUID_RE.test(orderId)) return;

  const { data: order } = await supabase
    .from("orders")
    .select("id, user_id, shipping_address")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.user_id) return;

  try {
    const shipping = JSON.parse(order.shipping_address ?? "{}") as ShippingRecord;
    if (shipping.track_token !== trackToken) return;
  } catch {
    return;
  }

  await supabase.from("orders").update({ user_id: userId }).eq("id", orderId);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody;
    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";
    const fullName = body.fullName?.trim() ?? "";
    const phone = body.phone?.trim() ?? "";

    const emailErr = validateEmail(email);
    const nameErr = validateFullName(fullName);
    const passErr = validatePassword(password, true);

    if (emailErr || nameErr || passErr) {
      return NextResponse.json(
        { error: emailErr ?? nameErr ?? passErr ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone },
    });

    let userId = created.user?.id ?? null;

    if (createErr) {
      const already =
        /already|registered|exists/i.test(createErr.message) ||
        createErr.message.includes("duplicate");

      if (!already) {
        return NextResponse.json({ error: createErr.message }, { status: 400 });
      }

      const existing = await findUserByEmail(email);
      if (!existing) {
        return NextResponse.json(
          { error: "already_registered", message: "Este email ya tiene cuenta" },
          { status: 409 }
        );
      }

      userId = existing.id;

      if (!existing.email_confirmed_at) {
        await supabase.auth.admin.updateUserById(existing.id, { email_confirm: true });
      }

      await supabase.from("profiles").upsert(buildProfilePayload(userId, body));

      if (body.orderId && body.trackToken) {
        await linkOrderToUser(supabase, userId, body.orderId, body.trackToken);
      }

      return NextResponse.json({ ok: true, userId, created: false, recovered: true });
    }

    if (userId) {
      await supabase.from("profiles").upsert(buildProfilePayload(userId, body));

      if (body.orderId && body.trackToken) {
        await linkOrderToUser(supabase, userId, body.orderId, body.trackToken);
      }
    }

    return NextResponse.json({ ok: true, userId, created: !createErr });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al registrar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}