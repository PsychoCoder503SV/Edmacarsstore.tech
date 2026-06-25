import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { validateEmail, validateFullName, validatePassword } from "@/lib/validation";
import { NextResponse } from "next/server";

type RegisterBody = {
  email?: string;
  password?: string;
  fullName?: string;
  phone?: string;
};

async function findUserByEmail(supabase: ReturnType<typeof createSupabaseAdmin>, email: string) {
  const normalized = email.toLowerCase();
  for (let page = 1; page <= 5; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    const user = data.users.find((u) => u.email?.toLowerCase() === normalized);
    if (user) return user;
    if (data.users.length < 200) break;
  }
  return null;
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

      const existing = await findUserByEmail(supabase, email);
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

      await supabase.from("profiles").upsert({
        id: userId,
        full_name: fullName,
        phone: phone || null,
        role: "customer",
      });

      return NextResponse.json({ ok: true, userId, created: false, recovered: true });
    }

    if (userId) {
      await supabase.from("profiles").upsert({
        id: userId,
        full_name: fullName,
        phone: phone || null,
        role: "customer",
      });
    }

    return NextResponse.json({ ok: true, userId, created: !createErr });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al registrar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}