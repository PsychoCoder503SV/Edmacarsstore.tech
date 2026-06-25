import type { SupabaseClient } from "@supabase/supabase-js";

export type RegisterAndSignInResult = {
  userId: string | null;
  signedIn: boolean;
  created: boolean;
  message: string | null;
};

export function friendlyAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) {
    return "Email o contraseña incorrectos. Si creaste la cuenta en el checkout, usa el mismo email y contraseña.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Tu cuenta existe pero el correo no estaba confirmado. Intenta de nuevo — ya debería funcionar.";
  }
  if (/rate limit|too many/i.test(message)) {
    return "Demasiados intentos seguidos. Espera unos minutos e intenta otra vez.";
  }
  if (/already|registered|exists/i.test(message)) {
    return "Este email ya tiene cuenta. Inicia sesión con tu contraseña.";
  }
  return message;
}

export async function registerAndSignIn(
  supabase: SupabaseClient,
  input: { email: string; password: string; fullName: string; phone?: string }
): Promise<RegisterAndSignInResult> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email.trim(),
      password: input.password,
      fullName: input.fullName.trim(),
      phone: input.phone?.trim(),
    }),
  });

  const data = await res.json();

  if (!res.ok && res.status !== 409) {
    return {
      userId: null,
      signedIn: false,
      created: false,
      message: friendlyAuthError(data.error ?? "No se pudo crear la cuenta"),
    };
  }

  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: input.email.trim(),
    password: input.password,
  });

  if (signInErr) {
    if (res.status === 409) {
      return {
        userId: null,
        signedIn: false,
        created: false,
        message:
          "Este email ya tiene cuenta. Si la creaste en otro pedido, inicia sesión en Acceder con la misma contraseña.",
      };
    }
    return {
      userId: null,
      signedIn: false,
      created: Boolean(data.ok),
      message: friendlyAuthError(signInErr.message),
    };
  }

  return {
    userId: signInData.user?.id ?? data.userId ?? null,
    signedIn: true,
    created: Boolean(data.created ?? data.ok),
    message: data.created
      ? "Cuenta creada y sesión iniciada."
      : "Sesión iniciada con tu cuenta.",
  };
}

export async function signInCustomer(
  supabase: SupabaseClient,
  email: string,
  password: string
): Promise<{ ok: boolean; message: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { ok: false, message: friendlyAuthError(error.message) };
  }

  return { ok: true, message: null };
}