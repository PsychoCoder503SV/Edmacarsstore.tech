import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    const missing = [!url && "NEXT_PUBLIC_SUPABASE_URL", !key && "SUPABASE_SERVICE_ROLE_KEY"]
      .filter(Boolean)
      .join(", ");
    throw new Error(
      `Faltan credenciales de servidor Supabase (${missing}). En Vercel agrega SUPABASE_SERVICE_ROLE_KEY y redeploy.`
    );
  }

  return createClient(url, key, { auth: { persistSession: false } });
}