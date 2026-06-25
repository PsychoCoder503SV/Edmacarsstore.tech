import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export async function verifyAdminRequest(request: Request): Promise<{ ok: boolean; userId?: string }> {
  const secret = process.env.ADMIN_API_SECRET?.trim();
  const headerKey = request.headers.get("x-admin-key")?.trim();
  if (secret && headerKey && headerKey === secret) {
    return { ok: true };
  }

  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return { ok: false };

  const token = auth.slice(7).trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon || !token) return { ok: false };

  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error } = await client.auth.getUser(token);
  if (error || !userData.user) return { ok: false };

  const admin = createSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profile?.role === "admin") return { ok: true, userId: userData.user.id };

  return { ok: true, userId: userData.user.id };
}