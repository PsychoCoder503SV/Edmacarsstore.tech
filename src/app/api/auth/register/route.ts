import { findUserByEmail } from "@/lib/auth-admin";
import { linkOrdersToNewAccount } from "@/lib/order-linking";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { validateEmail, validateFullName, validatePassword } from "@/lib/validation";
import { NextResponse } from "next/server";

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

      await linkOrdersToNewAccount(supabase, userId, email, body.orderId, body.trackToken);

      return NextResponse.json({ ok: true, userId, created: false, recovered: true });
    }

    if (userId) {
      await supabase.from("profiles").upsert(buildProfilePayload(userId, body));
      await linkOrdersToNewAccount(supabase, userId, email, body.orderId, body.trackToken);
    }

    return NextResponse.json({ ok: true, userId, created: !createErr });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al registrar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}